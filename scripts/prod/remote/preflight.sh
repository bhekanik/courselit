# Read-only. Everything the host must already be for a deploy to be safe.

for tool in $REMOTE_TOOLS; do
    command -v "$tool" >/dev/null 2>&1 ||
        r_die "production host is missing a required tool: $tool"
done
r_ok "host tools present ($REMOTE_TOOLS)"

arch="$(uname -m)"
[ "$arch" = "$REMOTE_ARCH" ] ||
    r_die "production host architecture is $arch, expected $REMOTE_ARCH"
r_ok "host architecture $arch"

free="$(free_disk_gb "$REMOTE_DIR")"
[ -n "$free" ] || r_die "could not read host free disk for $REMOTE_DIR"
[ "$free" -ge "$MIN_FREE_DISK_GB" ] ||
    r_die "host free disk is $free GiB, below the required $MIN_FREE_DISK_GB GiB (docker load plus a mongodump need headroom)"
r_ok "host free disk $free GiB"

[ -f "$ENV_FILE" ] || r_die "live env file $ENV_FILE is missing from $REMOTE_DIR"
env_mode="$(file_mode "$ENV_FILE")"
[ "$env_mode" = "600" ] ||
    r_die "live env file $ENV_FILE has mode $env_mode, expected 600"
r_ok "$ENV_FILE present, mode 600"

[ -f "$COMPOSE_FILE" ] || r_die "live compose file $COMPOSE_FILE is missing from $REMOTE_DIR"
# --quiet is load-bearing: a bare `config` prints every resolved secret.
compose_base config --quiet ||
    r_die "live compose file $COMPOSE_FILE does not validate"
r_ok "$COMPOSE_FILE validates"

for service in $REQUIRED_SERVICES; do
    require_service_id "$service" >/dev/null
done
r_ok "compose services present ($REQUIRED_SERVICES)"

app_id="$(require_service_id app)"
r_ok "current app image $(docker inspect --format '{{.Image}}' "$app_id")"

shares_network_with_caddy "$app_id" ||
    r_die "app container shares no network with $CADDY_CONTAINER; publishing would break"
r_ok "app shares a network with $CADDY_CONTAINER"

mongo_id="$(require_service_id mongo)"
docker exec "$mongo_id" sh -c 'command -v mongodump >/dev/null 2>&1' ||
    r_die "mongo container cannot run mongodump; a pre-activation backup is impossible"
r_ok "mongo container can run mongodump"
