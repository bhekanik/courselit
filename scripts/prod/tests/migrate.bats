#!/usr/bin/env bats

load helpers/setup

setup() {
    prod_setup
    SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
    REF="courselit-migrate:$SHA"
}

@test "migrate builds the Dockerfile builder stage from the committed tree under an exact-SHA tag" {
    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --yes
    [ "$status" -eq 0 ]

    assert_call "archive --format=tar $SHA"
    assert_call "buildx build --platform linux/amd64"
    assert_call "--target builder"
    assert_call "--tag $REF"
    assert_call "--label org.opencontainers.image.revision=$SHA"
    [ "$(cat "$FAKE_DOCKER_STATE/last-build-context")" = "GITARCHIVE $SHA" ]
}

@test "migrate refuses when the migration tag already holds a different revision" {
    seed_image local "$REF" 4444444444444444444444444444444444444444

    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --yes
    [ "$status" -ne 0 ]
    [[ "$output" == *"immutable"* ]]
    refute_call "buildx build"
}

@test "migrate transfers the image over ssh without a registry" {
    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --yes
    [ "$status" -eq 0 ]
    assert_call "docker save $REF"
    assert_call "remote docker load"
    refute_call "docker push"
    refute_call "docker pull"
}

@test "migrate refuses a migration that is not committed at that SHA" {
    run "$PROD_DIR/migrate.sh" "$SHA" 99-99-99_00-00-not-a-real-migration.js --yes
    [ "$status" -ne 0 ]
    [[ "$output" == *"not-a-real-migration"* ]]
    refute_call "buildx build"
}

@test "migrate refuses a migration argument that escapes the migrations directory" {
    run "$PROD_DIR/migrate.sh" "$SHA" ../../package.json --yes
    [ "$status" -ne 0 ]
    refute_call "buildx build"
    refute_call " ssh "
}

@test "migrate fails closed when the file is missing from the built image" {
    export FAKE_MIGRATION_PRESENT=0

    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --yes
    [ "$status" -ne 0 ]
    [[ "$output" == *"$MIGRATION"* ]]
    refute_call "remote docker run --rm --network"
}

@test "migrate runs one-off on the app network with the live env file and never renders secrets" {
    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --yes
    [ "$status" -eq 0 ]

    assert_call "docker run --rm --network notto-demo_default"
    assert_call "--env-file .env"
    assert_call "--entrypoint node"
    assert_call "apps/web/.migrations/$MIGRATION"
    refute_secret_leak "$output"
    refute_rendered_compose_config
}

@test "migrate takes a pre-mutation mongodump and records the outcome" {
    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --yes
    [ "$status" -eq 0 ]

    B="$REMOTE_DIR/aiws-backups/migrate-$AIWS_DEPLOY_TS"
    [ "$(file_mode "$B")" = "700" ]
    [ "$(file_mode "$B/mongo.archive.gz")" = "600" ]
    assert_call_before "mongodump" "docker run --rm --network"
    grep -q "^MIGRATION=$MIGRATION$" "$B/migration.meta"
    grep -q "^MIGRATION_IMAGE=$REF$" "$B/migration.meta"
    grep -q '^OUTCOME=succeeded$' "$B/migration.meta"
}

@test "migrate records a failed migration and leaves the app service alone" {
    APP_BEFORE="$(container_id_of app)"
    export FAKE_MIGRATION_EXIT=3

    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --yes
    [ "$status" -ne 0 ]
    grep -q '^OUTCOME=failed$' "$REMOTE_DIR/aiws-backups/migrate-$AIWS_DEPLOY_TS/migration.meta"
    [ "$(container_id_of app)" = "$APP_BEFORE" ]
    refute_call "up -d --no-deps app"
}

@test "migrate refuses a remotely loaded image whose revision is not the requested SHA" {
    export FAKE_LOAD_REVISION=3333333333333333333333333333333333333333

    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --yes
    [ "$status" -ne 0 ]
    [[ "$output" == *"revision"* ]]
    refute_call "mongodump --username"
}

@test "migrate smokes the public site after the database mutation" {
    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --yes
    [ "$status" -eq 0 ]
    assert_call_before "docker run --rm --network" "https://school.test/"
}

@test "migrate never writes the compose file, the override or the live env file" {
    before="$(cksum <"$REMOTE_DIR/compose.yml") $(cksum <"$REMOTE_DIR/.env")"

    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --yes
    [ "$status" -eq 0 ]

    [ "$before" = "$(cksum <"$REMOTE_DIR/compose.yml") $(cksum <"$REMOTE_DIR/.env")" ]
    [ ! -f "$REMOTE_DIR/compose.aiws.yml" ]
}

@test "migrate requires an explicit confirmation flag" {
    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION"
    [ "$status" -ne 0 ]
    [[ "$output" == *"--yes"* ]]
    refute_call "buildx build"
}
