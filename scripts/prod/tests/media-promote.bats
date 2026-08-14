#!/usr/bin/env bats
# shellcheck disable=SC2016,SC2030,SC2031

bats_require_minimum_version 1.5.0

load helpers/setup

setup() {
    prod_setup

    export AIWS_MEDIALIT_UPLOAD_URL=https://upload.test
    export AIWS_MEDIA_CDN_HOST=media.test
    export AIWS_MEDIA_TIMEOUT=1

    ASSET="$BATS_TEST_TMPDIR/hero-real-work.webp"
    printf 'RIFF\014\000\000\000WEBPVP8 ' >"$ASSET"
    ASSET_SHA=12c725aa5d732696f09fdd5f887a7b800719a78a1d2e01c91540038c2ccefd23
    ASSET_BYTES=16
    MEDIA_ID=media-test-1
    CAPTION='A professional checking AI-assisted work against source material'
    export ASSET ASSET_SHA ASSET_BYTES MEDIA_ID CAPTION

    export FAKE_MEDIA_SIGNATURE=s3cr3t-one-use-signature
    FAKE_MEDIA_JSON="$(sealed_media_json "$MEDIA_ID")"
    export FAKE_MEDIA_JSON
    seed_media_remote
}

seed_media_remote() {
    seed_exec app '
while [ "$#" -gt 2 ]; do shift; done
printf "remote media-operation %s %s\n" "$1" "$2" >>"$FAKE_CALLS"
case "$1" in
  preflight) exit 0 ;;
  signature) printf "%s" "$FAKE_MEDIA_SIGNATURE" ;;
  seal|get) printf "%s" "$FAKE_MEDIA_JSON" ;;
  *) exit 64 ;;
esac'
}

sealed_media_json() {
    local id="$1" host="${2:-media.test}"
    jq -cn \
        --arg id "$id" \
        --arg host "$host" \
        --arg caption "$CAPTION" \
        '{
          mediaId: $id,
          originalFileName: "hero-real-work.webp",
          mimeType: "image/webp",
          size: 16,
          access: "public",
          file: ("https://" + $host + "/p/" + $id + "/main.webp"),
          thumbnail: ("https://" + $host + "/p/" + $id + "/thumb.webp"),
          caption: $caption,
          group: "ai-work-school-v1"
        }'
}

seed_upload_and_cdn() {
    seed_upload
    seed_url "https://media.test/p/$MEDIA_ID/main.webp" \
        200 image/webp "$ASSET" GET
}

seed_upload() {
    local upload_body
    upload_body="$(seed_body upload \
        '{"mediaId":"media-test-1","file":"https://private.test/i/media-test-1/main.webp?signature=s3cr3t-temporary"}')"
    seed_url https://upload.test/media/create 200 application/json "$upload_body" POST
}

run_promote() {
    run --separate-stderr "$PROD_DIR/media-promote.sh" "$@" \
        --source "$ASSET" \
        --sha256 "$ASSET_SHA" \
        --bytes "$ASSET_BYTES"
}

@test "dry-run validates the source and app boundary without consuming a signature" {
    run_promote --dry-run --group ai-work-school-v1 --caption "$CAPTION"

    [ "$status" -eq 0 ]
    [ -z "$output" ]
    [[ "$stderr" == *"PASS"*"source is image/webp"* ]]
    [[ "$stderr" == *"PASS"*"MediaLit app boundary is ready"* ]]
    refute_call " signature ai-work-school-v1"
    refute_call "https://upload.test/media/create"
}

@test "dry-run fails when the MediaLit service is stopped" {
    awk -F'\t' '
        BEGIN { OFS = "\t" }
        $5 == "medialit" { $6 = "stopped" }
        { print }
    ' "$FAKE_REMOTE_DOCKER_STATE/containers" >"$FAKE_REMOTE_DOCKER_STATE/containers.tmp"
    mv "$FAKE_REMOTE_DOCKER_STATE/containers.tmp" "$FAKE_REMOTE_DOCKER_STATE/containers"

    run_promote --dry-run --group ai-work-school-v1 --caption "$CAPTION"

    [ "$status" -ne 0 ]
    [ -z "$output" ]
    [[ "$stderr" == *"MediaLit container is not running"* ]]
    refute_call "media-operation signature"
}

@test "apply consumes one signature and emits only canonical sealed Media JSON" {
    local expected signature_calls
    seed_upload_and_cdn
    expected="$(printf '%s' "$FAKE_MEDIA_JSON" | jq -cS 'del(.group)')"

    run_promote --apply --group ai-work-school-v1 --caption "$CAPTION"

    [ "$status" -eq 0 ]
    [ "$output" = "$expected" ]
    [[ "$stderr" == *"PASS"*"CDN bytes match"* ]]
    signature_calls="$(grep -c '^remote media-operation signature ai-work-school-v1$' "$FAKE_CALLS" || true)"
    [ "$signature_calls" -eq 1 ] || { cat "$FAKE_CALLS"; false; }
    assert_call "curl --config"
    assert_call "-X POST"
    assert_call "file=@$ASSET;type=image/webp"
    assert_call "access=public"
    assert_call " seal $MEDIA_ID"
    assert_call " get $MEDIA_ID"
    assert_call "https://media.test/p/$MEDIA_ID/main.webp"
    refute_call "main.webp?"
    refute_secret_leak "$output$stderr"
}

@test "a wrong source hash fails before any remote or upload call" {
    run --separate-stderr "$PROD_DIR/media-promote.sh" \
        --dry-run --source "$ASSET" \
        --sha256 aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
        --bytes "$ASSET_BYTES" --group ai-work-school-v1 --caption "$CAPTION"

    [ "$status" -ne 0 ]
    [ -z "$output" ]
    [[ "$stderr" == *"source SHA-256 does not match"* ]]
    refute_call " ssh "
    refute_call " curl "
}

@test "an upload URL with a path fails before any remote call" {
    export AIWS_MEDIALIT_UPLOAD_URL=https://upload.test/not-an-origin

    run_promote --dry-run --group ai-work-school-v1 --caption "$CAPTION"

    [ "$status" -ne 0 ]
    [ -z "$output" ]
    [[ "$stderr" == *"HTTPS origin"* ]]
    refute_call " ssh "
}

@test "a CDN host containing a path fails before any remote call" {
    export AIWS_MEDIA_CDN_HOST=media.test/not-a-host

    run_promote --dry-run --group ai-work-school-v1 --caption "$CAPTION"

    [ "$status" -ne 0 ]
    [ -z "$output" ]
    [[ "$stderr" == *"valid hostname"* ]]
    refute_call " ssh "
}

@test "a missing CDN host fails before any remote call" {
    unset AIWS_MEDIA_CDN_HOST

    run_promote --dry-run --group ai-work-school-v1 --caption "$CAPTION"

    [ "$status" -ne 0 ]
    [ -z "$output" ]
    [[ "$stderr" == *"valid hostname"* ]]
    refute_call " ssh "
}

@test "caption values are sent as literal multipart text" {
    CAPTION=@caption-from-a-file
    export CAPTION
    FAKE_MEDIA_JSON="$(sealed_media_json "$MEDIA_ID")"
    export FAKE_MEDIA_JSON
    seed_upload_and_cdn

    run_promote --apply --group ai-work-school-v1 --caption "$CAPTION"

    [ "$status" -eq 0 ]
    assert_call "--form-string caption=@caption-from-a-file"
    refute_call "-F caption=@caption-from-a-file"
}

@test "a traversal-shaped upload media ID is rejected before seal" {
    local upload_body
    upload_body="$(seed_body upload-traversal '{"mediaId":".."}')"
    seed_url https://upload.test/media/create 200 application/json "$upload_body" POST

    run_promote --apply --group ai-work-school-v1 --caption "$CAPTION"

    [ "$status" -ne 0 ]
    [ -z "$output" ]
    [[ "$stderr" == *"invalid media ID"* ]]
    refute_call "media-operation seal"
}

@test "a private sealed record is rejected without leaking its URL" {
    seed_upload
    FAKE_MEDIA_JSON="$(printf '%s' "$FAKE_MEDIA_JSON" | jq -c \
        '.access = "private" | .file = "https://private.test/i/media-test-1/main.webp?signature=s3cr3t-private"')"
    export FAKE_MEDIA_JSON

    run_promote --apply --group ai-work-school-v1 --caption "$CAPTION"

    [ "$status" -ne 0 ]
    [ -z "$output" ]
    [[ "$stderr" == *"failed public URL or metadata validation"* ]]
    [[ "$stderr" != *"private.test"* ]]
    refute_secret_leak "$output$stderr"
}

@test "a query-bearing sealed URL is rejected" {
    seed_upload
    FAKE_MEDIA_JSON="$(printf '%s' "$FAKE_MEDIA_JSON" | jq -c \
        '.file += "?signature=temporary"')"
    export FAKE_MEDIA_JSON

    run_promote --apply --group ai-work-school-v1 --caption "$CAPTION"

    [ "$status" -ne 0 ]
    [ -z "$output" ]
    [[ "$stderr" == *"failed public URL or metadata validation"* ]]
}

@test "a sealed URL on the wrong host is rejected" {
    seed_upload
    FAKE_MEDIA_JSON="$(printf '%s' "$FAKE_MEDIA_JSON" | jq -c \
        '.file = "https://other.test/p/media-test-1/main.webp"')"
    export FAKE_MEDIA_JSON

    run_promote --apply --group ai-work-school-v1 --caption "$CAPTION"

    [ "$status" -ne 0 ]
    [ -z "$output" ]
    [[ "$stderr" == *"failed public URL or metadata validation"* ]]
}

@test "a sealed URL on the wrong path is rejected" {
    seed_upload
    FAKE_MEDIA_JSON="$(printf '%s' "$FAKE_MEDIA_JSON" | jq -c \
        '.file = "https://media.test/public/media-test-1/main.webp"')"
    export FAKE_MEDIA_JSON

    run_promote --apply --group ai-work-school-v1 --caption "$CAPTION"

    [ "$status" -ne 0 ]
    [ -z "$output" ]
    [[ "$stderr" == *"failed public URL or metadata validation"* ]]
}

@test "a sealed URL containing a different media ID is rejected" {
    seed_upload
    FAKE_MEDIA_JSON="$(printf '%s' "$FAKE_MEDIA_JSON" | jq -c \
        '.file = "https://media.test/p/media-other/main.webp"')"
    export FAKE_MEDIA_JSON

    run_promote --apply --group ai-work-school-v1 --caption "$CAPTION"

    [ "$status" -ne 0 ]
    [ -z "$output" ]
    [[ "$stderr" == *"failed public URL or metadata validation"* ]]
}

@test "CDN bytes with the wrong hash are rejected after sealing" {
    local wrong_body
    seed_upload
    wrong_body="$BATS_TEST_TMPDIR/wrong-cdn.webp"
    printf 'RIFF\014\000\000\000WEBPVP8X' >"$wrong_body"
    seed_url "https://media.test/p/$MEDIA_ID/main.webp" \
        200 image/webp "$wrong_body" GET

    run_promote --apply --group ai-work-school-v1 --caption "$CAPTION"

    [ "$status" -ne 0 ]
    [ -z "$output" ]
    [[ "$stderr" == *"CDN SHA-256 does not match"* ]]
}

@test "an already-promoted lock entry is re-verified without another upload" {
    local lock expected
    lock="$BATS_TEST_TMPDIR/media-lock-entry.json"
    jq -n \
        --arg sha "$ASSET_SHA" \
        --argjson bytes "$ASSET_BYTES" \
        --argjson media "$FAKE_MEDIA_JSON" \
        '{
          key: "homepage-hero-v1",
          sourcePath: "content/site/ai-work-school/assets/hero-real-work.webp",
          sha256: $sha,
          bytes: $bytes,
          mimeType: "image/webp",
          media: $media
        }' >"$lock"
    seed_url "https://media.test/p/$MEDIA_ID/main.webp" \
        200 image/webp "$ASSET" GET
    expected="$(printf '%s' "$FAKE_MEDIA_JSON" | jq -cS 'del(.group)')"

    run --separate-stderr "$PROD_DIR/media-promote.sh" \
        --verify-lock "$lock" --source "$ASSET"

    [ "$status" -eq 0 ]
    [ "$output" = "$expected" ]
    assert_call "media-operation get $MEDIA_ID"
    refute_call "media-operation signature"
    refute_call "media-operation seal"
    refute_call "https://upload.test/media/create"
    refute_secret_leak "$output$stderr"
}
