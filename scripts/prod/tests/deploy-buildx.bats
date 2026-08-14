#!/usr/bin/env bats

load helpers/setup

setup() {
    prod_setup
    SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
}

@test "preflight proves the active buildx builder can build linux/amd64" {
    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]
    assert_call "buildx inspect --bootstrap"
    assert_call_before "buildx inspect --bootstrap" "buildx build"
}

@test "preflight aborts when the buildx builder cannot produce linux/amd64" {
    export FAKE_BUILDX_PLATFORMS="linux/arm64"

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"linux/amd64"* ]]
    refute_call "buildx build"
}

@test "preflight passes on an arm64 workstation whose builder offers linux/amd64" {
    export FAKE_UNAME_M=arm64
    export FAKE_BUILDX_PLATFORMS="linux/arm64*, linux/amd64, linux/arm/v7"

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]
    assert_call "buildx build"
}

@test "deploy rejects a built image whose loaded platform is not linux/amd64" {
    export FAKE_BUILD_IMAGE_PLATFORM=linux/arm64

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"linux/arm64"* ]]
    refute_call "remote docker load"
}

@test "deploy rejects a built image whose revision label is not the requested commit" {
    export FAKE_BUILD_REVISION=3333333333333333333333333333333333333333

    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -ne 0 ]
    [[ "$output" == *"immutable"* || "$output" == *"revision"* ]]
    refute_call "remote docker load"
}
