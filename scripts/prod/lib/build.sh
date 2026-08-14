# Building and moving exact-SHA images. Shared by deploy.sh (runtime image) and
# migrate.sh (Dockerfile `builder` stage), so the two channels cannot drift on
# provenance checks, immutability or measurement.

# One tab-separated key=value record per build. Appended, never rewritten:
# comparing two runs is `grep kind=runtime "$AIWS_METRICS_FILE"`.
record_build_metric() {
    local kind="$1" ref="$2" sha="$3" seconds="$4" bytes line
    bytes="$(docker image inspect --format '{{.Size}}' "$ref" 2>/dev/null || printf 0)"
    line="$(printf 'deploy_ts=%s\tkind=%s\timage=%s\tsha=%s\tplatform=%s\tbuild_seconds=%s\timage_bytes=%s' \
        "$AIWS_DEPLOY_TS" "$kind" "$ref" "$sha" "$AIWS_PLATFORM" "$seconds" "$bytes")"
    printf '%s\n' "$line" >>"$AIWS_METRICS_FILE" ||
        die "could not append to the metrics file $AIWS_METRICS_FILE"
    log "metric $line"
}

# What actually got loaded, not what was asked for: a builder that silently
# ignores --platform would otherwise ship an arm64 image to an x86_64 host.
assert_image_platform() {
    local ref="$1" got
    got="$(docker image inspect --format '{{.Os}}/{{.Architecture}}' "$ref" 2>/dev/null)" ||
        die "could not inspect $ref after the build"
    [ "$got" = "$AIWS_PLATFORM" ] ||
        die "$ref was loaded as $got, not $AIWS_PLATFORM; refusing to ship it to $AIWS_SSH_HOST"
}

# Args: <kind> <sha> <image-ref> [dockerfile-target]
build_from_commit() {
    local kind="$1" sha="$2" ref="$3" target="${4:-}" rev started elapsed
    if rev="$(local_image_revision "$ref")"; then
        assert_tag_matches_revision local "$ref" "$sha" "$rev"
        assert_image_platform "$ref"
        log "reusing already-built local image $ref"
        return 0
    fi

    set -- --platform "$AIWS_PLATFORM" --file "$AIWS_DOCKERFILE" --tag "$ref" \
        --label "org.opencontainers.image.revision=$sha"
    [ -n "$target" ] && set -- "$@" --target "$target"

    log "building $ref for $AIWS_PLATFORM from the committed tree at $sha"
    started="$(date -u +%s)"
    git -C "$REPO_ROOT" archive --format=tar "$sha" |
        docker buildx build "$@" --load - ||
        die "building $ref from $sha failed"
    elapsed="$(($(date -u +%s) - started))"

    assert_image_platform "$ref"
    assert_tag_matches_revision local "$ref" "$sha" "$(local_image_revision "$ref" || true)"
    record_build_metric "$kind" "$ref" "$sha" "$elapsed"
}

# No registry is involved anywhere in this harness: the candidate only ever
# exists in the local daemon and in the remote daemon's store.
transfer_image() {
    local sha="$1" ref="$2" rev
    if rev="$(remote_image_revision "$ref")"; then
        assert_tag_matches_revision remote "$ref" "$sha" "$rev"
        log "$AIWS_SSH_HOST already holds $ref; skipping transfer"
        return 0
    fi
    # `docker save` writes uncompressed layer tars and the link to the VPS is
    # the slow part; `docker load` sniffs and decompresses on the far side.
    log "streaming $ref to $AIWS_SSH_HOST over ssh"
    docker save "$ref" | $AIWS_TRANSFER_COMPRESSOR | ssh_exec docker load
}
