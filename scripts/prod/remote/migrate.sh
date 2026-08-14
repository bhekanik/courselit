# One committed migration, run once, from the builder-stage image of the same
# commit. Runs under the host deploy lock. Never touches the app service, the
# compose file, the override or the live env file.
# Args: <migration-image> <migration-file> <revision>

image="$1"
migration="$2"
revision="$3"
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

# Pre-mutation backup. Credentials are expanded only inside the mongo
# container; the harness never prints them or sends them over SSH.
docker exec "$mongo_id" sh -c 'exec mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive --gzip --quiet' \
    >"$dir/mongo.archive.gz"
chmod 600 "$dir/mongo.archive.gz"
dump_bytes="$(wc -c <"$dir/mongo.archive.gz" | tr -d ' ')"
[ "$dump_bytes" -ge "$MIN_DUMP_BYTES" ] ||
    r_die "mongodump archive is $dump_bytes bytes, below the $MIN_DUMP_BYTES byte floor; refusing to migrate without a usable backup"
r_ok "pre-migration mongodump $dump_bytes bytes at $dir"

write_meta() {
    {
        printf 'DEPLOY_TS=%s\n' "$DEPLOY_TS"
        printf 'MIGRATION=%s\n' "$migration"
        printf 'MIGRATION_IMAGE=%s\n' "$image"
        printf 'MIGRATION_REVISION=%s\n' "$revision"
        printf 'MIGRATION_NETWORK=%s\n' "$network"
        printf 'MONGODUMP_BYTES=%s\n' "$dump_bytes"
        printf 'OUTCOME=%s\n' "$1"
    } >"$dir/migration.meta"
    chmod 600 "$dir/migration.meta"
}

# The live env file is passed as a file, so no value is ever rendered onto a
# command line or into this script's output.
r_log "running $path once from $image on $network"
if docker run --rm --network "$network" --env-file "$ENV_FILE" \
    --workdir /app --entrypoint "$MIGRATION_RUNNER" "$image" "$path"; then
    write_meta succeeded
    r_ok "migration $migration succeeded; record and backup at $dir"
else
    status=$?
    write_meta failed
    r_die "migration $migration exited $status; the database backup taken before it is at $dir (restore with scripts/prod/restore-db.sh)"
fi
