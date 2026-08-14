#!/usr/bin/env bats

load helpers/setup

setup() {
    prod_setup
    SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
    REF="aiws/courselit-app:$SHA"
    PREV="$(container_image_of app)"
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

    assert_call_before "stop app" "mongodump --username"
    assert_call_before "mongodump --username" "up -d --no-deps app"
}

@test "deploy restores the previous app when mongodump is too small to be real" {
    seed_exec mongo 'case "$*" in *"command -v mongodump"*) exit 0 ;; esac; printf ""'

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"mongodump"* ]]
    assert_call_before "stop app" "mongodump --username"
    assert_call "up -d --no-deps app"
    [ "$(container_image_of app)" = "$PREV" ]
    [ "$(container_state_of app)" = running ]
    [ ! -e "$REMOTE_DIR/compose.aiws.yml" ]
    [ ! -e "$REMOTE_DIR/aiws-active-image.env" ]
    [ ! -e "$(backup_dir)/deployment.meta" ]
}

@test "deploy restores the previous app when mongodump itself fails" {
    seed_exec mongo 'case "$*" in
      *"command -v mongodump"*) exit 0 ;;
      *mongodump*) exit 4 ;;
    esac'

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"mongodump failed"* ]]
    assert_call_before "stop app" "mongodump --username"
    assert_call "up -d --no-deps app"
    [ "$(container_image_of app)" = "$PREV" ]
    [ "$(container_state_of app)" = running ]
    [ ! -e "$(backup_dir)/deployment.meta" ]
}

@test "deploy restores exact prior config when candidate compose validation fails" {
    cat >"$REMOTE_DIR/compose.aiws.yml" <<'YAML'
services:
  app:
    image: ${AIWS_APP_IMAGE}
    labels:
      aiws.test-state: prior
YAML
    printf 'AIWS_APP_IMAGE=%s\n' "$PREV" >"$REMOTE_DIR/aiws-active-image.env"
    chmod 640 "$REMOTE_DIR/compose.aiws.yml"
    chmod 604 "$REMOTE_DIR/aiws-active-image.env"
    override_sum="$(md5 -q "$REMOTE_DIR/compose.aiws.yml")"
    image_env_sum="$(md5 -q "$REMOTE_DIR/aiws-active-image.env")"
    export FAKE_COMPOSE_CONFIG_REJECT_IMAGE="$REF"

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"does not validate"* ]]
    assert_call_before "stop app" "mongodump --username"
    assert_call "up -d --no-deps app"
    [ "$(container_image_of app)" = "$PREV" ]
    [ "$(container_state_of app)" = running ]
    [ "$(md5 -q "$REMOTE_DIR/compose.aiws.yml")" = "$override_sum" ]
    [ "$(md5 -q "$REMOTE_DIR/aiws-active-image.env")" = "$image_env_sum" ]
    [ "$(file_mode "$REMOTE_DIR/compose.aiws.yml")" = 640 ]
    [ "$(file_mode "$REMOTE_DIR/aiws-active-image.env")" = 604 ]
    [ ! -e "$(backup_dir)/deployment.meta" ]
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
    [ "$(container_image_of app)" = "$PREV" ]
    [ "$(container_state_of app)" = running ]
}

@test "deploy refuses to overwrite an existing backup directory" {
    mkdir -p "$(backup_dir)"

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"already exists"* ]]
    refute_call "up -d --no-deps app"
}
