#!/usr/bin/env bats

load helpers/setup

setup() {
    prod_setup
    BACKUP_ID="$AIWS_DEPLOY_TS"
    B="$REMOTE_DIR/aiws-backups/$BACKUP_ID"
    mkdir -p "$B"
    chmod 700 "$B"
    head -c 4096 /dev/urandom | gzip >"$B/mongo.archive.gz"
    chmod 600 "$B/mongo.archive.gz"
    CONFIRM=--i-understand-this-overwrites-the-production-database
}

@test "restore refuses without the confirmation flag" {
    run "$PROD_DIR/restore-db.sh" "$BACKUP_ID"
    [ "$status" -ne 0 ]
    [[ "$output" == *"$CONFIRM"* ]]
    refute_call " ssh "
    refute_call "mongorestore"
}

@test "restore refuses without an exact backup id" {
    run "$PROD_DIR/restore-db.sh" "$CONFIRM"
    [ "$status" -ne 0 ]
    refute_call "mongorestore"
}

@test "restore refuses a backup id that does not exist on the host" {
    run "$PROD_DIR/restore-db.sh" "$CONFIRM" 20990101T000000Z
    [ "$status" -ne 0 ]
    [[ "$output" == *"20990101T000000Z"* ]]
    refute_call "mongorestore"
}

@test "restore refuses a path-like backup id before contacting the host" {
    run "$PROD_DIR/restore-db.sh" "$CONFIRM" ../../outside
    [ "$status" -ne 0 ]
    [[ "$output" == *"backup id"* ]]
    refute_call " ssh "
}

@test "restore refuses an archive below the usable-dump floor" {
    printf 'x' >"$B/mongo.archive.gz"

    run "$PROD_DIR/restore-db.sh" "$CONFIRM" "$BACKUP_ID"
    [ "$status" -ne 0 ]
    [[ "$output" == *"bytes"* ]]
    refute_call "mongorestore"
}

@test "restore stops app writes before mongorestore --drop and restarts afterwards" {
    run "$PROD_DIR/restore-db.sh" "$CONFIRM" "$BACKUP_ID"
    [ "$status" -eq 0 ]

    assert_call "mongorestore"
    assert_call "--drop"
    assert_call_before "stop app" "exec mongorestore"
    assert_call_before "exec mongorestore" "up -d --no-deps app"
    refute_broad_compose_up
}

@test "restore stops app writes before its own pre-restore safety dump" {
    run "$PROD_DIR/restore-db.sh" "$CONFIRM" "$BACKUP_ID"
    [ "$status" -eq 0 ]
    assert_call_before "stop app" "mongodump --username"
}

@test "restore can restore a previous run's safety dump by its restore- backup id" {
    # A real mongodump --gzip writes a gzip stream, and the safety dump has to
    # survive the same gzip -t guard as any other archive.
    seed_exec mongo 'case "$*" in
      *"command -v mongodump"*) exit 0 ;;
      *"command -v mongorestore"*) exit 0 ;;
      *mongorestore*) cat >/dev/null; exit 0 ;;
      *mongodump*) head -c 8192 /dev/urandom | gzip ;;
    esac'

    run "$PROD_DIR/restore-db.sh" "$CONFIRM" "$BACKUP_ID"
    [ "$status" -eq 0 ]
    SAFETY="restore-$AIWS_DEPLOY_TS"
    [ -f "$REMOTE_DIR/aiws-backups/$SAFETY/pre-restore.archive.gz" ]

    # A second restore needs its own record directory, so move the clock on.
    export AIWS_DEPLOY_TS=20260814T130000Z
    : >"$FAKE_CALLS"
    run "$PROD_DIR/restore-db.sh" "$CONFIRM" "$SAFETY"
    [ "$status" -eq 0 ]
    grep -q "^RESTORED_FROM=$SAFETY$" "$REMOTE_DIR/aiws-backups/restore-20260814T130000Z/restore.meta"
    assert_call "mongorestore"
}

@test "restore refuses a restore- backup id whose safety dump is missing" {
    mkdir -p "$REMOTE_DIR/aiws-backups/restore-20990101T000000Z"

    run "$PROD_DIR/restore-db.sh" "$CONFIRM" restore-20990101T000000Z
    [ "$status" -ne 0 ]
    [[ "$output" == *"pre-restore.archive.gz"* ]]
    refute_call "mongorestore"
}

@test "restore still refuses a traversal attempt dressed as a restore- id" {
    run "$PROD_DIR/restore-db.sh" "$CONFIRM" restore-../../outside
    [ "$status" -ne 0 ]
    refute_call " ssh "
}

@test "restore records a failed outcome and leaves the app stopped when mongorestore fails" {
    seed_exec mongo 'case "$*" in
      *"command -v mongodump"*) exit 0 ;;
      *"command -v mongorestore"*) exit 0 ;;
      *mongorestore*) cat >/dev/null; exit 1 ;;
      *mongodump*) head -c 4096 /dev/zero | tr "\\0" m ;;
    esac'

    run "$PROD_DIR/restore-db.sh" "$CONFIRM" "$BACKUP_ID"
    [ "$status" -ne 0 ]
    grep -q '^OUTCOME=failed$' "$REMOTE_DIR/aiws-backups/restore-$AIWS_DEPLOY_TS/restore.meta"
    assert_call "stop app"
    refute_call "up -d --no-deps app"
}

@test "restore records a failed outcome and leaves the app stopped when the safety dump fails" {
    seed_exec mongo 'case "$*" in
      *"command -v mongodump"*) exit 0 ;;
      *"command -v mongorestore"*) exit 0 ;;
      *mongodump*) exit 4 ;;
    esac'

    run "$PROD_DIR/restore-db.sh" "$CONFIRM" "$BACKUP_ID"
    [ "$status" -ne 0 ]
    [[ "$output" == *"safety dump"* ]]
    grep -q '^OUTCOME=failed$' "$REMOTE_DIR/aiws-backups/restore-$AIWS_DEPLOY_TS/restore.meta"
    assert_call "stop app"
    refute_call "exec mongorestore"
    refute_call "up -d --no-deps app"
}

@test "restore records a failed outcome when the app does not restart" {
    export FAKE_COMPOSE_UP_EXIT=1

    run "$PROD_DIR/restore-db.sh" "$CONFIRM" "$BACKUP_ID"
    [ "$status" -ne 0 ]
    grep -q '^OUTCOME=failed$' "$REMOTE_DIR/aiws-backups/restore-$AIWS_DEPLOY_TS/restore.meta"
    [ "$(container_state_of app)" = stopped ]
}

@test "restore records a failed outcome when the restarted app fails verification" {
    export FAKE_UP_NETWORKS=isolated_net

    run "$PROD_DIR/restore-db.sh" "$CONFIRM" "$BACKUP_ID"
    [ "$status" -ne 0 ]
    [[ "$output" == *"network"* ]]
    grep -q '^OUTCOME=failed$' "$REMOTE_DIR/aiws-backups/restore-$AIWS_DEPLOY_TS/restore.meta"
    [ "$(grep -c 'stop app' "$FAKE_CALLS")" -eq 2 ]
    [ "$(container_state_of app)" = stopped ]
}

@test "restore verifies the database is readable after the restore and smokes the site" {
    run "$PROD_DIR/restore-db.sh" "$CONFIRM" "$BACKUP_ID"
    [ "$status" -eq 0 ]
    [ "$(grep -c 'mongodump' "$FAKE_CALLS")" -ge 2 ]
    restore_line="$(grep -n 'mongorestore' "$FAKE_CALLS" | head -1 | cut -d: -f1)"
    verify_line="$(grep -n 'mongodump' "$FAKE_CALLS" | tail -1 | cut -d: -f1)"
    [ "$restore_line" -lt "$verify_line" ]
    assert_call "https://school.test/"
    [[ "$output" == *"restore rehearsal"* ]]
}

@test "restore fails when the database is unreadable after the restore" {
    seed_exec mongo 'case "$*" in
      *"command -v mongodump"*) exit 0 ;;
      *"command -v mongorestore"*) exit 0 ;;
      *mongorestore*) cat >/dev/null; exit 0 ;;
      *mongodump*)
        count_file="$FAKE_DOCKER_STATE/dump-count"
        count="$(cat "$count_file" 2>/dev/null || printf 0)"
        count=$((count + 1))
        printf "%s" "$count" >"$count_file"
        if [ "$count" -eq 1 ]; then head -c 4096 /dev/zero; else printf x; fi
        ;;
    esac'

    run "$PROD_DIR/restore-db.sh" "$CONFIRM" "$BACKUP_ID"
    [ "$status" -ne 0 ]
    [[ "$output" == *"verification"* ]]
    refute_call "up -d --no-deps app"
}

@test "restore refuses a corrupt gzip archive before stopping the app" {
    head -c 4096 /dev/zero | tr '\0' x >"$B/mongo.archive.gz"

    run "$PROD_DIR/restore-db.sh" "$CONFIRM" "$BACKUP_ID"
    [ "$status" -ne 0 ]
    [[ "$output" == *"gzip"* ]]
    refute_call "stop app"
    refute_call "mongorestore"
}

@test "restore records the outcome and never prints a secret" {
    run "$PROD_DIR/restore-db.sh" "$CONFIRM" "$BACKUP_ID"
    [ "$status" -eq 0 ]

    R="$REMOTE_DIR/aiws-backups/restore-$AIWS_DEPLOY_TS/restore.meta"
    grep -q "^RESTORED_FROM=$BACKUP_ID$" "$R"
    grep -q '^OUTCOME=succeeded$' "$R"
    [ "$(file_mode "$R")" = "600" ]
    refute_secret_leak "$output"
}

@test "restore health polling sleeps the guarded interval, never a zero-second spin" {
    export AIWS_HEALTH_INTERVAL=0 AIWS_HEALTH_TIMEOUT=5 FAKE_APP_HEALTH_AFTER=2

    run "$PROD_DIR/restore-db.sh" "$CONFIRM" "$BACKUP_ID"
    [ "$status" -eq 0 ]
    assert_call "sleep 1"
    refute_call "sleep 0"
}

@test "restore rehearsal also proves image rollback to the pre-restore image" {
    seed_image remote codelit/courselit-app:previous ''

    run "$PROD_DIR/rollback.sh" codelit/courselit-app:previous
    [ "$status" -eq 0 ]
    run "$PROD_DIR/restore-db.sh" "$CONFIRM" "$BACKUP_ID"
    [ "$status" -eq 0 ]
    [ "$(container_image_of app)" = "codelit/courselit-app:previous" ]
}
