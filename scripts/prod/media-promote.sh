#!/usr/bin/env bash
set -euo pipefail

PROD_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$PROD_DIR/lib/common.sh"
. "$PROD_DIR/lib/config.sh"
. "$PROD_DIR/lib/remote.sh"

usage() {
    cat <<'EOF'
Usage:
  scripts/prod/media-promote.sh --dry-run --source FILE --sha256 HEX --bytes N --group GROUP --caption TEXT
  scripts/prod/media-promote.sh --apply --source FILE --sha256 HEX --bytes N --group GROUP --caption TEXT
  scripts/prod/media-promote.sh --verify-lock LOCK.json --source FILE

Validates a local WebP and the production app's MediaLit trust boundary. Apply
uses one fresh signature, uploads one public WebP, seals it, reads it back, and
prints only canonical sealed Media JSON. Dry-run makes no MediaLit mutation.
EOF
}

MODE=""
SOURCE=""
EXPECTED_SHA=""
EXPECTED_BYTES=""
GROUP=""
CAPTION=""
LOCK_ENTRY=""

set_mode() {
    [ -z "$MODE" ] || die "choose exactly one mode"
    MODE="$1"
}

parse_args() {
    while [ "$#" -gt 0 ]; do
        case "$1" in
        --dry-run)
            set_mode dry-run
            shift
            ;;
        --apply)
            set_mode apply
            shift
            ;;
        --verify-lock)
            [ "$#" -ge 2 ] || die "--verify-lock requires a value"
            set_mode verify-lock
            LOCK_ENTRY="$2"
            shift 2
            ;;
        --source)
            [ "$#" -ge 2 ] || die "--source requires a value"
            SOURCE="$2"
            shift 2
            ;;
        --sha256)
            [ "$#" -ge 2 ] || die "--sha256 requires a value"
            EXPECTED_SHA="$2"
            shift 2
            ;;
        --bytes)
            [ "$#" -ge 2 ] || die "--bytes requires a value"
            EXPECTED_BYTES="$2"
            shift 2
            ;;
        --group)
            [ "$#" -ge 2 ] || die "--group requires a value"
            GROUP="$2"
            shift 2
            ;;
        --caption)
            [ "$#" -ge 2 ] || die "--caption requires a value"
            CAPTION="$2"
            shift 2
            ;;
        -h | --help)
            usage
            exit 0
            ;;
        *) die "unknown argument: $1" ;;
        esac
    done
}

require_tools() {
    local tool
    for tool in curl jq file shasum ssh; do
        command -v "$tool" >/dev/null 2>&1 ||
            die "this machine is missing a required tool: $tool"
    done
}

validate_source_metadata() {
    case "$MODE" in
    dry-run | apply | verify-lock) ;;
    *) die "choose exactly one mode" ;;
    esac
    case "$EXPECTED_SHA" in
    *[!0-9a-f]* | "") die "--sha256 must be 64 lowercase hexadecimal characters" ;;
    esac
    [ "${#EXPECTED_SHA}" -eq 64 ] ||
        die "--sha256 must be 64 lowercase hexadecimal characters"
    case "$EXPECTED_BYTES" in
    *[!0-9]* | "" | 0) die "--bytes must be a positive integer" ;;
    esac
}

validate_inputs() {
    local upload_origin=""
    [ -n "$SOURCE" ] || die "--source is required"
    [ -f "$SOURCE" ] && [ -r "$SOURCE" ] || die "source must be a readable regular file"
    validate_source_metadata
    case "$AIWS_MEDIA_CDN_HOST" in
    "" | .* | *. | *..* | *[!A-Za-z0-9.-]*)
        die "AIWS_MEDIA_CDN_HOST must be a valid hostname"
        ;;
    esac
    [ "$MODE" = verify-lock ] && return
    assert_safe_token "--group" "$GROUP"
    [ -n "$CAPTION" ] || die "--caption must not be empty"
    case "$AIWS_MEDIALIT_UPLOAD_URL" in
    https://*) upload_origin="${AIWS_MEDIALIT_UPLOAD_URL#https://}" ;;
    *) die "AIWS_MEDIALIT_UPLOAD_URL must be an HTTPS origin without a path or query" ;;
    esac
    case "$upload_origin" in
    "" | */* | *\?* | *\#* | *@* | *[!A-Za-z0-9.:-]*)
        die "AIWS_MEDIALIT_UPLOAD_URL must be an HTTPS origin without a path or query"
        ;;
    esac
}

load_lock_entry() {
    [ -f "$LOCK_ENTRY" ] && [ -r "$LOCK_ENTRY" ] ||
        die "--verify-lock must name a readable regular file"
    jq -e '
        type == "object" and
        (.sha256 | type == "string") and
        (.bytes | type == "number" and . > 0 and floor == .) and
        .mimeType == "image/webp" and
        (.media | type == "object") and
        (.media.caption | type == "string" and length > 0)
    ' "$LOCK_ENTRY" >/dev/null 2>&1 || die "lock entry has an invalid schema"
    EXPECTED_SHA="$(jq -r '.sha256' "$LOCK_ENTRY")"
    EXPECTED_BYTES="$(jq -r '.bytes' "$LOCK_ENTRY")"
    CAPTION="$(jq -r '.media.caption' "$LOCK_ENTRY")"
    LOCK_MEDIA="$(jq -c '.media' "$LOCK_ENTRY")"
}

canonical_media() {
    local raw="$1" expected_id="$2" source_name expected_file expected_thumbnail canonical
    source_name="${SOURCE##*/}"
    expected_file="https://$AIWS_MEDIA_CDN_HOST/p/$expected_id/main.webp"
    expected_thumbnail="https://$AIWS_MEDIA_CDN_HOST/p/$expected_id/thumb.webp"

    canonical="$(printf '%s' "$raw" | jq -ceS \
        'select(type == "object") | {
          mediaId,
          originalFileName,
          mimeType,
          size,
          access: (.access // .accessControl),
          thumbnail,
          caption,
          file
        }' 2>/dev/null)" || die "MediaLit returned invalid sealed Media JSON"
    [ -n "$canonical" ] || die "MediaLit returned invalid sealed Media JSON"
    printf '%s' "$canonical" | jq -e \
        --arg id "$expected_id" \
        --arg name "$source_name" \
        --arg caption "$CAPTION" \
        --arg file "$expected_file" \
        --arg thumbnail "$expected_thumbnail" \
        --argjson bytes "$EXPECTED_BYTES" \
        '
          .mediaId == $id and
          .originalFileName == $name and
          .mimeType == "image/webp" and
          .size == $bytes and
          .access == "public" and
          .file == $file and
          .thumbnail == $thumbnail and
          .caption == $caption
        ' >/dev/null 2>&1 || die "sealed media record failed public URL or metadata validation"
    printf '%s' "$canonical"
}

make_temp_files() {
    AUTH_FILE="$(mktemp -t aiws-media-auth)"
    UPLOAD_BODY="$(mktemp -t aiws-media-upload)"
    CDN_BODY="$(mktemp -t aiws-media-cdn)"
    chmod 600 "$AUTH_FILE" "$UPLOAD_BODY" "$CDN_BODY"
    trap 'rm -f "$AUTH_FILE" "$UPLOAD_BODY" "$CDN_BODY"' EXIT
}

upload_media() {
    local signature="$1" result status ctype media_id
    case "$signature" in
    "" | *[!A-Za-z0-9._-]*) die "MediaLit returned an invalid upload signature" ;;
    esac

    # curl reads the signature from a mode-600 config file, keeping it out of
    # argv, shell tracing, process listings and the production harness log.
    printf 'header = "x-medialit-signature: %s"\n' "$signature" >"$AUTH_FILE"
    result="$(curl --config "$AUTH_FILE" -sS \
        -o "$UPLOAD_BODY" -w '%{http_code} %{content_type}' \
        --max-time "$AIWS_MEDIA_TIMEOUT" -X POST \
        -F "file=@$SOURCE;type=image/webp" \
        -F 'access=public' \
        --form-string "caption=$CAPTION" \
        "$AIWS_MEDIALIT_UPLOAD_URL/media/create" || printf '000 none')"
    status="${result%% *}"
    ctype="${result#* }"
    [ "$status" = 200 ] || die "MediaLit upload returned HTTP $status"
    case "$ctype" in
    application/json*) ;;
    *) die "MediaLit upload returned an unexpected content type" ;;
    esac
    media_id="$(jq -er '.mediaId | select(type == "string" and length > 0)' \
        "$UPLOAD_BODY" 2>/dev/null)" || die "MediaLit upload response had no media ID"
    case "$media_id" in
    *[!A-Za-z0-9_-]*) die "MediaLit upload returned an invalid media ID" ;;
    esac
    printf '%s' "$media_id"
}

verify_cdn_bytes() {
    local media_id="$1" result status ctype actual_sha actual_bytes
    result="$(curl -sS -o "$CDN_BODY" -w '%{http_code} %{content_type}' \
        --max-time "$AIWS_MEDIA_TIMEOUT" \
        -H 'Cache-Control: no-cache' \
        "https://$AIWS_MEDIA_CDN_HOST/p/$media_id/main.webp" ||
        printf '000 none')"
    status="${result%% *}"
    ctype="${result#* }"
    [ "$status" = 200 ] || die "sealed CDN object returned HTTP $status"
    case "$ctype" in
    image/webp*) ;;
    *) die "sealed CDN object returned an unexpected content type" ;;
    esac
    actual_bytes="$(wc -c <"$CDN_BODY" | tr -d ' ')"
    [ "$actual_bytes" = "$EXPECTED_BYTES" ] || die "sealed CDN byte count does not match the source"
    actual_sha="$(shasum -a 256 "$CDN_BODY" | awk '{print $1}')"
    [ "$actual_sha" = "$EXPECTED_SHA" ] || die "sealed CDN SHA-256 does not match the source"
    ok "CDN bytes match the source byte count and SHA-256"
}

promote() {
    local signature media_id sealed current canonical_sealed canonical_current
    make_temp_files
    signature="$(remote_run_locked media.sh signature "$GROUP")"
    media_id="$(upload_media "$signature")"
    sealed="$(remote_run_locked media.sh seal "$media_id")"
    canonical_sealed="$(canonical_media "$sealed" "$media_id")"
    current="$(remote_run media.sh get "$media_id")"
    canonical_current="$(canonical_media "$current" "$media_id")"
    [ "$canonical_sealed" = "$canonical_current" ] ||
        die "MediaLit get did not match the sealed media record"
    verify_cdn_bytes "$media_id"
    printf '%s\n' "$canonical_current"
}

verify_locked_media() {
    local media_id current canonical_locked canonical_current
    make_temp_files
    media_id="$(printf '%s' "$LOCK_MEDIA" | jq -er \
        '.mediaId | select(type == "string" and length > 0)' 2>/dev/null)" ||
        die "lock entry media has no media ID"
    case "$media_id" in
    *[!A-Za-z0-9_-]*) die "lock entry media has an invalid media ID" ;;
    esac
    canonical_locked="$(canonical_media "$LOCK_MEDIA" "$media_id")"
    current="$(remote_run media.sh get "$media_id")"
    canonical_current="$(canonical_media "$current" "$media_id")"
    [ "$canonical_locked" = "$canonical_current" ] ||
        die "current MediaLit record does not match the lock entry"
    verify_cdn_bytes "$media_id"
    printf '%s\n' "$canonical_current"
}

validate_source() {
    local actual_mime actual_bytes actual_sha
    actual_mime="$(file --brief --mime-type "$SOURCE")"
    [ "$actual_mime" = image/webp ] ||
        die "source MIME is '$actual_mime', expected image/webp"
    actual_bytes="$(wc -c <"$SOURCE" | tr -d ' ')"
    [ "$actual_bytes" = "$EXPECTED_BYTES" ] ||
        die "source byte count does not match --bytes"
    actual_sha="$(shasum -a 256 "$SOURCE" | awk '{print $1}')"
    [ "$actual_sha" = "$EXPECTED_SHA" ] ||
        die "source SHA-256 does not match --sha256"
    ok "source is image/webp with the expected bytes and SHA-256"
}

main() {
    parse_args "$@"
    require_tools
    if [ "$MODE" = verify-lock ]; then
        load_lock_entry
    fi
    validate_inputs
    validate_source

    remote_run media.sh preflight _ >/dev/null
    ok "MediaLit app boundary is ready"
    if [ "$MODE" = dry-run ]; then
        ok "dry-run complete; no signature created and no media uploaded"
        return
    fi
    if [ "$MODE" = verify-lock ]; then
        verify_locked_media
        return
    fi
    promote
}

main "$@"
