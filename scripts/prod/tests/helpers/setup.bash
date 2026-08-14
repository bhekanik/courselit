# Common Bats setup: puts fake boundary commands on PATH and stands up a fake
# remote host that mirrors the real notto-deploy layout.

prod_setup() {
    PROD_DIR="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    REPO_ROOT="$(cd "$PROD_DIR/../.." && pwd)"
    export PROD_DIR REPO_ROOT

    REAL_GIT="$(command -v git)"
    REAL_DF="$(command -v df)"
    REAL_UNAME="$(command -v uname)"
    export REAL_GIT REAL_DF REAL_UNAME

    FAKE_HELPERS="$BATS_TEST_DIRNAME/helpers/fakes/_helpers.bash"
    FAKE_CALLS="$BATS_TEST_TMPDIR/calls.log"
    FAKE_DOCKER_STATE="$BATS_TEST_TMPDIR/docker-local"
    FAKE_REMOTE_DOCKER_STATE="$BATS_TEST_TMPDIR/docker-remote"
    FAKE_CURL_FIXTURES="$BATS_TEST_TMPDIR/curl-fixtures"
    FAKE_SSH_HOST=fakehost
    export FAKE_HELPERS FAKE_CALLS FAKE_DOCKER_STATE FAKE_REMOTE_DOCKER_STATE \
        FAKE_CURL_FIXTURES FAKE_SSH_HOST
    : >"$FAKE_CALLS"
    : >"$FAKE_CURL_FIXTURES"
    mkdir -p "$FAKE_DOCKER_STATE" "$FAKE_REMOTE_DOCKER_STATE/exec"

    PATH="$BATS_TEST_DIRNAME/helpers/fakes:$PATH"
    export PATH

    REMOTE_DIR="$BATS_TEST_TMPDIR/remote/home/deploy/services/courselit"
    mkdir -p "$REMOTE_DIR"
    cp "$BATS_TEST_DIRNAME/fixtures/compose.yml" "$REMOTE_DIR/compose.yml"
    printf 'AUTH_SECRET=s3cr3t-auth\nMONGO_ROOT_USERNAME=root\nMONGO_ROOT_PASSWORD=s3cr3t-mongo\nMEDIALIT_APIKEY=s3cr3t-medialit\n' >"$REMOTE_DIR/.env"
    chmod 600 "$REMOTE_DIR/.env"
    export REMOTE_DIR

    export FAKE_REMOTE_UNAME_M=x86_64

    export AIWS_SSH_HOST=fakehost
    export AIWS_REMOTE_DIR="$REMOTE_DIR"
    export AIWS_PUBLIC_URL="https://school.test"
    export AIWS_DEPLOY_TS=20260814T120000Z
    export AIWS_METRICS_FILE="$BATS_TEST_TMPDIR/metrics.tsv"
    export AIWS_LOCK_TIMEOUT=5
    export AIWS_HEALTH_TIMEOUT=1
    export AIWS_HEALTH_INTERVAL=0
    unset AIWS_TARGET_DOMAIN
    unset AIWS_SMOKE_MEDIA_URL AIWS_SMOKE_OTP_URL AIWS_SMOKE_OTP_BODY

    # A migration that really is committed at HEAD, so the exact-SHA channel is
    # exercised against the repo's own convention rather than a fixture.
    MIGRATION="$(git -C "$REPO_ROOT" ls-tree --name-only HEAD apps/web/.migrations/ | head -1)"
    MIGRATION="${MIGRATION##*/}"
    export MIGRATION

    seed_remote_defaults
    seed_smoke_defaults
}

# A healthy public site, so deploy tests reach the end of the pipeline.
seed_smoke_defaults() {
    : >"$FAKE_CURL_FIXTURES"
    seed_url https://school.test/ 200 'text/html; charset=utf-8' \
        "$(seed_body root '<!DOCTYPE html><html><head><link href="/_next/static/chunks/a.css"/></head><body>My school</body></html>')"
    seed_url https://school.test/api/config 200 'application/json' \
        "$(seed_body config '{"recaptchaSiteKey":"","cacheEnabled":true}')"
    seed_url https://school.test/login 200 'text/html; charset=utf-8' \
        "$(seed_body login '<!DOCTYPE html><html><body><form id="email"></form></body></html>')"
}

seed_remote_defaults() {
    seed_image remote codelit/courselit-app:latest ''
    seed_image remote mongo:8.0 ''
    seed_image remote codelit/medialit:latest ''
    seed_image remote caddy:2-alpine ''

    : >"$FAKE_REMOTE_DOCKER_STATE/containers"
    seed_container remote c000000001 courselit-app-1 codelit/courselit-app:latest courselit app running healthy notto-demo_default
    seed_container remote c000000002 courselit-mongo-1 mongo:8.0 courselit mongo running healthy notto-demo_default
    seed_container remote c000000003 courselit-medialit-1 codelit/medialit:latest courselit medialit running none notto-demo_default
    seed_container remote c000000004 notto-demo-caddy-1 caddy:2-alpine notto-demo caddy running none notto-demo_default

    # mongodump writes a plausible archive to stdout; the app container answers
    # the MediaLit signature probe.
    seed_exec mongo 'case "$*" in
      *"command -v mongodump"*) exit 0 ;;
      *mongorestore*) cat >/dev/null; exit "${FAKE_MONGORESTORE_EXIT:-0}" ;;
    esac
    head -c 4096 /dev/zero | tr "\\0" m'
    seed_exec app 'echo 200'
}

_state_dir() {
    case "$1" in
    local) printf '%s' "$FAKE_DOCKER_STATE" ;;
    remote) printf '%s' "$FAKE_REMOTE_DOCKER_STATE" ;;
    esac
}

seed_image() {
    local dir
    dir="$(_state_dir "$1")"
    printf '%s\t%s\n' "$2" "${3:-}" >>"$dir/images"
}

seed_container() {
    local dir
    dir="$(_state_dir "$1")"
    shift
    printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$@" >>"$dir/containers"
}

seed_exec() {
    local script="$FAKE_REMOTE_DOCKER_STATE/exec/$1"
    shift
    printf '#!/usr/bin/env bash\n%s\n' "$*" >"$script"
    chmod +x "$script"
}

seed_url() {
    printf '%s\t%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "${4:-}" "${5:-}" >>"$FAKE_CURL_FIXTURES"
}

# Replaces any existing fixture for the URL (seed_url only appends).
set_url() {
    awk -F'\t' -v u="$1" '$1 != u' "$FAKE_CURL_FIXTURES" >"$FAKE_CURL_FIXTURES.tmp"
    mv "$FAKE_CURL_FIXTURES.tmp" "$FAKE_CURL_FIXTURES"
    seed_url "$@"
}

seed_body() {
    local f="$BATS_TEST_TMPDIR/body-$1"
    shift
    printf '%s' "$*" >"$f"
    printf '%s' "$f"
}

assert_call() {
    if ! grep -qF -- "$1" "$FAKE_CALLS"; then
        echo "expected a call matching: $1" >&2
        echo "--- calls ---" >&2
        cat "$FAKE_CALLS" >&2
        return 1
    fi
}

refute_call() {
    if grep -qF -- "$1" "$FAKE_CALLS"; then
        echo "unexpected call matching: $1" >&2
        echo "--- calls ---" >&2
        cat "$FAKE_CALLS" >&2
        return 1
    fi
}

# 1-based index of the first call containing the literal, for ordering asserts.
call_index() {
    grep -nF -- "$1" "$FAKE_CALLS" | head -1 | cut -d: -f1
}

assert_call_before() {
    local a b
    a="$(call_index "$1")"
    b="$(call_index "$2")"
    [ -n "$a" ] || { echo "no call matching: $1" >&2; return 1; }
    [ -n "$b" ] || { echo "no call matching: $2" >&2; return 1; }
    if [ "$a" -ge "$b" ]; then
        echo "expected '$1' (line $a) before '$2' (line $b)" >&2
        cat "$FAKE_CALLS" >&2
        return 1
    fi
}

# `docker compose config` without --quiet prints every resolved environment
# value, including .env secrets. It must never appear.
refute_rendered_compose_config() {
    local offenders
    offenders="$(grep -F 'docker compose' "$FAKE_CALLS" | grep -F ' config' | grep -vF -- '--quiet' || true)"
    if [ -n "$offenders" ]; then
        echo "compose config rendered without --quiet:" >&2
        echo "$offenders" >&2
        return 1
    fi
}

# `up -d` without --no-deps would let compose recreate mongo and medialit too.
refute_broad_compose_up() {
    local offenders
    offenders="$(grep -F 'docker compose' "$FAKE_CALLS" | grep -F ' up ' | grep -vF -- '--no-deps app' || true)"
    if [ -n "$offenders" ]; then
        echo "compose up touched more than the app service:" >&2
        echo "$offenders" >&2
        return 1
    fi
}

# None of the fixture .env secrets may reach stdout, stderr or any command line.
refute_secret_leak() {
    if printf '%s' "$1" | grep -q 's3cr3t'; then
        echo "output leaked a secret from .env" >&2
        return 1
    fi
    if grep -q 's3cr3t' "$FAKE_CALLS"; then
        echo "a command line leaked a secret from .env" >&2
        grep 's3cr3t' "$FAKE_CALLS" >&2
        return 1
    fi
}

# GNU stat first, BSD stat second.
file_mode() {
    stat -c '%a' "$1" 2>/dev/null || stat -f '%Lp' "$1" 2>/dev/null
}

backup_dir() { printf '%s/aiws-backups/%s' "$REMOTE_DIR" "$AIWS_DEPLOY_TS"; }

container_id_of() {
    awk -F'\t' -v s="$1" '$5 == s { print $1 }' "$FAKE_REMOTE_DOCKER_STATE/containers"
}

container_image_of() {
    awk -F'\t' -v s="$1" '$5 == s { print $3 }' "$FAKE_REMOTE_DOCKER_STATE/containers"
}

container_state_of() {
    awk -F'\t' -v s="$1" '$5 == s { print $6 }' "$FAKE_REMOTE_DOCKER_STATE/containers"
}
