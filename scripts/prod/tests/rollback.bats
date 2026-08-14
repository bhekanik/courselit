#!/usr/bin/env bats

load helpers/setup

setup() {
    prod_setup
    PREV="$(container_image_of app)"
    APP_BEFORE="$(container_id_of app)"
}

@test "rollback refuses an image reference containing shell metacharacters" {
    run "$PROD_DIR/rollback.sh" 'codelit/app:latest; rm -rf /'
    [ "$status" -ne 0 ]
    [[ "$output" == *"unsafe characters"* ]]
    refute_call " ssh "
}

@test "rollback requires an image reference" {
    run "$PROD_DIR/rollback.sh"
    [ "$status" -ne 0 ]
    refute_call " ssh "
}

@test "rollback refuses an image the host does not already have" {
    run "$PROD_DIR/rollback.sh" aiws/courselit-app:never-loaded
    [ "$status" -ne 0 ]
    [[ "$output" == *"no such image"* ]]
    [ "$(container_id_of app)" = "$APP_BEFORE" ]
    refute_call "up -d --no-deps app"
}

@test "rollback switches only the app to the given image and verifies invariants" {
    MONGO_BEFORE="$(container_id_of mongo)"
    MEDIALIT_BEFORE="$(container_id_of medialit)"
    seed_image remote codelit/courselit-app:previous ''

    run "$PROD_DIR/rollback.sh" codelit/courselit-app:previous
    [ "$status" -eq 0 ]

    [ "$(container_image_of app)" = "codelit/courselit-app:previous" ]
    [ "$(container_id_of app)" != "$APP_BEFORE" ]
    [ "$(container_id_of mongo)" = "$MONGO_BEFORE" ]
    [ "$(container_id_of medialit)" = "$MEDIALIT_BEFORE" ]
    refute_broad_compose_up
    assert_call "media/signature/create"
    assert_call "https://school.test/"
}

@test "rollback records the pre-rollback state without dumping or restoring mongo" {
    seed_image remote codelit/courselit-app:previous ''

    run "$PROD_DIR/rollback.sh" codelit/courselit-app:previous
    [ "$status" -eq 0 ]

    B="$REMOTE_DIR/aiws-backups/rollback-$AIWS_DEPLOY_TS"
    [ "$(file_mode "$B")" = "700" ]
    [ "$(file_mode "$B/env")" = "600" ]
    grep -q "^PREVIOUS_IMAGE=$PREV$" "$B/rollback.meta"
    grep -q '^ROLLBACK_TO_IMAGE=codelit/courselit-app:previous$' "$B/rollback.meta"

    refute_call "mongorestore"
    refute_call "mongodump"
    [ ! -e "$B/mongo.archive.gz" ]
}

@test "rollback fails when the app does not come back healthy on the target image" {
    seed_image remote codelit/courselit-app:previous ''
    export FAKE_APP_HEALTH=unhealthy

    run "$PROD_DIR/rollback.sh" codelit/courselit-app:previous
    [ "$status" -ne 0 ]
    [[ "$output" == *"healthy"* ]]
}
