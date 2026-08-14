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
Usage: scripts/prod/migrate.sh <full-commit-sha> <migration-file> --dry-run
       scripts/prod/migrate.sh <full-commit-sha> <migration-file> --apply --yes

Runs exactly one committed migration against the production database, from an
image built out of the same commit. The migration never enters the runtime
image and never runs at app startup.

  <full-commit-sha>   exact 40-character commit SHA that exists in this repo
  <migration-file>    a bare filename under apps/web/.migrations as committed
                      at that SHA, e.g. 20-06-26_00-00-convert-likes-to-reactions.js
  --dry-run           pass --dry-run to the migration: no --yes, no database
                      dump, and the app is never stopped by the harness
  --apply --yes       mutate the production database; --apply alone is refused

The chosen mode is passed to the migration script itself as its first argument
(--dry-run or --apply), so a migration can honour it.

Both modes build services/app/Dockerfile target `builder` from `git archive
<sha>`, tag it courselit-migrate:<sha>, stream it to the host over ssh (no
registry), prove the migration file exists inside that image, and run
`node <migrations-dir>/<file> <mode>` once on the app's compose network with the
live env file.

--apply additionally stops the app before the pre-migration mongodump and keeps
it stopped until the migration and a post-migration database read-back have both
succeeded; then it restarts and verifies the app and smokes the public site. Any
failure before that leaves the app stopped, on purpose.

The migration process's own exit code is preserved end to end.

It never writes compose.yml, the override, or the live .env.
EOF
}

main() {
    case "${1:-}" in
    -h | --help)
        usage
        return 0
        ;;
    esac

    local sha="${1:-}" migration="${2:-}" mode="${3:-}" confirm="${4:-}"
    is_full_sha "$sha" ||
        die "expected a full 40-character commit SHA, got: '$sha'"
    [ -n "$migration" ] || {
        usage >&2
        die "a migration file name is required"
    }
    assert_safe_token "migration file" "$migration"
    case "$migration" in
    */* | .*) die "migration file must be a bare name under $AIWS_MIGRATIONS_DIR, got: '$migration'" ;;
    esac
    case "$mode" in
    --dry-run)
        [ -z "$confirm" ] ||
            die "--dry-run takes no confirmation flag; the migration must honour its non-mutating contract"
        ;;
    --apply)
        [ "$confirm" = "--yes" ] ||
            die "refusing to mutate the production database without --apply --yes"
        ;;
    *)
        usage >&2
        die "a migration mode is required: --dry-run, or --apply --yes to mutate the production database"
        ;;
    esac
    local mode_name="${mode#--}"

    REPO_ROOT="$(git -C "$PROD_DIR" rev-parse --show-toplevel)"
    [ "$(git -C "$REPO_ROOT" cat-file -t "$sha" 2>/dev/null || true)" = "commit" ] ||
        die "$sha is not a commit in this repository"
    # Fail closed early. The image itself is checked again on the host, which is
    # the authoritative test -- this one just saves a pointless build.
    git -C "$REPO_ROOT" cat-file -e "$sha:$AIWS_MIGRATIONS_DIR/$migration" 2>/dev/null ||
        die "$AIWS_MIGRATIONS_DIR/$migration does not exist at commit $sha"

    local ref="$AIWS_MIGRATE_IMAGE_REPO:$sha"
    assert_safe_token "image reference" "$ref"

    preflight_local
    preflight_remote

    build_from_commit migration "$sha" "$ref" "$AIWS_MIGRATE_TARGET"
    transfer_image "$sha" "$ref"

    log "running $migration on $AIWS_SSH_HOST from $ref in $mode_name mode"
    # No `||` and no if: set -e must carry the migration process's own exit code
    # out of here unchanged, and r_die/negation would flatten it to 1.
    remote_run_locked migrate.sh "$ref" "$migration" "$sha" "$mode_name"
    if [ "$mode_name" = apply ]; then
        "$PROD_DIR/smoke.sh" ||
            die "migration $migration completed but the public smoke failed; stop and review backup migrate-$AIWS_DEPLOY_TS before any restore"
    fi
    log "migration $migration completed from $ref in $mode_name mode"
}

main "$@"
