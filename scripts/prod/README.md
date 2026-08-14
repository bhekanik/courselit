# Production deploy harness

Deploys the CourseLit app service to the `notto-deploy` host by exact commit
SHA. No registry, no git tags, no Docker Hub: the image is built locally from a
committed tree, streamed over SSH with `docker save | docker load`, and
activated with an app-only compose override.

**Never push a git tag on this fork.** Upstream's
`.github/workflows/publish-docker-images.yaml` triggers on any tag push and
would try to publish to the `codelit/` Docker Hub namespace. This harness never
uses `docker push`, `docker pull`, or a registry for the candidate image, and
the test suite asserts that.

## Requirements

On this machine:

| Tool      | Why                                                        |
| --------- | ---------------------------------------------------------- |
| `docker`  | `buildx build --platform linux/amd64` and `docker save`      |
| `git`     | resolving the SHA and producing the build context           |
| `gzip`    | compressing the image stream before it crosses the network   |
| `ssh`     | the only channel to the host; needs the `notto-deploy` alias |
| `curl`    | the public smoke checks                                      |
| `jq`      | parsing `/api/config` (`brew install jq`)                    |
| `bats`, `shellcheck` | running the test suite (`brew install bats-core shellcheck`) |

Building `linux/amd64` on an Apple Silicon Mac needs buildx with QEMU, which
Docker Desktop provides out of the box. The first cross-build is slow.

On the host (already true today): `docker` 29.x, `docker compose` v5.x,
`flock`, `gzip`, x86_64, and a `mongo` container that ships `mongodump`.

## Commands

```sh
# Deploy an exact commit. Builds, ships, activates the app only, smokes.
scripts/prod/deploy.sh <full-40-char-commit-sha>

# Public smoke on its own, any time.
scripts/prod/smoke.sh
scripts/prod/smoke.sh --base-url https://courselit.24.199.66.181.sslip.io

# Manual rollback to an image the host already has.
scripts/prod/rollback.sh codelit/courselit-app:latest@sha256:<digest>
scripts/prod/rollback.sh aiws/courselit-app:<sha>

# Run one committed migration from the exact SHA's builder image.
scripts/prod/migrate.sh <full-40-char-commit-sha> <migration.js> --dry-run
scripts/prod/migrate.sh <full-40-char-commit-sha> <migration.js> --apply --yes

# Destructive DB-restore half of a rollback rehearsal.
scripts/prod/restore-db.sh \
  --i-understand-this-overwrites-the-production-database <backup-id>

# What the host has to roll back to.
ssh notto-deploy docker images

# Tests.
bats scripts/prod/tests
shellcheck -x -e SC1091 scripts/prod/*.sh scripts/prod/lib/*.sh scripts/prod/remote/*.sh
```

Abbreviated and uppercase SHAs are rejected — the tag has to be one canonical
form. The image is built from `git archive <sha>`, so a dirty working tree
simply cannot reach production; the harness does not need to check for one.

## What a deploy does, in order

1. **Preflight, local** — required tools, free disk.
2. **Preflight, host** — required tools, architecture, free disk, `.env`
   present and mode 600, `compose.yml` validates, `app`/`mongo`/`medialit`
   containers exist, the app shares a network with the Caddy container, and the
   mongo container can run `mongodump`.
3. **Build** — `docker buildx build --platform linux/amd64` from
   `services/app/Dockerfile` inside the archive of the commit. Tagged
   `aiws/courselit-app:<sha>` and labelled
   `org.opencontainers.image.revision=<sha>`.
   The active builder must advertise `linux/amd64`; the loaded image is then
   inspected for both platform and exact revision before transfer.
4. **Immutable tag guard** — if that tag already exists locally or on the host
   with a *different* revision label, the deploy refuses. Same revision means
   the step is skipped, so a re-run is cheap.
5. **Transfer** — `docker save | gzip -1 | ssh notto-deploy docker load`.
   `docker save` writes uncompressed layer tars and the link to the VPS is the
   slow part, so the stream is compressed; `docker load` sniffs the stream and
   decompresses on the far side.
6. **Activate** (under the host lock) — back up, layer the override, `docker
   compose up -d --no-deps app`, verify.
7. **Smoke** — the public checks below.
8. **Automatic rollback** — if step 6 or 7 fails, restore the previous app
   image and verify it.

Fresh runtime and migration builds append one tab-separated measurement to
`AIWS_METRICS_FILE`: build seconds, loaded image bytes, image reference,
platform and SHA. Reused images add no row because no build occurred.

## Configuration

Every value is an environment variable with a default in `lib/config.sh`.

| Variable                        | Default                                     |
| ------------------------------- | ------------------------------------------- |
| `AIWS_SSH_HOST`                 | `notto-deploy`                              |
| `AIWS_REMOTE_DIR`               | `/home/deploy/services/courselit`           |
| `AIWS_COMPOSE_FILE`             | `compose.yml`                               |
| `AIWS_ENV_FILE`                 | `.env`                                      |
| `AIWS_OVERRIDE_FILE`            | `compose.aiws.yml`                          |
| `AIWS_IMAGE_ENV_FILE`           | `aiws-active-image.env`                     |
| `AIWS_BACKUP_SUBDIR`            | `aiws-backups`                              |
| `AIWS_LOCK_FILE`                | `.aiws-deploy.lock`                         |
| `AIWS_COMPOSE_PROJECT`          | `courselit`                                 |
| `AIWS_CADDY_CONTAINER`          | `notto-demo-caddy-1`                        |
| `AIWS_IMAGE_REPO`               | `aiws/courselit-app`                        |
| `AIWS_PLATFORM`                 | `linux/amd64`                               |
| `AIWS_DOCKERFILE`               | `services/app/Dockerfile`                   |
| `AIWS_REMOTE_ARCH`              | `x86_64`                                    |
| `AIWS_MIGRATE_IMAGE_REPO`       | `courselit-migrate`                         |
| `AIWS_MIGRATE_TARGET`           | `builder`                                   |
| `AIWS_MIGRATIONS_DIR`           | `apps/web/.migrations`                      |
| `AIWS_MIGRATION_RUNNER`         | `node`                                      |
| `AIWS_LOCAL_TOOLS`              | `docker git ssh gzip`                       |
| `AIWS_TRANSFER_COMPRESSOR`      | `gzip -1` — set to `cat` to disable         |
| `AIWS_SMOKE_TOOLS`              | `curl jq`                                   |
| `AIWS_REMOTE_TOOLS`             | `docker flock gzip`                         |
| `AIWS_REQUIRED_SERVICES`        | `app mongo medialit`                        |
| **`AIWS_MIN_FREE_DISK_GB`**     | **`20`** — enforced on both ends            |
| `AIWS_MIN_DUMP_BYTES`           | `1024` — floor for a believable mongodump   |
| `AIWS_LOCAL_DISK_PATH`          | `$TMPDIR`                                   |
| `AIWS_SSH_CONNECT_TIMEOUT`      | `15`                                        |
| `AIWS_LOCK_TIMEOUT`             | `900`                                       |
| `AIWS_HEALTH_TIMEOUT`           | `300`                                       |
| `AIWS_HEALTH_INTERVAL`          | `5`                                         |
| `AIWS_PUBLIC_URL`               | `https://courselit.24.199.66.181.sslip.io`  |
| `AIWS_SMOKE_MARKER`             | `_next/static`                              |
| `AIWS_SMOKE_MEDIA_URL`          | unset — optional, reported as SKIP          |
| `AIWS_SMOKE_OTP_URL`            | unset — optional, reported as SKIP          |
| `AIWS_SMOKE_OTP_BODY`           | unset — required alongside the OTP URL      |
| `AIWS_SMOKE_OTP_EXPECT_STATUS`  | `200`                                       |
| `AIWS_SMOKE_TIMEOUT`            | `30`                                        |
| `AIWS_METRICS_FILE`             | `$TMPDIR/aiws-deploy-metrics.tsv`           |
| `AIWS_DEPLOY_TS`                | `date -u +%Y%m%dT%H%M%SZ`                   |

Raise `AIWS_MIN_FREE_DISK_GB` for a bigger image; lower it only if you have
measured how much the transfer and the mongodump actually need.

## What the harness writes on the host

The live `compose.yml` and `.env` are **never modified**. Two new files are
layered over them, both non-secret:

- `compose.aiws.yml` — four lines, app service only, sets
  `image: ${AIWS_APP_IMAGE:?...}`. It mentions no other service, no volume and
  no network, so `up -d --no-deps app` cannot reshape the stack.
- `aiws-active-image.env` — one assignment, `AIWS_APP_IMAGE=<reference>`.

Compose is always invoked as:

```sh
docker compose --env-file .env --env-file aiws-active-image.env \
  -f compose.yml -f compose.aiws.yml up -d --no-deps app
```

Validity is checked with `config --quiet`. A bare `docker compose config`
prints every resolved secret from `.env` and is never used; a test enforces it.

## Backups

Written before anything is activated, host-side only, never copied to this
machine:

```
/home/deploy/services/courselit/aiws-backups/<UTC timestamp>/
  compose.yml          the live compose file as it was          (600)
  env                  the live .env as it was                  (600)
  override.yml         previous compose.aiws.yml, if any        (600)
  active-image.env     previous active image env, if any        (600)
  mongo.archive.gz     full mongodump --archive --gzip          (600)
  deployment.meta      ts, candidate image + revision, previous
                       image, mongo/medialit container ids,
                       dump size — no secrets                   (600)
```

The directory itself is mode 700. `mongodump` runs inside the mongo container
using its own `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD`.
Those values are not sent over SSH or printed by the harness. A dump smaller
than `AIWS_MIN_DUMP_BYTES` aborts the deploy before activation. The app is
stopped before the dump and stays stopped into candidate activation, so the
archive is an exact pre-deploy restore point. If the dump or candidate config
validation fails, the harness restores the prior config, restarts the previous
app image, and verifies it before returning the failure.

A manual rollback writes `aiws-backups/rollback-<timestamp>/` with the same
config files and a `rollback.meta`. It does **not** take a database dump —
rollback has to be fast, and it does not touch the database.

`migrate.sh --apply` writes `aiws-backups/migrate-<timestamp>/mongo.archive.gz`
before it mutates Mongo, `post-migration.archive.gz` after, and `migration.meta`.
A dry run writes only `migration.meta`. A database restore writes
`aiws-backups/restore-<timestamp>/`, including `pre-restore.archive.gz` (a safety
dump of the database it is about to replace, itself restorable as backup ID
`restore-<timestamp>`), a post-restore verification dump, and `restore.meta`.

## Rollback

**Automatic.** If activation or the public smoke fails, the app is put back on
the image recorded as `PREVIOUS_IMAGE` in this deploy's `deployment.meta`, and
the same invariants are re-verified:

- if the app is already on the previous image, it still reapplies, restarts and
  verifies that predecessor because activation may have left it stopped;
- if the app is running something that is neither this deploy's candidate nor its
  predecessor — a newer deployment landed while the smoke was running, and
  reverting would silently regress it. The harness stops and says so.

**Manual.**

```sh
scripts/prod/rollback.sh <image-reference>
```

The reference must already be on the host — rollback never pulls. It records
the pre-rollback state, changes only the app service, and verifies the same
invariants and public smoke as a deploy. The current upstream reference is:

```sh
ssh notto-deploy "docker inspect --format '{{.Config.Image}}' courselit-app-1"
```

## Migration channel

`migrate.sh` accepts one bare `.js` filename under `apps/web/.migrations` and
one explicit mode:

```sh
scripts/prod/migrate.sh <full-40-char-commit-sha> <migration.js> --dry-run
scripts/prod/migrate.sh <full-40-char-commit-sha> <migration.js> --apply --yes
```

There is no default mode, and `--apply` without `--yes` is refused. The mode is
passed to the migration script itself as its first argument (`--dry-run` or
`--apply`). Each migration must honour `--dry-run` as a non-mutating operation;
the P4 migration is responsible for that application-level contract.

Both modes prove the file exists in the named commit, build Dockerfile target
`builder` from `git archive <sha>`, tag it exactly `courselit-migrate:<sha>`,
verify the loaded platform/revision, and stream it to the host without a
registry. The host checks the revision again, then runs
`node apps/web/.migrations/<file> <mode>` in a one-off container on the network
shared by the live app and Mongo. The live `.env` is passed with Docker's
`--env-file`; its values are never rendered. Compose files, the runtime image
and the startup command are untouched.

In `--dry-run` mode the harness never stops the app and never takes a dump. The
migration receives `--dry-run` and must not mutate production data.

`--apply` stops the app **before** the pre-migration mongodump, so the backup is
a consistent restore point and the migration does not race live writes. The app
stays stopped through the migration run and a post-migration read-back of Mongo.
Only when both succeed does the harness restart the app on its existing image,
re-check the app/MediaLit/network invariants, and run the public smoke. A
failure at any earlier point leaves the app stopped on purpose, so nothing
writes into half-migrated data.

The migration process's own exit code is preserved end to end, so a migration
that distinguishes its failure modes by exit code keeps that signal.

The confirmation flag is deliberate: an apply mutates production. A failed
migration is never auto-restored because `mongorestore --drop` can erase writes
made after the dump. Stop, inspect `migration.meta` (which records
`MIGRATION_MODE`), and decide explicitly.

## Database restore and rollback rehearsal

`restore-db.sh` is destructive. It requires the full confirmation flag and an
exact harness backup ID in one of three forms:

| Backup ID                  | Archive read                | Written by         |
| -------------------------- | --------------------------- | ------------------ |
| `YYYYMMDDTHHMMSSZ`         | `mongo.archive.gz`          | a deploy           |
| `migrate-YYYYMMDDTHHMMSSZ` | `mongo.archive.gz`          | `migrate.sh --apply` |
| `restore-YYYYMMDDTHHMMSSZ` | `pre-restore.archive.gz`    | an earlier restore |

The `restore-` form is how you undo a restore: every restore keeps a safety dump
of the state it replaced, and that dump is selectable as a restore source. The
ID is still pattern-matched to an exact timestamp and rejected if it looks like a
path, so nothing outside the backup directory is reachable.

It checks the archive size and gzip integrity and proves `mongorestore` exists
first, while the app is still up. It then stops the app, takes the safety dump,
runs `mongorestore --drop`, dumps the restored database to prove Mongo can read
it, restarts the same app image, checks app/MediaLit/network invariants, and runs
the public smoke. The app is stopped before the safety dump, not after, so that
dump is a consistent snapshot rather than one taken under a live writer.

Every failure after the restore record is created writes `OUTCOME=failed` into
`restore.meta`, including a failed safety dump, a failed `mongorestore`, a failed
restart and a failed post-restart verification. If anything from the stop
onwards fails, the app stays stopped so it cannot write into partial data.

A P0 rollback rehearsal is both commands, in this order, using the backup made
immediately before the candidate activation:

```sh
scripts/prod/rollback.sh <previous-image-reference>
scripts/prod/restore-db.sh \
  --i-understand-this-overwrites-the-production-database <deploy-backup-id>
```

An image-only rollback does not prove database recovery. Do not call the drill
green until both commands and the final smoke pass. Outside a planned drill,
needing `mongorestore` is a phase stop: halt and review before continuing.

## Post-deploy smoke

Required — a failure fails the deploy and triggers a rollback:

| Check          | Passes when                                                    |
| -------------- | -------------------------------------------------------------- |
| root `/`       | 200, `text/html`, body contains `AIWS_SMOKE_MARKER`             |
| `/api/config`  | 200, `application/json`, body parses as JSON                    |
| `/login`       | 200, `text/html`                                                |

Optional — reported as `SKIP`, never as `PASS`, when unconfigured:

| Check       | Configure with                                     |
| ----------- | -------------------------------------------------- |
| media asset | `AIWS_SMOKE_MEDIA_URL=https://media.bhekani.com/...` |
| email OTP   | `AIWS_SMOKE_OTP_URL` **and** `AIWS_SMOKE_OTP_BODY`   |

The summary line always reads `N passed, N failed, N skipped`, so a skipped
check can never be mistaken for a verified one.

## Known gaps

These are real, and deliberately not papered over:

- **No public media asset is checked by default.** The R2 smoke objects were
  deleted after the last media test, so there is nothing stable to point at.
  Set `AIWS_SMOKE_MEDIA_URL` once P4 uploads a real asset. Until then the
  media path is only verified *inside* the stack, by the authenticated MediaLit
  signature call the deploy makes from the app container.
- **Email delivery is not verified end to end.** The optional OTP probe only
  proves the endpoint accepted a request. Inbox receipt is a manual check, and
  repeated real login probes hit `RateLimitEvent`, so run it at most once per
  phase.
- **`AIWS_SMOKE_MARKER` defaults to `_next/static`.** That proves the Next.js
  app rendered rather than Caddy serving an error page. It does not prove the
  page has the right content. Tighten it to real landing copy once P4 ships.
- **The local free-disk check does not see Docker Desktop's VM disk.**
  `AIWS_LOCAL_DISK_PATH` covers the host filesystem only. If a build fails with
  "no space left on device", check Docker Desktop's disk image size.
- **The host lock covers activation and rollback, not the transfer.** Two
  concurrent `docker load`s of the same tag are harmless (identical content),
  and the immutable-tag guard catches a conflicting one. Activation itself is
  fully serialised.
- **There is no `/api/health` endpoint.** The app's compose healthcheck plus the
  three public checks are the whole story.
- **Builder-stage migration images are much larger than runtime images.** Use
  the recorded `kind=migration` seconds/bytes before deciding whether this
  registry-free path is acceptable for later phases.

## Layout

```
scripts/prod/
  deploy.sh            build + ship + activate + smoke + auto-rollback
  migrate.sh           exact-SHA builder image + one committed migration,
                       --dry-run or --apply --yes
  restore-db.sh        confirmed destructive restore + verification + smoke
  smoke.sh             public checks, runnable on its own
  rollback.sh          manual rollback to an image already on the host
  lib/
    build.sh           exact-SHA build, platform/revision checks, metrics
    common.sh          logging, validation, the single ssh door
    config.sh          every knob and its default
    preflight.sh       local checks + the remote preflight entrypoint
    remote.sh          builds and pipes payloads to the host, takes the lock
  remote/              executed on the host, piped over stdin, never inline
    lib.sh             compose wrappers, service lookup, verify_app
    preflight.sh       read-only host checks
    activate.sh        backup, layer, up -d --no-deps app, verify
    auto-rollback.sh   restore this deploy's predecessor
    migrate.sh         stop writers + backup + one-off migration + restart
    restore-db.sh      stop writers + restore + verify + restart
    rollback.sh        manual rollback
  tests/               Bats; fakes only for docker, ssh, curl, git, df, flock
```

Nothing is ever passed to `ssh` as an inline command string built from
untrusted input: payloads arrive on stdin, and every value interpolated into
the generated config block is validated against `[A-Za-z0-9._:/@-]` first. No
`eval` anywhere.
