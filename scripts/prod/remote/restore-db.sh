# Restores the production database from one pre-deploy archive. Destructive by
# design: mongorestore --drop replaces what is there. Runs under the host deploy
# lock. Arg: <backup-id>

backup_id="$1"
dir="$(backup_dir "$backup_id")"
# A restore- record holds the safety dump of the state that restore replaced, so
# undoing a wrong restore means reading that file rather than mongo.archive.gz.
# The id itself is still the only thing that selects a directory, and it was
# pattern-checked on the workstation before it got here.
case "$backup_id" in
restore-*) archive_name=pre-restore.archive.gz ;;
*) archive_name=mongo.archive.gz ;;
esac
archive="$dir/$archive_name"

[ -d "$dir" ] || r_die "no backup directory for id $backup_id at $dir"
[ -f "$archive" ] || r_die "backup $backup_id has no $archive_name; it is a config-only record"
bytes="$(wc -c <"$archive" | tr -d ' ')"
[ "$bytes" -ge "$MIN_DUMP_BYTES" ] ||
    r_die "backup archive is $bytes bytes, below the $MIN_DUMP_BYTES byte floor; refusing to restore from it"
gzip -t "$archive" || r_die "backup $backup_id is not a valid gzip archive"
r_ok "backup $backup_id archive $bytes bytes"

app_id="$(require_service_id app)"
mongo_id="$(require_service_id mongo)"
medialit_id="$(require_service_id medialit)"
app_image="$(docker inspect --format '{{.Config.Image}}' "$app_id")"
docker exec "$mongo_id" sh -c 'command -v mongorestore >/dev/null 2>&1' ||
    r_die "mongo container cannot run mongorestore"

out="$(backup_dir "restore-$DEPLOY_TS")"
if [ -e "$out" ]; then
    r_die "restore record directory $out already exists; refusing to overwrite it"
fi
mkdir -p "$out"
chmod 700 "$out"

write_meta() {
    {
        printf 'DEPLOY_TS=%s\n' "$DEPLOY_TS"
        printf 'RESTORED_FROM=%s\n' "$backup_id"
        printf 'ARCHIVE_BYTES=%s\n' "$bytes"
        printf 'APP_IMAGE=%s\n' "$app_image"
        printf 'MONGO_CONTAINER=%s\n' "$mongo_id"
        printf 'PRE_RESTORE_DUMP_BYTES=%s\n' "${pre_restore_bytes:-0}"
        printf 'VERIFY_DUMP_BYTES=%s\n' "${verify_bytes:-0}"
        printf 'OUTCOME=%s\n' "$1"
    } >"$out/restore.meta"
    chmod 600 "$out/restore.meta"
}

# Stop app writes first: both the safety dump and the restore itself are only
# meaningful against a database nothing else is writing to.
r_log "stopping the app before the pre-restore safety dump"
compose_app stop app || {
    write_meta failed
    r_die "could not stop the app service; refusing to restore under a live writer"
}

# Preserve the state being replaced. This is not a substitute for choosing the
# right restore point, but it keeps a recovery path if the operator chose the
# wrong otherwise-valid archive. Restore it later with backup id restore-<ts>.
if ! docker exec "$mongo_id" sh -c 'exec mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive --gzip --quiet' \
    >"$out/pre-restore.archive.gz"; then
    write_meta failed
    r_die "pre-restore safety dump failed; refusing to overwrite the database, and the app remains stopped -- record at $out"
fi
chmod 600 "$out/pre-restore.archive.gz"
pre_restore_bytes="$(wc -c <"$out/pre-restore.archive.gz" | tr -d ' ')"
[ "$pre_restore_bytes" -ge "$MIN_DUMP_BYTES" ] || {
    write_meta failed
    r_die "pre-restore safety dump is only $pre_restore_bytes bytes; refusing to overwrite the database, and the app remains stopped -- record at $out"
}
r_ok "pre-restore safety dump $pre_restore_bytes bytes at $out"

if ! docker exec -i "$mongo_id" sh -c 'exec mongorestore --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive --gzip --drop --quiet' <"$archive"; then
    write_meta failed
    r_die "mongorestore failed; the app remains stopped because the database may be partially restored -- record at $out"
fi
r_ok "mongorestore --drop completed from backup $backup_id"

# Proving the database is readable again: a dump that comes back at least as
# large as the floor means mongo is serving the restored data, not an empty set.
docker exec "$mongo_id" sh -c 'exec mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive --gzip --quiet' \
    >"$out/verify.archive.gz" || true
chmod 600 "$out/verify.archive.gz"
verify_bytes="$(wc -c <"$out/verify.archive.gz" | tr -d ' ')"
if [ "$verify_bytes" -lt "$MIN_DUMP_BYTES" ]; then
    write_meta failed
    r_die "post-restore verification read only $verify_bytes bytes back out of mongo; the app remains stopped -- record at $out"
fi
r_ok "post-restore verification dump $verify_bytes bytes"

r_log "restarting the app on $app_image"
# Subshell: verify_app calls r_die, and its exit must land here so the record
# says failed rather than the whole run dying with no outcome written.
if ! (compose_app up -d --no-deps app &&
    verify_app "$app_image" "" "$mongo_id" "$medialit_id"); then
    compose_app stop app || true
    write_meta failed
    r_die "the database was restored from $backup_id but the app did not come back; record at $out"
fi

write_meta succeeded
r_ok "database restored from $backup_id; record at $out"
