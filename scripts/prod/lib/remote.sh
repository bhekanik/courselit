# Runs scripts on the production host by piping them over ssh.
#
# Nothing interesting is ever passed as an inline ssh command string: ssh joins
# argv and the remote login shell re-parses it, so the only safe payload is one
# that arrives on stdin. Configuration travels as a generated block of literal
# assignments prepended to that payload; every value is checked by
# assert_safe_token first, so no value can escape its quotes. No eval anywhere.

REMOTE_CONFIG_NAMES="AIWS_REMOTE_DIR AIWS_COMPOSE_FILE AIWS_ENV_FILE \
AIWS_OVERRIDE_FILE AIWS_IMAGE_ENV_FILE AIWS_BACKUP_SUBDIR AIWS_COMPOSE_PROJECT \
AIWS_CADDY_CONTAINER AIWS_REMOTE_ARCH AIWS_MIN_FREE_DISK_GB AIWS_MIN_DUMP_BYTES \
AIWS_HEALTH_TIMEOUT AIWS_HEALTH_INTERVAL AIWS_DEPLOY_TS AIWS_MIGRATIONS_DIR \
AIWS_MIGRATION_RUNNER"

# Space-separated lists; each element is validated on its own.
REMOTE_CONFIG_LISTS="AIWS_REMOTE_TOOLS AIWS_REQUIRED_SERVICES"

emit_remote_config() {
    local name value
    printf 'set -euo pipefail\n'
    for name in $REMOTE_CONFIG_NAMES; do
        value="${!name:-}"
        assert_safe_token "$name" "$value"
        printf "%s='%s'\n" "${name#AIWS_}" "$value"
    done
    for name in $REMOTE_CONFIG_LISTS; do
        printf "%s='%s'\n" "${name#AIWS_}" "$(safe_list "$name" "${!name:-}")"
    done
}

# Validates each element and re-joins with single spaces, so nothing but
# [A-Za-z0-9._:/@-] and separators can reach the remote assignment.
safe_list() {
    local out="" token
    for token in $2; do
        assert_safe_token "$1 entry" "$token"
        out="$out${out:+ }$token"
    done
    printf '%s' "$out"
}

remote_payload() {
    emit_remote_config
    cat "$PROD_DIR/remote/lib.sh" "$PROD_DIR/remote/$1"
}

assert_remote_args() {
    local a
    for a in "$@"; do
        assert_safe_token "remote argument" "$a"
    done
}

remote_run() {
    local script="$1"
    shift
    assert_remote_args "$@"
    remote_payload "$script" | ssh_exec bash -s -- "$@"
}

# Anything that mutates the live stack runs under one host-wide lock, so two
# deploys (or a deploy and a rollback) cannot interleave.
remote_run_locked() {
    local script="$1"
    shift
    assert_remote_args "$@"
    remote_payload "$script" |
        ssh_exec flock -w "$AIWS_LOCK_TIMEOUT" \
            "$AIWS_REMOTE_DIR/$AIWS_LOCK_FILE" bash -s -- "$@"
}
