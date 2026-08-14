#!/usr/bin/env bats

load helpers/setup

setup() {
    prod_setup
    SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
    REF="aiws/courselit-app:$SHA"
}

remote_image_revision() {
    awk -F'\t' -v r="$1" '$1 == r { print $2 }' "$FAKE_REMOTE_DOCKER_STATE/images"
}

@test "deploy streams the image to the host over ssh and never uses a registry" {
    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]

    assert_call "docker save $REF"
    assert_call "remote docker load"
    refute_call "docker push"
    refute_call "docker pull"

    [ "$(remote_image_revision "$REF")" = "$SHA" ]
}

@test "deploy compresses the image stream before it crosses the network" {
    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]
    [ "$(cat "$FAKE_REMOTE_DOCKER_STATE/last-load-encoding")" = "gzip" ]
    [ "$(remote_image_revision "$REF")" = "$SHA" ]
}
