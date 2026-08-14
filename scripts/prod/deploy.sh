#!/usr/bin/env bash
set -euo pipefail

PROD_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$PROD_DIR/lib/common.sh"
. "$PROD_DIR/lib/config.sh"
. "$PROD_DIR/lib/remote.sh"
. "$PROD_DIR/lib/build.sh"
. "$PROD_DIR/lib/preflight.sh"

usage() {
    cat <<'EOF'
Usage: scripts/prod/deploy.sh <full-commit-sha>

Builds the CourseLit app image from the committed tree at <full-commit-sha>,
ships it to the production host over SSH (no registry), activates the app
service only, and smoke-tests it. Rolls the app back automatically if
activation or the public smoke fails.

  <full-commit-sha>   exact 40-character commit SHA that exists in this repo

Configuration variables and the manual rollback path: scripts/prod/README.md
EOF
}

# Activation and the public smoke are one unit: either the candidate is live and
# serving, or the app goes back to the image it replaced.
activate_and_verify() {
    local ref="$1" sha="$2" reason=""

    log "activating $ref on $AIWS_SSH_HOST"
    if remote_run_locked activate.sh "$ref" "$sha"; then
        if "$PROD_DIR/smoke.sh"; then
            log "deployed $ref"
            return 0
        fi
        reason="public smoke failed"
    else
        reason="remote activation failed"
    fi

    log "$reason; rolling the app back"
    remote_run_locked auto-rollback.sh "$ref" ||
        die "$reason AND the automatic rollback failed -- the app may still be serving $ref; see scripts/prod/README.md"
    die "$reason; app rolled back to the previous image"
}

main() {
    case "${1:-}" in
    -h | --help)
        usage
        return 0
        ;;
    esac

    local sha="${1:-}"
    is_full_sha "$sha" ||
        die "expected a full 40-character commit SHA, got: '$sha'"

    REPO_ROOT="$(git -C "$PROD_DIR" rev-parse --show-toplevel)"
    [ "$(git -C "$REPO_ROOT" cat-file -t "$sha" 2>/dev/null || true)" = "commit" ] ||
        die "$sha is not a commit in this repository"

    local ref="$AIWS_IMAGE_REPO:$sha"
    assert_safe_token "image reference" "$ref"

    preflight_local
    preflight_remote

    build_from_commit runtime "$sha" "$ref"
    transfer_image "$sha" "$ref"

    activate_and_verify "$ref" "$sha"
}

main "$@"
