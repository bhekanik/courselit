#!/usr/bin/env bats

load helpers/setup

setup() { prod_setup; }

@test "smoke fails when the public root renders without the stable marker" {
    : >"$FAKE_CURL_FIXTURES"
    seed_url https://school.test/ 200 'text/html; charset=utf-8' \
        "$(seed_body root '<!DOCTYPE html><html><body>Caddy default page</body></html>')"
    seed_url https://school.test/api/config 200 'application/json' \
        "$(seed_body config '{"cacheEnabled":true}')"
    seed_url https://school.test/login 200 'text/html' "$(seed_body login '<html></html>')"

    run "$PROD_DIR/smoke.sh"
    [ "$status" -ne 0 ]
    [[ "$output" == *"_next/static"* ]]
    [[ "$output" == *"FAIL"* ]]
}

@test "smoke fails when the public root is not 200" {
    : >"$FAKE_CURL_FIXTURES"
    seed_url https://school.test/ 502 'text/html' "$(seed_body root 'Bad Gateway')"

    run "$PROD_DIR/smoke.sh"
    [ "$status" -ne 0 ]
    [[ "$output" == *"HTTP 502"* ]]
}

@test "smoke fails when the public root is unreachable" {
    : >"$FAKE_CURL_FIXTURES"

    run "$PROD_DIR/smoke.sh"
    [ "$status" -ne 0 ]
    [[ "$output" == *"HTTP 000"* ]]
}

@test "smoke fails when /api/config does not return parseable JSON" {
    : >"$FAKE_CURL_FIXTURES"
    seed_url https://school.test/ 200 'text/html' "$(seed_body root '/_next/static/x')"
    seed_url https://school.test/api/config 200 'application/json' \
        "$(seed_body config '{"cacheEnabled": tru')"
    seed_url https://school.test/login 200 'text/html' "$(seed_body login '<html></html>')"

    run "$PROD_DIR/smoke.sh"
    [ "$status" -ne 0 ]
    [[ "$output" == *"/api/config"* ]]
    [[ "$output" == *"JSON"* ]]
}

@test "smoke fails when /login does not render HTML" {
    : >"$FAKE_CURL_FIXTURES"
    seed_url https://school.test/ 200 'text/html' "$(seed_body root '/_next/static/x')"
    seed_url https://school.test/api/config 200 'application/json' "$(seed_body config '{}')"
    seed_url https://school.test/login 500 'text/plain' "$(seed_body login 'boom')"

    run "$PROD_DIR/smoke.sh"
    [ "$status" -ne 0 ]
    [[ "$output" == *"/login"* ]]
}

@test "smoke reports the optional probes as skipped, never as passed, when unconfigured" {
    run "$PROD_DIR/smoke.sh"
    [ "$status" -eq 0 ]
    [[ "$output" == *"SKIP"*"AIWS_SMOKE_MEDIA_URL"* ]]
    [[ "$output" == *"SKIP"*"AIWS_SMOKE_OTP_URL"* ]]
    [[ "$output" == *"3 passed, 0 failed, 2 skipped"* ]]
}

@test "smoke fails when the configured public media asset is gone" {
    export AIWS_SMOKE_MEDIA_URL=https://media.test/logo.png
    seed_url https://media.test/logo.png 404 'text/html' ""

    run "$PROD_DIR/smoke.sh"
    [ "$status" -ne 0 ]
    [[ "$output" == *"https://media.test/logo.png"* ]]
    [[ "$output" == *"404"* ]]
}

@test "smoke passes the media check when the asset is served" {
    export AIWS_SMOKE_MEDIA_URL=https://media.test/logo.png
    seed_url https://media.test/logo.png 200 'image/png' ""

    run "$PROD_DIR/smoke.sh"
    [ "$status" -eq 0 ]
    [[ "$output" == *"4 passed, 0 failed, 1 skipped"* ]]
}

@test "smoke fails when the configured OTP endpoint rejects the request" {
    export AIWS_SMOKE_OTP_URL=https://school.test/api/auth/otp
    export AIWS_SMOKE_OTP_BODY='{"email":"probe@example.com"}'
    seed_url https://school.test/api/auth/otp 500 'application/json' "" POST

    run "$PROD_DIR/smoke.sh"
    [ "$status" -ne 0 ]
    [[ "$output" == *"otp"* ]]
    [[ "$output" == *"500"* ]]
}

@test "smoke skips the OTP probe when only the URL is configured" {
    export AIWS_SMOKE_OTP_URL=https://school.test/api/auth/otp

    run "$PROD_DIR/smoke.sh"
    [ "$status" -eq 0 ]
    [[ "$output" == *"SKIP"*"AIWS_SMOKE_OTP_BODY"* ]]
}

@test "smoke aborts when a tool it needs is missing" {
    export AIWS_SMOKE_TOOLS="curl no-such-tool-here"

    run "$PROD_DIR/smoke.sh"
    [ "$status" -ne 0 ]
    [[ "$output" == *"no-such-tool-here"* ]]
    refute_call " curl "
}
