# Shared by every fake binary. Sourced, never executed.

# Records one call as a single line: "<scope> <command> <args...>". Tests grep
# this log, so the scope prefix is what distinguishes a local docker call from
# one the fake ssh ran "on the remote host".
fake_log() {
    local line="${FAKE_SCOPE:-local}" arg
    for arg in "$@"; do
        line="$line $arg"
    done
    printf '%s\n' "$line" | tr -d '\r' | tr '\n' ' ' >>"${FAKE_CALLS:?FAKE_CALLS must be set}"
    printf '\n' >>"$FAKE_CALLS"
}
