# Runs on the production host. Concatenated after the generated config block,
# which defines REMOTE_DIR, COMPOSE_FILE, ENV_FILE, OVERRIDE_FILE,
# IMAGE_ENV_FILE, BACKUP_SUBDIR, COMPOSE_PROJECT, CADDY_CONTAINER, REMOTE_ARCH,
# MIN_FREE_DISK_GB, MIN_DUMP_BYTES, HEALTH_TIMEOUT, HEALTH_INTERVAL, DEPLOY_TS.

cd "$REMOTE_DIR" || {
    printf 'error: cannot enter %s on this host\n' "$REMOTE_DIR" >&2
    exit 1
}

r_die() {
    printf 'error: %s\n' "$*" >&2
    exit 1
}
r_ok() { printf '  PASS  %s\n' "$*" >&2; }
r_log() { printf '  ..    %s\n' "$*" >&2; }

# Repeated from lib/common.sh on purpose: this file is piped to another host and
# cannot source anything from the workstation. Same reason for free_disk_gb.
REVISION_LABEL='{{index .Config.Labels "org.opencontainers.image.revision"}}'

# The live compose file alone, for checks that must not assume the override
# exists yet.
compose_base() {
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

# The live compose file plus the app-only override and its non-secret image env.
compose_full() {
    docker compose --env-file "$ENV_FILE" --env-file "$IMAGE_ENV_FILE" \
        -f "$COMPOSE_FILE" -f "$OVERRIDE_FILE" "$@"
}

service_id() {
    docker ps --all \
        --filter "label=com.docker.compose.project=$COMPOSE_PROJECT" \
        --filter "label=com.docker.compose.service=$1" \
        --format '{{.ID}}' | head -1
}

require_service_id() {
    local id
    id="$(service_id "$1")"
    [ -n "$id" ] || r_die "no container for compose service '$1' in project '$COMPOSE_PROJECT'"
    printf '%s' "$id"
}

free_disk_gb() {
    df -P -k "$1" | awk 'NR == 2 { print int($4 / 1048576) }'
}

networks_of() {
    docker inspect --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$1"
}

# First network both containers are attached to. Used to place a one-off
# container where it can reach the database exactly as the app does.
shared_network() {
    local mine theirs n m
    mine="$(networks_of "$1")"
    theirs="$(networks_of "$2")"
    for n in $mine; do
        for m in $theirs; do
            if [ "$n" = "$m" ]; then
                printf '%s' "$n"
                return 0
            fi
        done
    done
    return 1
}

shares_network_with_caddy() {
    local mine theirs n m
    mine="$(networks_of "$1")"
    theirs="$(networks_of "$CADDY_CONTAINER")"
    for n in $mine; do
        for m in $theirs; do
            if [ "$n" = "$m" ]; then return 0; fi
        done
    done
    return 1
}

# GNU stat first, BSD stat second: the host is Ubuntu, the Bats harness is macOS.
file_mode() {
    stat -c '%a' "$1" 2>/dev/null || stat -f '%Lp' "$1" 2>/dev/null
}

backup_dir() { printf '%s/%s/%s' "$REMOTE_DIR" "$BACKUP_SUBDIR" "$1"; }

# --- activation ------------------------------------------------------------

# The override is deliberately tiny and app-only: it never mentions mongo,
# medialit, volumes or networks, so `docker compose up -d --no-deps app` cannot
# reshape anything else. The image arrives through a separate non-secret env
# file so this file is stable across deploys.
write_override() {
    cat >"$OVERRIDE_FILE" <<'YAML'
# Managed by scripts/prod/deploy.sh. Do not edit by hand.
# Layers the AIWS-built app image over the live compose file. App service only.
services:
  app:
    image: ${AIWS_APP_IMAGE:?AIWS_APP_IMAGE is required}
YAML
    chmod 644 "$OVERRIDE_FILE"
}

write_image_env() {
    printf '# Managed by scripts/prod/deploy.sh. Non-secret: image reference only.\nAIWS_APP_IMAGE=%s\n' "$1" >"$IMAGE_ENV_FILE"
    chmod 644 "$IMAGE_ENV_FILE"
}

# The override only exists once this harness has activated something. Paths that
# only restart what is already configured must not require it.
compose_app() {
    if [ -f "$OVERRIDE_FILE" ] && [ -f "$IMAGE_ENV_FILE" ]; then
        compose_full "$@"
    else
        compose_base "$@"
    fi
}

meta_file() { printf '%s/deployment.meta' "$(backup_dir "$DEPLOY_TS")"; }

meta_value() {
    sed -n "s/^$1=//p" "$2" | tail -1
}

wait_for_app() {
    local id state health waited=0 interval="$HEALTH_INTERVAL"
    [ "$interval" -gt 0 ] || interval=1
    while :; do
        id="$(require_service_id app)"
        state="$(docker inspect --format '{{.State.Status}}' "$id")"
        health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$id")"
        if [ "$state" = running ] && { [ "$health" = healthy ] || [ "$health" = none ]; }; then
            r_ok "app running (health: $health)"
            return 0
        fi
        [ "$waited" -lt "$HEALTH_TIMEOUT" ] ||
            r_die "app did not become healthy within ${HEALTH_TIMEOUT}s (state=$state health=$health)"
        sleep "$HEALTH_INTERVAL"
        waited=$((waited + interval))
    done
}

# Asks MediaLit for an upload signature using the app container's own
# environment. The API key is read inside the container and never printed.
medialit_signature_check() {
    docker exec "$1" node -e '
const server = process.env.MEDIALIT_SERVER, key = process.env.MEDIALIT_APIKEY;
if (!server || !key) { console.error("MEDIALIT_SERVER/MEDIALIT_APIKEY missing in the app container"); process.exit(2); }
fetch(server + "/media/signature/create", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ apikey: key, group: "aiws-deploy-probe" }),
}).then(async (r) => {
  const body = await r.text();
  if (r.status !== 200 || !body.trim()) { console.error("signature request returned " + r.status); process.exit(1); }
  process.exit(0);
}).catch((e) => { console.error(e.message); process.exit(1); });
' >/dev/null
}

# The invariants that make an app-only change safe. Used by both activation and
# rollback so the two paths cannot drift.
verify_app() {
    local want_image="$1" want_revision="$2" mongo_before="$3" medialit_before="$4" app_id

    [ "$(require_service_id mongo)" = "$mongo_before" ] ||
        r_die "mongo container was replaced during an app-only change"
    [ "$(require_service_id medialit)" = "$medialit_before" ] ||
        r_die "medialit container was replaced during an app-only change"
    r_ok "mongo and medialit containers untouched"

    wait_for_app
    app_id="$(require_service_id app)"

    [ "$(docker inspect --format '{{.Config.Image}}' "$app_id")" = "$want_image" ] ||
        r_die "app is not running $want_image"
    r_ok "app image is $want_image"

    if [ -n "$want_revision" ]; then
        [ "$(docker inspect --format "$REVISION_LABEL" "$app_id")" = "$want_revision" ] ||
            r_die "app image revision label does not match $want_revision"
        r_ok "app revision label is $want_revision"
    fi

    shares_network_with_caddy "$app_id" ||
        r_die "app no longer shares a network with $CADDY_CONTAINER"
    r_ok "app shares a network with $CADDY_CONTAINER"

    medialit_signature_check "$app_id" ||
        r_die "authenticated MediaLit signature check failed from inside the app container"
    r_ok "MediaLit signature endpoint returned 200"
}
