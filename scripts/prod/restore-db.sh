#!/usr/bin/env bash
set -euo pipefail

PROD_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$PROD_DIR/lib/common.sh"
. "$PROD_DIR/lib/config.sh"
. "$PROD_DIR/lib/remote.sh"

CONFIRM_FLAG=--i-understand-this-overwrites-the-production-database

usage() {
    cat <<EOF
Usage: scripts/prod/restore-db.sh $CONFIRM_FLAG <backup-id>

Restores the production database from one archive this harness took before a
deploy or a migration, then restarts the app and smoke-tests the live site.
This is destructive: mongorestore --drop replaces the current database.

  $CONFIRM_FLAG
                      required, exactly as written
  <backup-id>         the directory name under $AIWS_BACKUP_SUBDIR on the host:
                      20260814T120000Z          a pre-deploy backup
                      migrate-20260814T120000Z  a pre-migration backup
                      restore-20260814T120000Z  the safety dump an earlier
                                                restore took of the state it
                                                replaced

List the backups the host holds:
  ssh $AIWS_SSH_HOST ls -1 $AIWS_REMOTE_DIR/$AIWS_BACKUP_SUBDIR

Rehearse it on a disposable host or a restored copy before you need it. Image
rollback is a separate, non-destructive path: scripts/prod/rollback.sh
EOF
}

main() {
    case "${1:-}" in
    -h | --help)
        usage
        return 0
        ;;
    esac

    local confirm="${1:-}" backup_id="${2:-}"
    [ "$confirm" = "$CONFIRM_FLAG" ] || {
        usage >&2
        die "a database restore requires $CONFIRM_FLAG as the first argument"
    }
    [ -n "$backup_id" ] || {
        usage >&2
        die "an exact backup id is required; this command never picks one for you"
    }
    assert_safe_token "backup id" "$backup_id"
    if ! [[ "$backup_id" =~ ^(migrate-|restore-)?[0-9]{8}T[0-9]{6}Z$ ]]; then
        die "backup id must be an exact UTC timestamp, optionally prefixed with migrate- or restore-: '$backup_id'"
    fi

    log "restoring the production database on $AIWS_SSH_HOST from backup $backup_id"
    remote_run_locked restore-db.sh "$backup_id" ||
        die "database restore from $backup_id failed; see the record under $AIWS_BACKUP_SUBDIR on $AIWS_SSH_HOST"

    "$PROD_DIR/smoke.sh" ||
        die "database restored from $backup_id but the public smoke failed; the site is serving a restored database in an unverified state"

    log "restore rehearsal complete: database restored from $backup_id, app restarted, public smoke passed"
}

main "$@"
