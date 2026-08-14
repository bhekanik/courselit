#!/usr/bin/env bats

load helpers/setup

setup() {
    prod_setup
    SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
    REF="aiws/courselit-app:$SHA"
    PREV="$(container_image_of app)"
}

@test "a failing public smoke rolls the app back to the previous image" {
    set_url https://school.test/login 503 'text/html' ""

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"rolled back"* ]]

    [ "$(container_image_of app)" = "$PREV" ]
    [ "$(sed -n 's/^AIWS_APP_IMAGE=//p' "$REMOTE_DIR/aiws-active-image.env")" = "$PREV" ]
}

@test "automatic rollback refuses to clobber a deployment that landed during the smoke" {
    set_url https://school.test/login 503 'text/html' ""

    # A concurrent deploy swaps the app image while the smoke is running.
    hook="$BATS_TEST_TMPDIR/hook"
    cat >"$hook" <<HOOK
#!/usr/bin/env bash
case "\$1" in
*/login)
    printf 'someone-else/app:newer\t9999999999999999999999999999999999999999\n' \
        >>"$FAKE_REMOTE_DOCKER_STATE/images"
    awk -F'\t' 'BEGIN { OFS = "\t" } \$5 == "app" { \$3 = "someone-else/app:newer" } { print }' \
        "$FAKE_REMOTE_DOCKER_STATE/containers" >"$FAKE_REMOTE_DOCKER_STATE/c.tmp"
    mv "$FAKE_REMOTE_DOCKER_STATE/c.tmp" "$FAKE_REMOTE_DOCKER_STATE/containers"
    ;;
esac
HOOK
    chmod +x "$hook"
    export FAKE_CURL_HOOK="$hook"

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"refusing to clobber a newer deployment"* ]]
    [ "$(container_image_of app)" = "someone-else/app:newer" ]
}

@test "a failed activation leaves the app on the previous image" {
    export FAKE_COMPOSE_UP_EXIT=1

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"remote activation failed"* ]]
    [ "$(container_image_of app)" = "$PREV" ]
    [ "$(sed -n 's/^AIWS_APP_IMAGE=//p' "$REMOTE_DIR/aiws-active-image.env")" = "$PREV" ]
}
