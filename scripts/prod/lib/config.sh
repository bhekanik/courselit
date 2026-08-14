# Every knob the harness has. Each is overridable from the environment; the
# defaults describe the current notto-deploy production host.

: "${AIWS_SSH_HOST:=notto-deploy}"
: "${AIWS_REMOTE_DIR:=/home/deploy/services/courselit}"
: "${AIWS_COMPOSE_FILE:=compose.yml}"
: "${AIWS_ENV_FILE:=.env}"
: "${AIWS_OVERRIDE_FILE:=compose.aiws.yml}"
: "${AIWS_IMAGE_ENV_FILE:=aiws-active-image.env}"
: "${AIWS_BACKUP_SUBDIR:=aiws-backups}"
: "${AIWS_LOCK_FILE:=.aiws-deploy.lock}"
: "${AIWS_COMPOSE_PROJECT:=courselit}"
: "${AIWS_CADDY_CONTAINER:=notto-demo-caddy-1}"

: "${AIWS_IMAGE_REPO:=aiws/courselit-app}"
: "${AIWS_PLATFORM:=linux/amd64}"
: "${AIWS_DOCKERFILE:=services/app/Dockerfile}"
: "${AIWS_REMOTE_ARCH:=x86_64}"
# The migration channel: same Dockerfile, `builder` stage, its own immutable tag.
: "${AIWS_MIGRATE_IMAGE_REPO:=courselit-migrate}"
: "${AIWS_MIGRATE_TARGET:=builder}"
: "${AIWS_MIGRATIONS_DIR:=apps/web/.migrations}"
: "${AIWS_MIGRATION_RUNNER:=node}"
: "${AIWS_LOCAL_TOOLS:=docker git ssh gzip}"
# Trades CPU on this machine for time on the wire. `cat` disables it.
: "${AIWS_TRANSFER_COMPRESSOR:=gzip -1}"
: "${AIWS_SMOKE_TOOLS:=curl jq}"
: "${AIWS_REMOTE_TOOLS:=docker flock gzip}"
: "${AIWS_REQUIRED_SERVICES:=app mongo medialit}"

# Minimum free space, checked on both ends before a build or a transfer. A
# CourseLit image tars to a few GB; 20 GiB leaves room for the old image, the
# incoming layer set and a mongodump.
: "${AIWS_MIN_FREE_DISK_GB:=20}"
: "${AIWS_MIN_DUMP_BYTES:=1024}"
# Docker Desktop keeps its own VM disk; this path only covers the host
# filesystem. See the "Known gaps" section of README.md.
: "${AIWS_LOCAL_DISK_PATH:=${TMPDIR:-/tmp}}"

: "${AIWS_SSH_CONNECT_TIMEOUT:=15}"
: "${AIWS_LOCK_TIMEOUT:=900}"
: "${AIWS_HEALTH_TIMEOUT:=300}"
: "${AIWS_HEALTH_INTERVAL:=5}"

: "${AIWS_PUBLIC_URL:=https://courselit.24.199.66.181.sslip.io}"
# Proves the Next.js app rendered rather than Caddy serving an error page.
# Tighten this to real landing copy once P4 ships.
: "${AIWS_SMOKE_MARKER:=_next/static}"
: "${AIWS_SMOKE_MEDIA_URL:=}"
: "${AIWS_SMOKE_OTP_URL:=}"
: "${AIWS_SMOKE_OTP_BODY:=}"
: "${AIWS_SMOKE_OTP_EXPECT_STATUS:=200}"
: "${AIWS_SMOKE_TIMEOUT:=30}"

# One tab-separated key=value record per build, appended. Comparable across
# runs with sort/awk; no framework, no schema to keep in sync.
: "${AIWS_METRICS_FILE:=${TMPDIR:-/tmp}/aiws-deploy-metrics.tsv}"

: "${AIWS_DEPLOY_TS:=$(date -u +%Y%m%dT%H%M%SZ)}"
