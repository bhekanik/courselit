#!/usr/bin/env bats

load helpers/setup

setup() {
    prod_setup
    SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
    REF="aiws/courselit-app:$SHA"
    MONGO_BEFORE="$(container_id_of mongo)"
    MEDIALIT_BEFORE="$(container_id_of medialit)"
    APP_BEFORE="$(container_id_of app)"
    COMPOSE_SUM="$(md5 -q "$REMOTE_DIR/compose.yml")"
    ENV_SUM="$(md5 -q "$REMOTE_DIR/.env")"
}

@test "activation replaces the app container and leaves mongo and medialit alone" {
    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]

    [ "$(container_id_of mongo)" = "$MONGO_BEFORE" ]
    [ "$(container_id_of medialit)" = "$MEDIALIT_BEFORE" ]
    [ "$(container_id_of app)" != "$APP_BEFORE" ]
    [ "$(container_image_of app)" = "$REF" ]
    refute_broad_compose_up
    assert_call "compose --env-file .env --env-file aiws-active-image.env -f compose.yml -f compose.aiws.yml up -d --no-deps app"
}

@test "activation leaves the live compose file and .env untouched" {
    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]

    [ "$(md5 -q "$REMOTE_DIR/compose.yml")" = "$COMPOSE_SUM" ]
    [ "$(md5 -q "$REMOTE_DIR/.env")" = "$ENV_SUM" ]
    [ "$(file_mode "$REMOTE_DIR/.env")" = "600" ]
}

@test "activation layers an app-only override and a non-secret image env file" {
    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]

    override="$REMOTE_DIR/compose.aiws.yml"
    grep -q 'app:' "$override"
    ! grep -qE '^  (mongo|medialit):' "$override"
    ! grep -q 'volumes:' "$override"

    image_env="$REMOTE_DIR/aiws-active-image.env"
    [ "$(sed -n 's/^AIWS_APP_IMAGE=//p' "$image_env")" = "$REF" ]
    ! grep -q 's3cr3t' "$image_env"
}

@test "deploy fails when compose recreates mongo alongside the app" {
    export FAKE_COMPOSE_UP_EXTRA_SERVICES=mongo

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"mongo container was replaced"* ]]
}

@test "deploy fails when the activated image carries a different revision label" {
    export FAKE_LOAD_REVISION=3333333333333333333333333333333333333333

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"revision label"* ]]
}

@test "deploy fails when the app never becomes healthy" {
    export FAKE_APP_HEALTH=unhealthy

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"healthy"* ]]
}

@test "deploy fails when the MediaLit signature check fails from inside the app" {
    seed_exec app 'exit 1'

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"MediaLit signature check failed"* ]]
}

@test "a full deploy never leaks a .env secret to output or a command line" {
    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]
    refute_secret_leak "$output"
    refute_rendered_compose_config
}

@test "deploy fails when the recreated app lands off the Caddy network" {
    export FAKE_UP_NETWORKS=courselit_default

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"no longer shares a network with notto-demo-caddy-1"* ]]
}

@test "deploy waits for an app that reports healthy only after a few polls" {
    export FAKE_APP_HEALTH_AFTER=2
    export AIWS_HEALTH_TIMEOUT=10

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]
    [ "$(container_image_of app)" = "$REF" ]
}
