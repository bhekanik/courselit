# Back up, layer the app-only override, restart the app service, verify.
# Runs under the host deploy lock. Args: <candidate-image> <candidate-revision>

image="$1"
revision="$2"

app_id="$(require_service_id app)"
mongo_id="$(require_service_id mongo)"
medialit_id="$(require_service_id medialit)"
previous_image="$(docker inspect --format '{{.Config.Image}}' "$app_id")"
override_mode=""
image_env_mode=""

dir="$(backup_dir "$DEPLOY_TS")"
if [ -e "$dir" ]; then
    r_die "backup directory $dir already exists; refusing to overwrite it"
fi
mkdir -p "$dir"
chmod 700 "$dir"

cp "$COMPOSE_FILE" "$dir/compose.yml"
cp "$ENV_FILE" "$dir/env"
if [ -f "$OVERRIDE_FILE" ]; then
    override_mode="$(file_mode "$OVERRIDE_FILE")"
    cp "$OVERRIDE_FILE" "$dir/override.yml"
fi
if [ -f "$IMAGE_ENV_FILE" ]; then
    image_env_mode="$(file_mode "$IMAGE_ENV_FILE")"
    cp "$IMAGE_ENV_FILE" "$dir/active-image.env"
fi
chmod 600 "$dir"/*
r_ok "live config backed up to $dir"

restore_previous_app() {
    r_log "restoring the previous app after a pre-activation failure"
    if [ -f "$dir/override.yml" ]; then
        cp "$dir/override.yml" "$OVERRIDE_FILE" || return 1
        chmod "$override_mode" "$OVERRIDE_FILE" || return 1
    else
        rm -f "$OVERRIDE_FILE" || return 1
    fi
    if [ -f "$dir/active-image.env" ]; then
        cp "$dir/active-image.env" "$IMAGE_ENV_FILE" || return 1
        chmod "$image_env_mode" "$IMAGE_ENV_FILE" || return 1
    else
        rm -f "$IMAGE_ENV_FILE" || return 1
    fi
    compose_app config --quiet || return 1
    compose_app up -d --no-deps app || return 1
    (verify_app "$previous_image" "" "$mongo_id" "$medialit_id") || return 1
    r_ok "previous app restored and verified"
}

fail_before_activation() {
    local reason="$1"
    if restore_previous_app; then
        r_die "$reason; previous app restored"
    fi
    r_die "$reason AND the previous app could not be restored; it may remain stopped"
}

# The dump and the candidate must describe the same database state. Keep the
# only application writer stopped from here through candidate activation.
r_log "stopping the app before the deployment dump"
compose_app stop app ||
    fail_before_activation "could not stop the app service; refusing to dump under a live writer"

# mongodump runs inside the container so the credentials stay in the container's
# own environment -- they never reach a command line or a log on either host.
if ! docker exec "$mongo_id" sh -c 'exec mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive --gzip --quiet' \
    >"$dir/mongo.archive.gz"; then
    fail_before_activation "mongodump failed before candidate activation"
fi
chmod 600 "$dir/mongo.archive.gz"
dump_bytes="$(wc -c <"$dir/mongo.archive.gz" | tr -d ' ')"
[ "$dump_bytes" -ge "$MIN_DUMP_BYTES" ] ||
    fail_before_activation "mongodump archive is $dump_bytes bytes, below the $MIN_DUMP_BYTES byte floor; refusing to activate without a usable backup"
r_ok "mongodump archive $dump_bytes bytes"

write_override
write_image_env "$image"
compose_full config --quiet || {
    fail_before_activation "compose does not validate with $OVERRIDE_FILE layered on"
}

# Written only after the backup and candidate config are usable. From this
# point, auto-rollback has everything it needs if candidate activation fails.
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

r_log "activating app only"
compose_full up -d --no-deps app

verify_app "$image" "$revision" "$mongo_id" "$medialit_id"
