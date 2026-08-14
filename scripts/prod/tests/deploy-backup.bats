#!/usr/bin/env bats

load helpers/setup

setup() {
    prod_setup
    SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
}

@test "deploy backs up live config and the database before activating" {
    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]

    B="$(backup_dir)"
    [ "$(file_mode "$B")" = "700" ]
    [ "$(file_mode "$B/env")" = "600" ]

    # Byte-identical copies of what was live, not just files that exist.
    [ "$(md5 -q "$B/compose.yml")" = "$(md5 -q "$REMOTE_DIR/compose.yml")" ]
    [ "$(md5 -q "$B/env")" = "$(md5 -q "$REMOTE_DIR/.env")" ]
    [ "$(wc -c <"$B/mongo.archive.gz" | tr -d ' ')" = "4096" ]

    grep -q "^CANDIDATE_REVISION=$SHA$" "$B/deployment.meta"
    grep -q "^PREVIOUS_IMAGE=codelit/courselit-app:latest$" "$B/deployment.meta"
    ! grep -q 's3cr3t' "$B/deployment.meta"

    assert_call_before "mongodump --username" "up -d --no-deps app"
}

@test "deploy aborts without activating when the mongodump is too small to be real" {
    seed_exec mongo 'case "$*" in *"command -v mongodump"*) exit 0 ;; esac; printf ""'

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"mongodump"* ]]
    refute_call "up -d --no-deps app"
}

@test "the mongodump floor is inclusive" {
    export AIWS_MIN_DUMP_BYTES=4096

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]
}

@test "a mongodump one byte under the floor aborts the deploy" {
    export AIWS_MIN_DUMP_BYTES=4097

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"4096 bytes"* ]]
    refute_call "up -d --no-deps app"
}

@test "deploy refuses to overwrite an existing backup directory" {
    mkdir -p "$(backup_dir)"

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"already exists"* ]]
    refute_call "up -d --no-deps app"
}
