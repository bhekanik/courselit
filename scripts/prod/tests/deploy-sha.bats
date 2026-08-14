#!/usr/bin/env bats

load helpers/setup

setup() { prod_setup; }

@test "deploy rejects an abbreviated SHA without touching docker or ssh" {
    run "$PROD_DIR/deploy.sh" 62b5abb5
    [ "$status" -ne 0 ]
    [[ "$output" == *"full 40-character commit SHA"* ]]
    refute_call " docker "
    refute_call " ssh "
}

@test "deploy rejects a well-formed SHA that is not in the repo" {
    run "$PROD_DIR/deploy.sh" 0000000000000000000000000000000000000000
    [ "$status" -ne 0 ]
    [[ "$output" == *"not a commit in this repository"* ]]
    refute_call " docker "
}

@test "deploy rejects an uppercase SHA rather than guessing at a tag" {
    run "$PROD_DIR/deploy.sh" "$(git -C "$REPO_ROOT" rev-parse HEAD | tr 'a-f' 'A-F')"
    [ "$status" -ne 0 ]
    [[ "$output" == *"full 40-character commit SHA"* ]]
    refute_call " docker "
}
