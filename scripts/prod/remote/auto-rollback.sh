# Restores the app image this deploy replaced, and only that. Runs under the
# host deploy lock. Arg: <candidate-image>

candidate="$1"
meta="$(meta_file)"

if [ ! -f "$meta" ]; then
    r_log "no deployment record at $meta; the candidate was never activated"
    exit 0
fi

previous="$(meta_value PREVIOUS_IMAGE "$meta")"
mongo_before="$(meta_value MONGO_CONTAINER "$meta")"
medialit_before="$(meta_value MEDIALIT_CONTAINER "$meta")"
[ -n "$previous" ] || r_die "deployment record $meta has no PREVIOUS_IMAGE"

running="$(docker inspect --format '{{.Config.Image}}' "$(require_service_id app)")"
if [ "$running" = "$previous" ]; then
    # Activation can fail after the candidate override was written but before
    # compose replaced the container. Restore the declarative state too, or a
    # later `compose up` would resurrect the rejected candidate.
    write_override
    write_image_env "$previous"
    compose_full config --quiet ||
        r_die "app is on $previous but the restored compose override does not validate"
    compose_full up -d --no-deps app
    verify_app "$previous" "" "$mongo_before" "$medialit_before"
    r_ok "app and compose override restored and verified on $previous"
    exit 0
fi

# Someone else deployed while this one was being smoke-tested. Their image is
# newer than our predecessor, so reverting to it would be a silent regression.
[ "$running" = "$candidate" ] ||
    r_die "app is running $running, which is neither this deploy's candidate nor its predecessor; refusing to clobber a newer deployment"

r_log "restoring $previous"
write_override
write_image_env "$previous"
compose_full up -d --no-deps app
verify_app "$previous" "" "$mongo_before" "$medialit_before"
r_ok "app rolled back to $previous"
