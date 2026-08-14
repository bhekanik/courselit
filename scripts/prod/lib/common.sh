# Shared helpers for the scripts/prod harness. Bash 3.2 compatible: no
# associative arrays, no mapfile, no ${var^^}.

log() { printf '[%s] %s\n' "$(date -u +%H:%M:%S)" "$*" >&2; }
ok() { printf '  PASS  %s\n' "$*" >&2; }
skip_note() { printf '  SKIP  %s\n' "$*" >&2; }
fail_note() { printf '  FAIL  %s\n' "$*" >&2; }

die() {
    printf 'error: %s\n' "$*" >&2
    exit 1
}

REVISION_LABEL='{{index .Config.Labels "org.opencontainers.image.revision"}}'

# Single door to the production host. Arguments are joined by ssh into one
# remote command string, so every value reaching this must already be validated
# (see assert_safe_token) -- there is no shell quoting to hide behind.
ssh_exec() {
    ssh -o BatchMode=yes -o ConnectTimeout="$AIWS_SSH_CONNECT_TIMEOUT" \
        "$AIWS_SSH_HOST" "$@"
}

# Rejects anything that could change the meaning of the remote command line.
assert_safe_token() {
    case "$2" in
    "") die "$1 must not be empty" ;;
    *[!A-Za-z0-9._:/@-]*) die "$1 contains unsafe characters: '$2'" ;;
    esac
}

# Prints the revision label of an image, or fails if the image is absent.
local_image_revision() {
    docker image inspect --format "$REVISION_LABEL" "$1" 2>/dev/null
}

# The extra single quotes survive ssh's join-and-reparse of the command line.
remote_image_revision() {
    ssh_exec docker image inspect --format "'$REVISION_LABEL'" "$1" 2>/dev/null
}

# Candidate tags are immutable: one tag, one commit, forever. A tag that already
# points at different content is a signal that something is wrong upstream, so
# refuse rather than silently reassign it.
assert_tag_matches_revision() {
    local where="$1" ref="$2" sha="$3" rev="$4"
    [ "$rev" = "$sha" ] ||
        die "$where image tag $ref is immutable and already holds revision '${rev:-<none>}', not $sha"
}

is_full_sha() {
    case "$1" in
    "") return 1 ;;
    *[!0-9a-f]*) return 1 ;;
    esac
    [ "${#1}" -eq 40 ]
}
