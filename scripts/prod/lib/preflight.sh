# Everything that must be true before a byte of the candidate is built or moved.

free_disk_gb() {
    df -P -k "$1" | awk 'NR == 2 { print int($4 / 1048576) }'
}

assert_free_disk() {
    local where="$1" have
    have="$(free_disk_gb "$2")"
    [ -n "$have" ] || die "could not read $where free disk for $2"
    [ "$have" -ge "$AIWS_MIN_FREE_DISK_GB" ] ||
        die "$where free disk is $have GiB, below the required $AIWS_MIN_FREE_DISK_GB GiB (raise AIWS_MIN_FREE_DISK_GB only if you know the image fits)"
}

# The workstation's own architecture is irrelevant -- an Apple Silicon Mac
# builds linux/amd64 fine as long as the active builder offers it. So ask the
# builder, not uname, and fail here rather than after a long build.
assert_buildx_can_build_platform() {
    local platforms p
    docker buildx version >/dev/null 2>&1 ||
        die "docker buildx is not available; the exact-SHA build needs it"
    platforms="$(docker buildx inspect --bootstrap 2>/dev/null |
        sed -n 's/^ *Platforms: *//p' | tr ',' '\n' | tr -d ' *')"
    [ -n "$platforms" ] ||
        die "could not read the platforms of the active buildx builder"
    for p in $platforms; do
        [ "$p" = "$AIWS_PLATFORM" ] && return 0
    done
    die "the active buildx builder cannot build $AIWS_PLATFORM (it offers: $(printf '%s' "$platforms" | tr '\n' ' ')); enable emulation or create a builder that can, e.g. docker buildx create --use"
}

preflight_local() {
    local tool
    log "preflight: local"
    for tool in $AIWS_LOCAL_TOOLS; do
        command -v "$tool" >/dev/null 2>&1 ||
            die "this machine is missing a required tool: $tool"
    done
    ok "local tools present ($AIWS_LOCAL_TOOLS)"
    assert_buildx_can_build_platform
    ok "buildx builder can build $AIWS_PLATFORM"
    assert_free_disk local "$AIWS_LOCAL_DISK_PATH"
    ok "local free disk >= $AIWS_MIN_FREE_DISK_GB GiB"
}

preflight_remote() {
    log "preflight: $AIWS_SSH_HOST"
    ssh_exec true 2>/dev/null ||
        die "cannot reach $AIWS_SSH_HOST over ssh (BatchMode; check ~/.ssh/config and the agent)"
    remote_run preflight.sh
}
