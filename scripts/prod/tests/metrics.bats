#!/usr/bin/env bats

load helpers/setup

setup() {
    prod_setup
    SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
    export AIWS_METRICS_FILE="$BATS_TEST_TMPDIR/metrics.tsv"
}

@test "deploy records build seconds and loaded image bytes for the runtime image" {
    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]

    [ -f "$AIWS_METRICS_FILE" ]
    line="$(grep 'kind=runtime' "$AIWS_METRICS_FILE")"
    [[ "$line" == *"sha=$SHA"* ]]
    [[ "$line" == *"image=aiws/courselit-app:$SHA"* ]]
    [[ "$line" == *"platform=linux/amd64"* ]]

    seconds="$(printf '%s' "$line" | tr '\t' '\n' | sed -n 's/^build_seconds=//p')"
    bytes="$(printf '%s' "$line" | tr '\t' '\n' | sed -n 's/^image_bytes=//p')"
    [ "$seconds" -ge 0 ]
    [ "$bytes" -gt 0 ]
}

@test "the metrics file is one tab-separated key=value record per build" {
    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]
    [ "$(wc -l <"$AIWS_METRICS_FILE" | tr -d ' ')" -eq 1 ]
    field_count="$(head -1 "$AIWS_METRICS_FILE" | tr '\t' '\n' | grep -c '=')"
    [ "$field_count" -eq 7 ]
}

@test "the migration build is measured under its own kind" {
    run "$PROD_DIR/migrate.sh" "$SHA" "$MIGRATION" --apply --yes
    [ "$status" -eq 0 ]
    grep -q 'kind=migration' "$AIWS_METRICS_FILE"
    grep -q "image=courselit-migrate:$SHA" "$AIWS_METRICS_FILE"
}

@test "metrics never contain a secret from the live env file" {
    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]
    ! grep -q 's3cr3t' "$AIWS_METRICS_FILE"
}
