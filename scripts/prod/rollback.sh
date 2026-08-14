#!/usr/bin/env bash
set -euo pipefail

PROD_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$PROD_DIR/lib/common.sh"
. "$PROD_DIR/lib/config.sh"
. "$PROD_DIR/lib/remote.sh"

usage() {
    cat <<'EOF'
Usage: scripts/prod/rollback.sh <image-reference>

Points the production app service at an image that is already on the host and
verifies the same invariants a deploy does. Changes the app service only.

  <image-reference>   e.g. aiws/courselit-app:<sha>, or the upstream pinned
                      reference codelit/courselit-app:latest@sha256:<digest>

List what the host has:
  ssh notto-deploy docker images

This never touches Mongo. Restoring the database is a separate, deliberate
manual procedure -- see "Restoring the database" in scripts/prod/README.md.
EOF
}

main() {
    case "${1:-}" in
    -h | --help)
        usage
        return 0
        ;;
    "")
        usage >&2
        die "an image reference is required"
        ;;
    esac

    local image="$1"
    assert_safe_token "image reference" "$image"

    log "rolling the app back to $image on $AIWS_SSH_HOST"
    remote_run_locked rollback.sh "$image"
    "$PROD_DIR/smoke.sh" ||
        die "rolled back to $image but the public smoke failed; production is not verified"
    log "rolled back to $image"
}

main "$@"
