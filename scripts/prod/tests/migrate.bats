#!/usr/bin/env bats

load helpers/setup

setup() {
    prod_setup
    SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
    REF="courselit-migrate:$SHA"
}

@test "migrate builds the Dockerfile builder stage from the committed tree under an exact-SHA tag" {
    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --apply --yes
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

    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --apply --yes
    [ "$status" -ne 0 ]
    [[ "$output" == *"immutable"* ]]
    refute_call "buildx build"
}

@test "migrate transfers the image over ssh without a registry" {
    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --apply --yes
    [ "$status" -eq 0 ]
    assert_call "docker save $REF"
    assert_call "remote docker load"
    refute_call "docker push"
    refute_call "docker pull"
}

@test "migrate refuses a migration that is not committed at that SHA" {
    run "$PROD_DIR/migrate.sh" "$SHA" 99-99-99_00-00-not-a-real-migration.js --apply --yes
    [ "$status" -ne 0 ]
    [[ "$output" == *"not-a-real-migration"* ]]
    refute_call "buildx build"
}

@test "migrate refuses a migration argument that escapes the migrations directory" {
    run "$PROD_DIR/migrate.sh" "$SHA" ../../package.json --apply --yes
    [ "$status" -ne 0 ]
    refute_call "buildx build"
    refute_call " ssh "
}

@test "migrate fails closed when the file is missing from the built image" {
    export FAKE_MIGRATION_PRESENT=0

    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --apply --yes
    [ "$status" -ne 0 ]
    [[ "$output" == *"$MIGRATION"* ]]
    refute_call "remote docker run --rm --network"
}

@test "migrate dry run injects the source-controlled target when the live env omits it" {
    ! grep -q '^TARGET_DOMAIN=' "$REMOTE_DIR/.env"

    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --dry-run
    [ "$status" -eq 0 ]

    assert_call "docker run --rm --network notto-demo_default"
    assert_call "--env-file .env"
    assert_call "--env TARGET_DOMAIN=main"
    assert_call "--entrypoint node"
    assert_call "apps/web/.migrations/$MIGRATION"
    refute_secret_leak "$output"
    refute_rendered_compose_config
}

@test "migrate rejects an empty target before build or remote work" {
    export AIWS_TARGET_DOMAIN=

    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --dry-run
    [ "$status" -ne 0 ]
    [[ "$output" == *"AIWS_TARGET_DOMAIN must not be empty"* ]]
    refute_call "buildx build"
    refute_call " ssh "
    refute_secret_leak "$output"
}

@test "migrate rejects any target other than main before build or remote work" {
    export AIWS_TARGET_DOMAIN=another-school

    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --dry-run
    [ "$status" -ne 0 ]
    [[ "$output" == *"AIWS_TARGET_DOMAIN must be exactly 'main'"* ]]
    refute_call "buildx build"
    refute_call " ssh "
    refute_secret_leak "$output"
}

@test "migrate takes a pre-mutation mongodump and records the outcome" {
    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --apply --yes
    [ "$status" -eq 0 ]

    B="$REMOTE_DIR/aiws-backups/migrate-$AIWS_DEPLOY_TS"
    [ "$(file_mode "$B")" = "700" ]
    [ "$(file_mode "$B/mongo.archive.gz")" = "600" ]
    assert_call_before "mongodump" "docker run --rm --network"
    grep -q "^MIGRATION=$MIGRATION$" "$B/migration.meta"
    grep -q "^MIGRATION_IMAGE=$REF$" "$B/migration.meta"
    grep -q '^MIGRATION_MODE=apply$' "$B/migration.meta"
    grep -q '^OUTCOME=succeeded$' "$B/migration.meta"
}

@test "migrate apply stops app writers before the pre-migration dump and restarts only after verification" {
    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --apply --yes
    [ "$status" -eq 0 ]

    assert_call_before "stop app" "mongodump --username"
    assert_call_before "docker run --rm --network" "up -d --no-deps app"
    assert_call_before "up -d --no-deps app" "https://school.test/"
    # Two dumps: the pre-migration backup and the post-migration read-back.
    [ "$(grep -c 'mongodump --username' "$FAKE_CALLS")" -ge 2 ]
    refute_broad_compose_up
}

@test "migrate apply leaves the app stopped when the post-migration read-back is unusable" {
    seed_exec mongo 'case "$*" in
      *"command -v mongodump"*) exit 0 ;;
      *mongodump*)
        count_file="$FAKE_DOCKER_STATE/dump-count"
        count="$(cat "$count_file" 2>/dev/null || printf 0)"
        count=$((count + 1))
        printf "%s" "$count" >"$count_file"
        if [ "$count" -eq 1 ]; then head -c 4096 /dev/zero; else printf x; fi
        ;;
    esac'

    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --apply --yes
    [ "$status" -ne 0 ]
    [[ "$output" == *"verification"* ]]
    grep -q '^OUTCOME=failed$' "$REMOTE_DIR/aiws-backups/migrate-$AIWS_DEPLOY_TS/migration.meta"
    assert_call "stop app"
    refute_call "up -d --no-deps app"
}

@test "migrate apply stops an app that restarts but fails verification" {
    export FAKE_UP_NETWORKS=isolated_net

    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --apply --yes
    [ "$status" -ne 0 ]
    [[ "$output" == *"network"* ]]
    grep -q '^OUTCOME=failed$' "$REMOTE_DIR/aiws-backups/migrate-$AIWS_DEPLOY_TS/migration.meta"
    [ "$(grep -c 'stop app' "$FAKE_CALLS")" -eq 2 ]
    [ "$(container_state_of app)" = stopped ]
}

@test "migrate apply leaves the app stopped when the pre-migration dump is unusable" {
    seed_exec mongo 'case "$*" in
      *"command -v mongodump"*) exit 0 ;;
      *mongodump*) printf x ;;
    esac'

    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --apply --yes
    [ "$status" -ne 0 ]
    [[ "$output" == *"byte floor"* ]]
    assert_call "stop app"
    refute_call "docker run --rm --network"
    refute_call "up -d --no-deps app"
}

@test "migrate records a failed migration, leaves the app stopped and preserves its exit code" {
    export FAKE_MIGRATION_EXIT=3

    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --apply --yes
    [ "$status" -eq 3 ]
    grep -q '^OUTCOME=failed$' "$REMOTE_DIR/aiws-backups/migrate-$AIWS_DEPLOY_TS/migration.meta"
    assert_call "stop app"
    refute_call "up -d --no-deps app"
}

@test "migrate passes the explicit mode through to the committed migration script" {
    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --apply --yes
    [ "$status" -eq 0 ]
    assert_call "apps/web/.migrations/$MIGRATION --apply"
}

@test "migrate dry run never stops the app, dumps the database or asks for --yes" {
    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --dry-run
    [ "$status" -eq 0 ]

    assert_call "apps/web/.migrations/$MIGRATION --dry-run"
    refute_call "mongodump --username"
    refute_call "stop app"
    refute_call "up -d --no-deps app"
    grep -q '^MIGRATION_MODE=dry-run$' "$REMOTE_DIR/aiws-backups/migrate-$AIWS_DEPLOY_TS/migration.meta"
}

@test "migrate dry run preserves a failing migration's exact exit code" {
    export FAKE_MIGRATION_EXIT=7

    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --dry-run
    [ "$status" -eq 7 ]
    grep -q '^OUTCOME=failed$' "$REMOTE_DIR/aiws-backups/migrate-$AIWS_DEPLOY_TS/migration.meta"
}

@test "migrate refuses --apply without --yes" {
    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --apply
    [ "$status" -ne 0 ]
    [[ "$output" == *"--yes"* ]]
    refute_call "buildx build"
}

@test "migrate refuses --dry-run combined with --yes" {
    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --dry-run --yes
    [ "$status" -ne 0 ]
    refute_call "buildx build"
}

@test "migrate refuses a remotely loaded image whose revision is not the requested SHA" {
    export FAKE_LOAD_REVISION=3333333333333333333333333333333333333333

    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --apply --yes
    [ "$status" -ne 0 ]
    [[ "$output" == *"revision"* ]]
    refute_call "mongodump --username"
}

@test "migrate smokes the public site after the database mutation" {
    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --apply --yes
    [ "$status" -eq 0 ]
    assert_call_before "docker run --rm --network" "https://school.test/"
}

@test "migrate never writes the compose file, the override or the live env file" {
    before="$(cksum <"$REMOTE_DIR/compose.yml") $(cksum <"$REMOTE_DIR/.env")"

    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --apply --yes
    [ "$status" -eq 0 ]

    [ "$before" = "$(cksum <"$REMOTE_DIR/compose.yml") $(cksum <"$REMOTE_DIR/.env")" ]
    [ ! -f "$REMOTE_DIR/compose.aiws.yml" ]
}

@test "migrate requires an explicit mode" {
    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION"
    [ "$status" -ne 0 ]
    [[ "$output" == *"--dry-run"* ]]
    [[ "$output" == *"--yes"* ]]
    refute_call "buildx build"
}
