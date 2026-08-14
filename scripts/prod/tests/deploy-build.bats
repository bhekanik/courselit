#!/usr/bin/env bats

load helpers/setup

setup() {
    prod_setup
    SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
}

@test "deploy builds linux/amd64 from the committed tree, not the working copy" {
    run "$PROD_DIR/deploy.sh" "$SHA"
    [ "$status" -eq 0 ]

    assert_call "archive --format=tar $SHA"
    assert_call "buildx build --platform linux/amd64"
    assert_call "--file services/app/Dockerfile"
    assert_call "--tag aiws/courselit-app:$SHA"
    assert_call "--label org.opencontainers.image.revision=$SHA"

    # The only thing docker ever received as build context is the archive of the
    # requested commit -- a dirty workspace cannot leak into the image.
    [ "$(cat "$FAKE_DOCKER_STATE/last-build-context")" = "GITARCHIVE $SHA" ]
}
