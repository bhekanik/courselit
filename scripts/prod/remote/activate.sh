# Back up, layer the app-only override, restart the app service, verify.
# Runs under the host deploy lock. Args: <candidate-image> <candidate-revision>

image="$1"
revision="$2"

app_id="$(require_service_id app)"
mongo_id="$(require_service_id mongo)"
medialit_id="$(require_service_id medialit)"
previous_image="$(docker inspect --format '{{.Config.Image}}' "$app_id")"

dir="$(backup_dir "$DEPLOY_TS")"
if [ -e "$dir" ]; then
    r_die "backup directory $dir already exists; refusing to overwrite it"
fi
mkdir -p "$dir"
chmod 700 "$dir"

cp "$COMPOSE_FILE" "$dir/compose.yml"
cp "$ENV_FILE" "$dir/env"
if [ -f "$OVERRIDE_FILE" ]; then cp "$OVERRIDE_FILE" "$dir/override.yml"; fi
if [ -f "$IMAGE_ENV_FILE" ]; then cp "$IMAGE_ENV_FILE" "$dir/active-image.env"; fi
chmod 600 "$dir"/*
r_ok "live config backed up to $dir"

# mongodump runs inside the container so the credentials stay in the container's
# own environment -- they never reach a command line or a log on either host.
docker exec "$mongo_id" sh -c 'exec mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive --gzip --quiet' \
    >"$dir/mongo.archive.gz"
chmod 600 "$dir/mongo.archive.gz"
dump_bytes="$(wc -c <"$dir/mongo.archive.gz" | tr -d ' ')"
[ "$dump_bytes" -ge "$MIN_DUMP_BYTES" ] ||
    r_die "mongodump archive is $dump_bytes bytes, below the $MIN_DUMP_BYTES byte floor; refusing to activate without a usable backup"
r_ok "mongodump archive $dump_bytes bytes"

# Deployment record. Deliberately holds references and ids only -- no secrets.
{
    printf 'DEPLOY_TS=%s\n' "$DEPLOY_TS"
    printf 'CANDIDATE_IMAGE=%s\n' "$image"
    printf 'CANDIDATE_REVISION=%s\n' "$revision"
    printf 'PREVIOUS_IMAGE=%s\n' "$previous_image"
    printf 'MONGO_CONTAINER=%s\n' "$mongo_id"
    printf 'MEDIALIT_CONTAINER=%s\n' "$medialit_id"
    printf 'MONGODUMP_BYTES=%s\n' "$dump_bytes"
} >"$(meta_file)"
chmod 600 "$(meta_file)"

write_override
write_image_env "$image"
compose_full config --quiet ||
    r_die "compose does not validate with $OVERRIDE_FILE layered on"

r_log "activating app only"
compose_full up -d --no-deps app

verify_app "$image" "$revision" "$mongo_id" "$medialit_id"
