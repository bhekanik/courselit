# Manual rollback: point the app at an image the host already has. Runs under
# the host deploy lock. Arg: <image-reference>

image="$1"

docker image inspect "$image" >/dev/null 2>&1 ||
    r_die "no such image on this host: $image (rollback never pulls; transfer it with deploy.sh first)"

app_id="$(require_service_id app)"
mongo_id="$(require_service_id mongo)"
medialit_id="$(require_service_id medialit)"
previous_image="$(docker inspect --format '{{.Config.Image}}' "$app_id")"

# Record what we are about to replace. Config only: a rollback has to be fast,
# and it does not touch the database.
dir="$(backup_dir "rollback-$DEPLOY_TS")"
if [ -e "$dir" ]; then
    r_die "backup directory $dir already exists; refusing to overwrite it"
fi
mkdir -p "$dir"
chmod 700 "$dir"
cp "$COMPOSE_FILE" "$dir/compose.yml"
cp "$ENV_FILE" "$dir/env"
if [ -f "$OVERRIDE_FILE" ]; then cp "$OVERRIDE_FILE" "$dir/override.yml"; fi
if [ -f "$IMAGE_ENV_FILE" ]; then cp "$IMAGE_ENV_FILE" "$dir/active-image.env"; fi
{
    printf 'DEPLOY_TS=%s\n' "$DEPLOY_TS"
    printf 'ROLLBACK_TO_IMAGE=%s\n' "$image"
    printf 'PREVIOUS_IMAGE=%s\n' "$previous_image"
    printf 'MONGO_CONTAINER=%s\n' "$mongo_id"
    printf 'MEDIALIT_CONTAINER=%s\n' "$medialit_id"
} >"$dir/rollback.meta"
chmod 600 "$dir"/*
r_ok "pre-rollback state recorded at $dir"

write_override
write_image_env "$image"
compose_full config --quiet ||
    r_die "compose does not validate with $OVERRIDE_FILE layered on"

r_log "activating app only"
compose_full up -d --no-deps app

verify_app "$image" "" "$mongo_id" "$medialit_id"
