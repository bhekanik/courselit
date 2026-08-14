# One committed migration, run once, from the builder-stage image of the same
# commit. Runs under the host deploy lock. Dry-run leaves the app alone; apply
# stops and restarts it around the migration. Neither mode writes the compose
# file, the override or the live env file.
# Args: <migration-image> <migration-file> <revision> <mode: dry-run|apply>

case "$TARGET_DOMAIN" in
main) ;;
"") r_die "TARGET_DOMAIN must not be empty" ;;
*[!A-Za-z0-9._:/@-]*) r_die "TARGET_DOMAIN contains unsafe characters" ;;
*) r_die "TARGET_DOMAIN must be exactly 'main'" ;;
esac

image="$1"
migration="$2"
revision="$3"
mode="$4"
path="$MIGRATIONS_DIR/$migration"

docker image inspect "$image" >/dev/null 2>&1 ||
    r_die "no such image on this host: $image"
loaded_revision="$(docker image inspect --format "$REVISION_LABEL" "$image")"
[ "$loaded_revision" = "$revision" ] ||
    r_die "migration image revision is '${loaded_revision:-<none>}', not $revision"
r_ok "migration image revision is $revision"

app_id="$(require_service_id app)"
mongo_id="$(require_service_id mongo)"

# The migration must reach mongo exactly the way the app does, so it runs on a
# network both containers already share rather than on a new one.
network="$(shared_network "$app_id" "$mongo_id")" ||
    r_die "app and mongo share no docker network; a one-off migration container could not reach the database"
r_ok "migration network $network"

# Fail closed: the file has to be in the committed image, not merely in the
# repo the operator typed the name from.
docker run --rm --entrypoint sh "$image" -c 'test -f "$1"' sh "/app/$path" ||
    r_die "$path is not present in $image; refusing to run a migration that is not in the committed image"
r_ok "$path present in $image"

dir="$(backup_dir "migrate-$DEPLOY_TS")"
if [ -e "$dir" ]; then
    r_die "backup directory $dir already exists; refusing to overwrite it"
fi
mkdir -p "$dir"
chmod 700 "$dir"

write_meta() {
    {
        printf 'DEPLOY_TS=%s\n' "$DEPLOY_TS"
        printf 'MIGRATION=%s\n' "$migration"
        printf 'MIGRATION_MODE=%s\n' "$mode"
        printf 'MIGRATION_IMAGE=%s\n' "$image"
        printf 'MIGRATION_REVISION=%s\n' "$revision"
        printf 'MIGRATION_NETWORK=%s\n' "$network"
        printf 'MONGODUMP_BYTES=%s\n' "${dump_bytes:-0}"
        printf 'VERIFY_DUMP_BYTES=%s\n' "${verify_bytes:-0}"
        printf 'OUTCOME=%s\n' "$1"
    } >"$dir/migration.meta"
    chmod 600 "$dir/migration.meta"
}

if [ "$mode" = apply ]; then
    medialit_id="$(require_service_id medialit)"
    app_image="$(docker inspect --format '{{.Config.Image}}' "$app_id")"

    # Stop writers first. A dump taken while the app is writing is not a restore
    # point for the state the migration is about to change, and the migration
    # itself would race the app for the same documents.
    r_log "stopping the app before the pre-migration dump"
    compose_app stop app || {
        write_meta failed
        r_die "could not stop the app service; refusing to migrate under a live writer"
    }

    # Pre-mutation backup. Credentials are expanded only inside the mongo
    # container; the harness never prints them or sends them over SSH.
    docker exec "$mongo_id" sh -c 'exec mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive --gzip --quiet' \
        >"$dir/mongo.archive.gz" || {
        write_meta failed
        r_die "pre-migration mongodump failed; the app remains stopped -- record at $dir"
    }
    chmod 600 "$dir/mongo.archive.gz"
    dump_bytes="$(wc -c <"$dir/mongo.archive.gz" | tr -d ' ')"
    [ "$dump_bytes" -ge "$MIN_DUMP_BYTES" ] || {
        write_meta failed
        r_die "mongodump archive is $dump_bytes bytes, below the $MIN_DUMP_BYTES byte floor; refusing to migrate without a usable backup (the app remains stopped)"
    }
    r_ok "pre-migration mongodump $dump_bytes bytes at $dir"
fi

# The live env file is passed as a file, so no value is ever rendered onto a
# command line or into this script's output. The mode reaches the migration
# script itself, so it can honour --dry-run.
r_log "running $path once in $mode mode from $image on $network"
# `if ! cmd` would make $? the negation's 0, so the real code is captured here.
status=0
docker run --rm --network "$network" --env-file "$ENV_FILE" \
    --env "TARGET_DOMAIN=$TARGET_DOMAIN" \
    --workdir /app --entrypoint "$MIGRATION_RUNNER" "$image" "$path" "--$mode" || status=$?
if [ "$status" -ne 0 ]; then
    write_meta failed
    # Not r_die: the operator needs the migration's own exit code, not 1.
    printf 'error: migration %s exited %s in %s mode; record at %s\n' \
        "$migration" "$status" "$mode" "$dir" >&2
    [ "$mode" = apply ] &&
        printf 'error: the app remains stopped; the pre-migration backup is at %s (restore with scripts/prod/restore-db.sh)\n' "$dir" >&2
    exit "$status"
fi

if [ "$mode" = apply ]; then
    # Prove mongo still serves data before letting writers back in: a dump at
    # least as large as the floor means the migration left a readable database.
    docker exec "$mongo_id" sh -c 'exec mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive --gzip --quiet' \
        >"$dir/post-migration.archive.gz" || true
    chmod 600 "$dir/post-migration.archive.gz"
    verify_bytes="$(wc -c <"$dir/post-migration.archive.gz" | tr -d ' ')"
    if [ "$verify_bytes" -lt "$MIN_DUMP_BYTES" ]; then
        write_meta failed
        r_die "post-migration verification read only $verify_bytes bytes back out of mongo; the app remains stopped -- record at $dir"
    fi
    r_ok "post-migration verification dump $verify_bytes bytes"

    r_log "restarting the app on $app_image"
    # Subshell: verify_app calls r_die, and its exit must land here so the record
    # says failed rather than the whole run dying with no outcome written.
    if ! (compose_app up -d --no-deps app &&
        verify_app "$app_image" "" "$mongo_id" "$medialit_id"); then
        compose_app stop app || true
        write_meta failed
        r_die "the app did not come back after migration $migration; record at $dir"
    fi
fi

write_meta succeeded
r_ok "migration $migration succeeded in $mode mode; record at $dir"
