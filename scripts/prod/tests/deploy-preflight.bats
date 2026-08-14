#!/usr/bin/env bats

load helpers/setup

setup() {
    prod_setup
    SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
}

@test "preflight aborts before building when local free disk is under the minimum" {
    export AIWS_MIN_FREE_DISK_GB=20
    export FAKE_DF_AVAIL_KB=5242880 # 5 GiB

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"free disk"* ]]
    [[ "$output" == *"5 GiB"* ]]
    refute_call "buildx build"
}

@test "preflight accepts free disk at exactly the configured minimum" {
    export AIWS_MIN_FREE_DISK_GB=5
    export FAKE_DF_AVAIL_KB=5242880 # 5 GiB

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]
    assert_call "buildx build"
}

@test "preflight aborts before building when the host is not x86_64" {
    export FAKE_REMOTE_UNAME_M=aarch64

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"architecture"* ]]
    [[ "$output" == *"aarch64"* ]]
    refute_call "buildx build"
}

@test "preflight aborts before building when host free disk is under the minimum" {
    export AIWS_MIN_FREE_DISK_GB=20
    export FAKE_REMOTE_DF_AVAIL_KB=5242880 # 5 GiB

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"host free disk is 5 GiB"* ]]
    refute_call "buildx build"
}

@test "preflight aborts when the live .env is missing" {
    rm "$REMOTE_DIR/.env"

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *".env"* ]]
    [[ "$output" == *"missing"* ]]
    refute_call "buildx build"
}

@test "preflight aborts when the live .env is world-readable" {
    chmod 644 "$REMOTE_DIR/.env"

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"644"* ]]
    [[ "$output" == *"600"* ]]
    refute_call "buildx build"
}

@test "preflight aborts when the live compose file does not validate" {
    export FAKE_COMPOSE_CONFIG_EXIT=1

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"compose"* ]]
    refute_call "buildx build"
}

@test "preflight validates compose without rendering resolved env values" {
    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]
    assert_call "compose --env-file .env -f compose.yml config --quiet"
    refute_rendered_compose_config
    refute_secret_leak "$output"
}

@test "preflight aborts when a required host tool is absent" {
    export AIWS_REMOTE_TOOLS="docker no-such-tool-here"

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"no-such-tool-here"* ]]
    refute_call "buildx build"
}

@test "preflight aborts when a required local tool is absent" {
    export AIWS_LOCAL_TOOLS="git no-such-tool-here"

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"no-such-tool-here"* ]]
    refute_call " ssh "
}

@test "preflight aborts when a required compose service has no container" {
    grep -v 'medialit' "$FAKE_REMOTE_DOCKER_STATE/containers" >"$BATS_TEST_TMPDIR/c"
    mv "$BATS_TEST_TMPDIR/c" "$FAKE_REMOTE_DOCKER_STATE/containers"

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"medialit"* ]]
    refute_call "buildx build"
}

@test "preflight aborts when the app does not share a network with Caddy" {
    sed 's/^\(c000000001.*\)notto-demo_default/\1courselit_default/' \
        "$FAKE_REMOTE_DOCKER_STATE/containers" >"$BATS_TEST_TMPDIR/c"
    mv "$BATS_TEST_TMPDIR/c" "$FAKE_REMOTE_DOCKER_STATE/containers"

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"notto-demo-caddy-1"* ]]
    refute_call "buildx build"
}

@test "preflight aborts when the mongo container cannot run mongodump" {
    seed_exec mongo 'exit 127'

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"mongodump"* ]]
    refute_call "buildx build"
}
