#!/usr/bin/env bash
set -euo pipefail

PROD_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$PROD_DIR/lib/common.sh"
. "$PROD_DIR/lib/config.sh"

usage() {
    cat <<'EOF'
Usage: scripts/prod/smoke.sh [--base-url URL]

Checks the live CourseLit site from outside: the public root renders, the
config endpoint serves JSON, and the login page renders. Two further probes are
optional and are reported as SKIP -- never as PASS -- when unconfigured:

  AIWS_SMOKE_MEDIA_URL   a public media asset that must return 200
  AIWS_SMOKE_OTP_URL     an email OTP endpoint that must accept a request

Exit status is non-zero if any required check fails.
EOF
}

PASSED=0
FAILED=0
SKIPPED=0

record_pass() {
    PASSED=$((PASSED + 1))
    ok "$*"
}
record_fail() {
    FAILED=$((FAILED + 1))
    fail_note "$*"
}
record_skip() {
    SKIPPED=$((SKIPPED + 1))
    skip_note "$*"
}

# Writes "<status> <content-type>" to stdout and the body to $BODY_FILE.
fetch() {
    : >"$BODY_FILE"
    curl -sS -o "$BODY_FILE" -w '%{http_code} %{content_type}' \
        --max-time "$AIWS_SMOKE_TIMEOUT" "$@" || printf '000 none'
}

check_html() {
    local label="$1" url="$2" marker="${3:-}" result status ctype
    result="$(fetch "$url")"
    status="${result%% *}"
    ctype="${result#* }"
    if [ "$status" != "200" ]; then
        record_fail "$label $url returned HTTP $status"
        return
    fi
    case "$ctype" in
    text/html*) ;;
    *)
        record_fail "$label $url returned content-type '$ctype', expected text/html"
        return
        ;;
    esac
    if [ -n "$marker" ] && ! grep -qF -- "$marker" "$BODY_FILE"; then
        record_fail "$label $url returned HTML without the marker '$marker'"
        return
    fi
    record_pass "$label $url 200 HTML${marker:+ containing [$marker]}"
}

check_json() {
    local label="$1" url="$2" result status ctype
    result="$(fetch "$url")"
    status="${result%% *}"
    ctype="${result#* }"
    if [ "$status" != "200" ]; then
        record_fail "$label $url returned HTTP $status"
        return
    fi
    case "$ctype" in
    application/json*) ;;
    *)
        record_fail "$label $url returned content-type '$ctype', expected application/json"
        return
        ;;
    esac
    if ! jq -e . "$BODY_FILE" >/dev/null 2>&1; then
        record_fail "$label $url did not return parseable JSON"
        return
    fi
    record_pass "$label $url 200 JSON"
}

# Optional. The R2 smoke objects were deleted after the last media test, so
# there is no asset the harness can assume. Unconfigured means SKIP, loudly.
check_media() {
    local result status
    if [ -z "$AIWS_SMOKE_MEDIA_URL" ]; then
        record_skip "public media asset not checked (set AIWS_SMOKE_MEDIA_URL to a public asset)"
        return
    fi
    result="$(fetch "$AIWS_SMOKE_MEDIA_URL")"
    status="${result%% *}"
    [ "$status" = "200" ] ||
        { record_fail "media $AIWS_SMOKE_MEDIA_URL returned HTTP $status"; return; }
    record_pass "media $AIWS_SMOKE_MEDIA_URL 200"
}

# Optional. Inbox receipt is a manual step and repeated real login probes are
# rate-limited, so this is opt-in per deploy rather than part of every run.
check_otp() {
    local result status
    if [ -z "$AIWS_SMOKE_OTP_URL" ]; then
        record_skip "email OTP request not checked (set AIWS_SMOKE_OTP_URL and AIWS_SMOKE_OTP_BODY)"
        return
    fi
    if [ -z "$AIWS_SMOKE_OTP_BODY" ]; then
        record_skip "email OTP request not checked (AIWS_SMOKE_OTP_URL is set but AIWS_SMOKE_OTP_BODY is not)"
        return
    fi
    result="$(fetch -X POST -H 'content-type: application/json' \
        --data "$AIWS_SMOKE_OTP_BODY" "$AIWS_SMOKE_OTP_URL")"
    status="${result%% *}"
    [ "$status" = "$AIWS_SMOKE_OTP_EXPECT_STATUS" ] ||
        { record_fail "otp $AIWS_SMOKE_OTP_URL returned HTTP $status, expected $AIWS_SMOKE_OTP_EXPECT_STATUS"; return; }
    record_pass "otp $AIWS_SMOKE_OTP_URL $status (delivery to the inbox is still a manual check)"
}

main() {
    while [ $# -gt 0 ]; do
        case "$1" in
        -h | --help)
            usage
            return 0
            ;;
        --base-url)
            AIWS_PUBLIC_URL="$2"
            shift 2
            ;;
        *) die "unknown argument: $1" ;;
        esac
    done

    local tool
    for tool in $AIWS_SMOKE_TOOLS; do
        command -v "$tool" >/dev/null 2>&1 ||
            die "this machine is missing a required tool: $tool"
    done

    BODY_FILE="$(mktemp -t aiws-smoke)"
    trap 'rm -f "$BODY_FILE"' EXIT

    log "smoke: $AIWS_PUBLIC_URL"
    check_html root "$AIWS_PUBLIC_URL/" "$AIWS_SMOKE_MARKER"
    check_json config "$AIWS_PUBLIC_URL/api/config"
    check_html login "$AIWS_PUBLIC_URL/login"
    check_media
    check_otp

    log "smoke: $PASSED passed, $FAILED failed, $SKIPPED skipped"
    [ "$FAILED" -eq 0 ]
}

main "$@"
