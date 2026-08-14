#!/usr/bin/env bats

load helpers/setup

setup() {
    prod_setup
    SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
    APP_BEFORE="$(container_id_of app)"
}

@test "deploy activation runs under the host deploy lock" {
    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]

    assert_call "flock -w 5 $REMOTE_DIR/.aiws-deploy.lock bash -s --"
    assert_call_before "flock -w" "up -d --no-deps app"
}

@test "deploy gives up without changing the app when the host lock is held" {
    export FAKE_FLOCK_BUSY=1

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [ "$(container_id_of app)" = "$APP_BEFORE" ]
    refute_call "up -d --no-deps app"
}

@test "manual rollback takes the same lock" {
    seed_image remote codelit/courselit-app:previous ''

    run "$PROD_DIR/rollback.sh" codelit/courselit-app:previous
    [ "$status" -eq 0 ]
    assert_call "flock -w 5 $REMOTE_DIR/.aiws-deploy.lock bash -s -- codelit/courselit-app:previous"
}

@test "each public script prints usage for --help without touching anything" {
    for script in deploy.sh migrate.sh restore-db.sh smoke.sh rollback.sh; do
        run "$PROD_DIR/$script" --help
        [ "$status" -eq 0 ]
        [[ "$output" == *"Usage: scripts/prod/$script"* ]]
    done
    refute_call " ssh "
    refute_call " docker "
}
