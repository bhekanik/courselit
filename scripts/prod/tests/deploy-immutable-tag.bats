#!/usr/bin/env bats

load helpers/setup

setup() {
    prod_setup
    SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
    REF="aiws/courselit-app:$SHA"
}

@test "deploy refuses when the local tag already holds a different revision" {
    seed_image local "$REF" 1111111111111111111111111111111111111111

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"immutable"* ]]
    refute_call "buildx build"
}

@test "deploy reuses an existing tag that already holds the requested revision" {
    seed_image local "$REF" "$SHA"

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]
    [[ "$output" == *"reusing"* ]]
    refute_call "buildx build"
}

@test "deploy refuses when the remote tag already holds a different revision" {
    seed_image remote "$REF" 2222222222222222222222222222222222222222

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"immutable"* ]]
    refute_call "remote docker load"
}
