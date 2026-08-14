import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
    cpSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { join } from "node:path";
import mongoose from "mongoose";

const REPO_ROOT = join(__dirname, "..", "..", "..", "..", "..");
const CANONICAL_COURSE_PATH = join(
    REPO_ROOT,
    "content",
    "courses",
    "ai-for-actual-work",
    "course.json",
);
const FROZEN_COURSE_PATH = join(
    REPO_ROOT,
    "apps",
    "web",
    ".migrations",
    "14-08-26_20-00-expand-ai-work-school.course.json",
);
const CANONICAL_SITE_PATH = join(
    REPO_ROOT,
    "content",
    "site",
    "ai-work-school",
    "site.json",
);
const FROZEN_SITE_PATH = join(
    REPO_ROOT,
    "apps",
    "web",
    ".migrations",
    "14-08-26_20-00-expand-ai-work-school.site.json",
);
const MIGRATION_PATH = join(
    REPO_ROOT,
    "apps",
    "web",
    ".migrations",
    "14-08-26_20-00-expand-ai-work-school.js",
);
const LOCK_PATH = join(
    REPO_ROOT,
    "apps",
    "web",
    ".migrations",
    "14-08-26_20-00-expand-ai-work-school.media-site.json",
);
const MIGRATION_BASENAME = "14-08-26_20-00-expand-ai-work-school";
const LAUNCH_MIGRATION_PATH = join(
    REPO_ROOT,
    "apps",
    "web",
    ".migrations",
    "14-08-26_17-30-seed-ai-work-school.js",
);
const DEFAULT_HOMEPAGE_MARKER =
    "This is the default page created for you by CourseLit.";
type TestDatabase = NonNullable<(typeof mongoose.connection)["db"]>;

function databaseEnvironment(): NodeJS.ProcessEnv {
    const connection = mongoose.connection;
    return {
        NODE_ENV: "test",
        PATH: process.env.PATH,
        DB_CONNECTION_STRING: `mongodb://${connection.host}:${connection.port}/${connection.name}`,
        TARGET_DOMAIN: "main",
    };
}

function runMigration(args: string[], env: NodeJS.ProcessEnv = {}) {
    return spawnSync(process.execPath, [MIGRATION_PATH, ...args], {
        cwd: REPO_ROOT,
        env: {
            NODE_ENV: process.env.NODE_ENV ?? "test",
            PATH: process.env.PATH,
            ...env,
        },
        encoding: "utf8",
        timeout: 20_000,
    });
}

async function snapshotManagedCollections() {
    const db = mongoose.connection.db;
    if (!db) throw new Error("Test database is unavailable");
    const names = [
        "courses",
        "lessons",
        "pages",
        "domains",
        "users",
        "memberships",
        "invoices",
        "certificates",
        "activities",
        "lessonevaluations",
        "paymentplans",
    ];
    return Object.fromEntries(
        await Promise.all(
            names.map(async (name) => [
                name,
                await db.collection(name).find({}).sort({ _id: 1 }).toArray(),
            ]),
        ),
    );
}

async function seedLaunchedBaseline() {
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error("Test database is unavailable");
    }
    const domainId = new mongoose.Types.ObjectId();
    await db.collection("domains").insertOne({
        _id: domainId,
        name: "main",
        email: "owner@example.com",
        deleted: false,
        settings: { title: "My school", subtitle: "Learn something new" },
        themeId: "learning",
        lastEditedThemeId: "learning",
        sharedWidgets: {
            header: {
                widgetId: "existing-default-header",
                name: "header",
                deleteable: false,
                shared: true,
                settings: {
                    links: [
                        {
                            label: "Products",
                            href: "/products",
                            isButton: false,
                            isPrimary: false,
                        },
                        {
                            label: "Blog",
                            href: "/blog",
                            isButton: false,
                            isPrimary: false,
                        },
                        {
                            label: "Start learning",
                            href: "/products",
                            isButton: true,
                            isPrimary: true,
                        },
                    ],
                    linkAlignment: "center",
                    showLoginControl: true,
                    linkFontWeight: "font-normal",
                    spacingBetweenLinks: 16,
                },
            },
            footer: {
                widgetId: "existing-default-footer",
                name: "footer",
                deleteable: false,
                shared: true,
                settings: {
                    sections: [
                        {
                            name: "Legal",
                            links: [
                                { label: "Terms of Use", href: "/p/terms" },
                                {
                                    label: "Privacy Policy",
                                    href: "/p/privacy",
                                },
                            ],
                        },
                    ],
                    titleFontSize: 2,
                    socials: {
                        facebook: "",
                        twitter: "https://twitter.com/courselit",
                        instagram: "",
                        youtube: "",
                        linkedin: "",
                        discord: "",
                        github: "https://github.com/codelitdev/courselit",
                    },
                    socialIconsSize: 24,
                },
            },
        },
        draftSharedWidgets: {},
    });
    await db.collection("users").insertOne({
        domain: domainId,
        userId: "owner_ai_work_school_v1",
        email: "owner@example.com",
        active: true,
        name: "BK",
        permissions: [
            "course:manage_any",
            "course:publish",
            "site:manage",
            "setting:manage",
        ],
    });
    await db.collection("pages").insertMany([
        {
            domain: domainId,
            pageId: "homepage",
            name: "Home",
            type: "site",
            creatorId: "owner_ai_work_school_v1",
            entityId: "main",
            deleted: false,
            layout: [
                {
                    widgetId: "existing-default-copy",
                    name: "rich-text",
                    settings: {
                        text: {
                            type: "doc",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: DEFAULT_HOMEPAGE_MARKER,
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                },
            ],
            draftLayout: [],
        },
        {
            domain: domainId,
            pageId: "privacy",
            name: "Privacy policy",
            type: "site",
            creatorId: "owner_ai_work_school_v1",
            entityId: "main",
            deleted: false,
        },
        {
            domain: domainId,
            pageId: "terms",
            name: "Terms of use",
            type: "site",
            creatorId: "owner_ai_work_school_v1",
            entityId: "main",
            deleted: false,
        },
    ]);

    const launch = spawnSync(
        process.execPath,
        [LAUNCH_MIGRATION_PATH, "--apply"],
        {
            cwd: REPO_ROOT,
            env: databaseEnvironment(),
            encoding: "utf8",
            timeout: 20_000,
        },
    );
    expect(launch.status).toBe(0);
    return { db, domainId };
}

function runMigrationBundle({
    includeLock = true,
    mutateLock,
    mutateSite,
}: {
    includeLock?: boolean;
    mutateLock?: (lock: Record<string, unknown>) => void;
    mutateSite?: (site: Record<string, unknown>) => void;
} = {}) {
    const directory = mkdtempSync(
        join(
            REPO_ROOT,
            "apps",
            "web",
            ".migrations",
            ".test-expand-ai-work-school-",
        ),
    );
    const copy = (name: string) =>
        cpSync(
            join(REPO_ROOT, "apps", "web", ".migrations", name),
            join(directory, name),
        );
    copy(`${MIGRATION_BASENAME}.js`);
    copy(`${MIGRATION_BASENAME}.course.json`);
    copy("14-08-26_17-30-seed-ai-work-school.course.json");
    copy("14-08-26_17-30-seed-ai-work-school.site.json");
    let mutatedSiteBytes: string | undefined;
    if (mutateSite) {
        const site = JSON.parse(readFileSync(FROZEN_SITE_PATH, "utf8"));
        mutateSite(site);
        mutatedSiteBytes = `${JSON.stringify(site, null, 4)}\n`;
        writeFileSync(
            join(directory, `${MIGRATION_BASENAME}.site.json`),
            mutatedSiteBytes,
        );
    } else {
        copy(`${MIGRATION_BASENAME}.site.json`);
    }
    if (includeLock) {
        const lock = JSON.parse(readFileSync(LOCK_PATH, "utf8"));
        if (mutatedSiteBytes) {
            const hashes = lock.sourceHashes as Record<string, string>;
            hashes.desiredSite = createHash("sha256")
                .update(mutatedSiteBytes)
                .digest("hex");
        }
        mutateLock?.(lock);
        writeFileSync(
            join(directory, `${MIGRATION_BASENAME}.media-site.json`),
            `${JSON.stringify(lock, null, 4)}\n`,
        );
    }

    try {
        return spawnSync(
            process.execPath,
            [join(directory, `${MIGRATION_BASENAME}.js`), "--dry-run"],
            {
                cwd: REPO_ROOT,
                env: {
                    NODE_ENV: "test",
                    PATH: process.env.PATH,
                    DB_CONNECTION_STRING: "mongodb://127.0.0.1:1/not-used",
                    TARGET_DOMAIN: "main",
                },
                encoding: "utf8",
                timeout: 20_000,
            },
        );
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
}

describe("follow-up migration frozen curriculum", () => {
    it("ships the reviewed 22-lesson course byte-for-byte", () => {
        expect(readFileSync(FROZEN_COURSE_PATH)).toEqual(
            readFileSync(CANONICAL_COURSE_PATH),
        );
        expect(JSON.parse(readFileSync(FROZEN_COURSE_PATH, "utf8"))).toEqual(
            JSON.parse(readFileSync(CANONICAL_COURSE_PATH, "utf8")),
        );
    });

    it("ships the reviewed v2 site byte-for-byte", () => {
        expect(readFileSync(FROZEN_SITE_PATH)).toEqual(
            readFileSync(CANONICAL_SITE_PATH),
        );
        expect(JSON.parse(readFileSync(FROZEN_SITE_PATH, "utf8"))).toEqual(
            JSON.parse(readFileSync(CANONICAL_SITE_PATH, "utf8")),
        );
    });

    it("fails a missing reviewed media/site lock before connecting", () => {
        const result = runMigrationBundle({ includeLock: false });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
            "Follow-up snapshots could not be read",
        );
        expect(result.stderr).not.toContain("Database connection failed");
    });

    it("rejects a lock for any target other than main before connecting", () => {
        const result = runMigrationBundle({
            mutateLock(lock) {
                lock.targetDomain = "other";
            },
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Media/site lock target is invalid");
        expect(result.stderr).not.toContain("Database connection failed");
    });

    it("rejects a broadened media MIME allowlist", () => {
        const result = runMigrationBundle({
            mutateLock(lock) {
                lock.allowedMimeTypes = ["image/webp", "image/png"];
            },
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Media MIME allowlist is invalid");
    });

    it("rejects a featured image that differs from the reviewed course", () => {
        const result = runMigrationBundle({
            mutateLock(lock) {
                const featuredImage = lock.featuredImage as Record<
                    string,
                    unknown
                >;
                featuredImage.caption = "A different valid caption";
            },
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
            "Featured image differs from reviewed course",
        );
    });

    it("rejects a lesson URL whose path belongs to another media ID", () => {
        const result = runMigrationBundle({
            mutateLock(lock) {
                const lessonImages = lock.lessonImages as Array<{
                    node: { attrs: { src: string } };
                }>;
                lessonImages[0].node.attrs.src =
                    "https://media.bhekani.com/p/not-the-declared-id/main.webp";
            },
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Media URL does not match its ID");
    });

    it.each([
        {
            label: "wrong source hash",
            expected: "Frozen source hash is invalid",
            mutate(lock: Record<string, unknown>) {
                const hashes = lock.sourceHashes as Record<string, string>;
                hashes.expandedCourse = "0".repeat(64);
            },
        },
        {
            label: "missing role",
            expected: "Lesson image role set is invalid",
            mutate(lock: Record<string, unknown>) {
                const images = lock.lessonImages as unknown[];
                lock.lessonImages = images.slice(1);
            },
        },
        {
            label: "wrong lesson target",
            expected: "Lesson image target is invalid",
            mutate(lock: Record<string, unknown>) {
                const images = lock.lessonImages as Array<{
                    lessonId: string;
                }>;
                images[0].lessonId = "lesson_ai_for_actual_work_18";
            },
        },
        {
            label: "duplicate media ID",
            expected: "Media identity is duplicated",
            mutate(lock: Record<string, unknown>) {
                const images = lock.lessonImages as Array<{ mediaId: string }>;
                images[1].mediaId = images[0].mediaId;
            },
        },
        {
            label: "duplicate media URL",
            expected: "Media URL does not match its ID",
            mutate(lock: Record<string, unknown>) {
                const images = lock.lessonImages as Array<{
                    node: { attrs: { src: string } };
                }>;
                images[1].node.attrs.src = images[0].node.attrs.src;
            },
        },
        {
            label: "non-HTTPS URL",
            expected: "Media URL is not reviewed",
            mutate(lock: Record<string, unknown>) {
                const images = lock.lessonImages as Array<{
                    node: { attrs: { src: string } };
                }>;
                images[0].node.attrs.src = images[0].node.attrs.src.replace(
                    "https://",
                    "http://",
                );
            },
        },
        {
            label: "unapproved host",
            expected: "Media URL is not reviewed",
            mutate(lock: Record<string, unknown>) {
                const images = lock.lessonImages as Array<{
                    node: { attrs: { src: string } };
                }>;
                images[0].node.attrs.src = images[0].node.attrs.src.replace(
                    "media.bhekani.com",
                    "unreviewed.example.com",
                );
            },
        },
        {
            label: "base64 URL",
            expected: "Media URL is not reviewed",
            mutate(lock: Record<string, unknown>) {
                const images = lock.lessonImages as Array<{
                    node: { attrs: { src: string } };
                }>;
                images[0].node.attrs.src = "data:image/webp;base64,AAAA";
            },
        },
        {
            label: "incomplete featured image",
            expected: "Featured image is invalid",
            mutate(lock: Record<string, unknown>) {
                const featured = lock.featuredImage as Record<string, unknown>;
                delete featured.thumbnail;
            },
        },
        {
            label: "empty image alt",
            expected: "Lesson image accessibility data is invalid",
            mutate(lock: Record<string, unknown>) {
                const images = lock.lessonImages as Array<{
                    node: { attrs: { alt: string } };
                }>;
                images[0].node.attrs.alt = "";
            },
        },
        {
            label: "bad insertion anchor",
            expected: "Lesson image placement is invalid",
            mutate(lock: Record<string, unknown>) {
                const images = lock.lessonImages as Array<{
                    anchorNodeSha256: string;
                }>;
                images[0].anchorNodeSha256 = "0".repeat(64);
            },
        },
    ])("rejects a lock with $label", ({ expected, mutate }) => {
        const result = runMigrationBundle({ mutateLock: mutate });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(expected);
        expect(result.stderr).not.toContain("Database connection failed");
    });

    it("rejects a desired site without the stable managed marker", () => {
        const result = runMigrationBundle({
            mutateSite(site) {
                const marker = site.managedMarker as Record<string, unknown>;
                marker.widgetId = "owner-marker";
            },
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Desired site contract is invalid");
    });

    it("rejects stale launch counts in the desired homepage", () => {
        const result = runMigrationBundle({
            mutateSite(site) {
                const page = site.page as Record<string, unknown>;
                page.description = "Free course. 7 sections. 14 lessons.";
            },
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Desired homepage is invalid");
    });
});

describe("follow-up migration CLI", () => {
    beforeEach(async () => {
        await mongoose.connection.db?.dropDatabase();
    });
    it.each([
        { label: "missing mode", args: [] },
        { label: "unknown mode", args: ["--unknown"] },
        { label: "multiple modes", args: ["--dry-run", "--apply"] },
    ])("rejects $label before database access", ({ args }) => {
        const result = runMigration(args);

        expect(result.status).toBe(64);
        expect(result.stderr).toContain(
            "Usage: expand-ai-work-school.js --dry-run|--apply",
        );
        expect(`${result.stdout}${result.stderr}`).not.toContain("mongodb://");
    });

    it("rejects missing database configuration without exposing a secret", () => {
        const result = runMigration(["--dry-run"], {
            TARGET_DOMAIN: "main",
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Database connection is required");
        expect(`${result.stdout}${result.stderr}`).not.toContain("mongodb://");
    });

    it("rejects any target except the explicit main domain", () => {
        const secret = "mongodb://user:password@db.example/production";
        const result = runMigration(["--dry-run"], {
            DB_CONNECTION_STRING: secret,
            TARGET_DOMAIN: "other",
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Target domain is not allowlisted");
        expect(`${result.stdout}${result.stderr}`).not.toContain(secret);
    });

    it("plans the launched baseline without changing any collection", async () => {
        const { db } = await seedLaunchedBaseline();
        const before = {
            courses: await db.collection("courses").find({}).toArray(),
            lessons: await db.collection("lessons").find({}).toArray(),
            pages: await db.collection("pages").find({}).toArray(),
            domains: await db.collection("domains").find({}).toArray(),
            users: await db.collection("users").find({}).toArray(),
            plans: await db.collection("paymentplans").find({}).toArray(),
        };

        const result = runMigration(["--dry-run"], databaseEnvironment());

        expect(result.status).toBe(0);
        expect(result.stdout).toContain(
            "followup-migration mode=dry-run planned=12 applied=0",
        );
        expect({
            courses: await db.collection("courses").find({}).toArray(),
            lessons: await db.collection("lessons").find({}).toArray(),
            pages: await db.collection("pages").find({}).toArray(),
            domains: await db.collection("domains").find({}).toArray(),
            users: await db.collection("users").find({}).toArray(),
            plans: await db.collection("paymentplans").find({}).toArray(),
        }).toEqual(before);
    });

    it("applies the reviewed course, widgets, and homepage in place", async () => {
        const { db, domainId } = await seedLaunchedBaseline();
        const baselineCourse = await db.collection("courses").findOne({
            courseId: "course_ai_for_actual_work_v1",
        });
        const baselineLessons = await db
            .collection("lessons")
            .find({ courseId: "course_ai_for_actual_work_v1" })
            .sort({ lessonId: 1 })
            .toArray();
        const desiredManifest = JSON.parse(
            readFileSync(FROZEN_COURSE_PATH, "utf8"),
        );
        const desiredSite = JSON.parse(readFileSync(FROZEN_SITE_PATH, "utf8"));
        const lock = JSON.parse(readFileSync(LOCK_PATH, "utf8"));

        const result = runMigration(["--apply"], databaseEnvironment());

        expect(result.status).toBe(0);
        expect(result.stdout).toContain(
            "followup-migration mode=apply planned=12 applied=12",
        );
        const course = await db.collection("courses").findOne({
            courseId: "course_ai_for_actual_work_v1",
        });
        const lessons = await db
            .collection("lessons")
            .find({ courseId: "course_ai_for_actual_work_v1" })
            .sort({ lessonId: 1 })
            .toArray();
        const homepage = await db.collection("pages").findOne({
            domain: domainId,
            pageId: "homepage",
        });
        const domain = await db
            .collection("domains")
            .findOne({ _id: domainId });

        expect(course?._id).toEqual(baselineCourse?._id);
        expect(course).toMatchObject({
            published: baselineCourse?.published,
            privacy: baselineCourse?.privacy,
            sales: baselineCourse?.sales,
            customers: baselineCourse?.customers,
            tags: baselineCourse?.tags,
            cost: baselineCourse?.cost,
            costType: baselineCourse?.costType,
            defaultPaymentPlan: baselineCourse?.defaultPaymentPlan,
            discussions: baselineCourse?.discussions,
            featuredImage: lock.featuredImage,
        });
        expect(course?.certificate).toBe(baselineCourse?.certificate);
        expect(course?.lessons).toEqual(
            desiredManifest.course.sections.flatMap(
                (section: { lessons: Array<{ lessonId: string }> }) =>
                    section.lessons.map(({ lessonId }) => lessonId),
            ),
        );
        expect(course?.groups.map(({ _id, rank }) => ({ _id, rank }))).toEqual(
            desiredManifest.course.sections.map(
                (section: { groupId: string; rank: number }) => ({
                    _id: section.groupId,
                    rank: section.rank,
                }),
            ),
        );
        expect(lessons).toHaveLength(22);
        expect(lessons.every(({ published }) => published === true)).toBe(true);
        for (const lesson of lessons.filter(
            ({ lessonId }) => Number(lessonId.slice(-2)) >= 15,
        )) {
            expect(lesson.createdAt).toBeInstanceOf(Date);
            expect(lesson.updatedAt).toEqual(lesson.createdAt);
        }
        expect(
            baselineLessons.map(({ _id, lessonId, published }) => ({
                _id,
                lessonId,
                published,
            })),
        ).toEqual(
            lessons.slice(0, 14).map(({ _id, lessonId, published }) => ({
                _id,
                lessonId,
                published,
            })),
        );
        expect(
            lessons.reduce(
                (count, lesson) =>
                    count +
                    (lesson.content?.content ?? []).filter(
                        ({ type }: { type: string }) => type === "image",
                    ).length,
                0,
            ),
        ).toBe(7);
        expect(homepage).toMatchObject({
            title: desiredSite.page.title,
            description: desiredSite.page.description,
            robotsAllowed: desiredSite.page.robotsAllowed,
            layout: desiredSite.page.layout,
            draftLayout: desiredSite.page.layout,
        });
        expect(domain?.sharedWidgets.header.settings.links[0].label).toBe(
            "Start the course — free",
        );
        expect(domain?.draftSharedWidgets).toEqual(domain?.sharedWidgets);
    });

    it("makes a second apply a timestamp-stable zero-write no-op", async () => {
        await seedLaunchedBaseline();
        expect(runMigration(["--apply"], databaseEnvironment()).status).toBe(0);
        const before = await snapshotManagedCollections();

        const result = runMigration(["--apply"], databaseEnvironment());

        expect(result.status).toBe(0);
        expect(result.stdout).toContain(
            "followup-migration mode=apply planned=0 applied=0",
        );
        expect(await snapshotManagedCollections()).toEqual(before);
    });

    it("dry-runs the fully migrated state as a zero-write no-op", async () => {
        await seedLaunchedBaseline();
        expect(runMigration(["--apply"], databaseEnvironment()).status).toBe(0);
        const before = await snapshotManagedCollections();

        const result = runMigration(["--dry-run"], databaseEnvironment());

        expect(result.status).toBe(0);
        expect(result.stdout).toContain(
            "followup-migration mode=dry-run planned=0 applied=0",
        );
        expect(await snapshotManagedCollections()).toEqual(before);
    });

    it("resumes after lesson staging stops before lesson 19", async () => {
        const { db } = await seedLaunchedBaseline();
        const baselineCourse = await db.collection("courses").findOne({});
        const baselineHomepage = await db
            .collection("pages")
            .findOne({ pageId: "homepage" });

        const interrupted = runMigration(["--apply"], {
            ...databaseEnvironment(),
            FOLLOWUP_MIGRATION_TEST_FAIL_AT: "before-lesson-19",
        });

        expect(interrupted.status).toBe(1);
        expect(
            await db.collection("lessons").countDocuments({
                lessonId: {
                    $in: [
                        "lesson_ai_for_actual_work_15",
                        "lesson_ai_for_actual_work_16",
                        "lesson_ai_for_actual_work_17",
                        "lesson_ai_for_actual_work_18",
                    ],
                },
                published: false,
            }),
        ).toBe(4);
        expect(await db.collection("courses").findOne({})).toEqual(
            baselineCourse,
        );
        expect(
            await db.collection("pages").findOne({ pageId: "homepage" }),
        ).toEqual(baselineHomepage);

        const resumed = runMigration(["--apply"], databaseEnvironment());
        expect(resumed.status).toBe(0);
        expect(
            await db.collection("lessons").countDocuments({
                courseId: "course_ai_for_actual_work_v1",
                published: true,
            }),
        ).toBe(22);
    });

    it("resumes after lessons publish but before the Course update", async () => {
        const { db } = await seedLaunchedBaseline();
        const baselineCourse = await db.collection("courses").findOne({});
        const baselineHomepage = await db
            .collection("pages")
            .findOne({ pageId: "homepage" });

        const interrupted = runMigration(["--apply"], {
            ...databaseEnvironment(),
            FOLLOWUP_MIGRATION_TEST_FAIL_AT: "before-course-update",
        });

        expect(interrupted.status).toBe(1);
        expect(
            await db.collection("lessons").countDocuments({
                courseId: "course_ai_for_actual_work_v1",
                published: true,
            }),
        ).toBe(22);
        expect(await db.collection("courses").findOne({})).toEqual(
            baselineCourse,
        );
        expect(
            await db.collection("pages").findOne({ pageId: "homepage" }),
        ).toEqual(baselineHomepage);

        const resumed = runMigration(["--apply"], databaseEnvironment());
        expect(resumed.status).toBe(0);
        expect(resumed.stdout).toContain("planned=3 applied=3");
    });

    it("updates only the homepage when resuming its final boundary", async () => {
        const { db } = await seedLaunchedBaseline();
        const baselineHomepage = await db
            .collection("pages")
            .findOne({ pageId: "homepage" });

        const interrupted = runMigration(["--apply"], {
            ...databaseEnvironment(),
            FOLLOWUP_MIGRATION_TEST_FAIL_AT: "before-homepage-update",
        });

        expect(interrupted.status).toBe(1);
        const courseBeforeResume = await db.collection("courses").findOne({});
        const lessonsBeforeResume = await db
            .collection("lessons")
            .find({})
            .sort({ lessonId: 1 })
            .toArray();
        expect(courseBeforeResume?.lessons).toHaveLength(22);
        expect(
            await db.collection("pages").findOne({ pageId: "homepage" }),
        ).toEqual(baselineHomepage);

        const resumed = runMigration(["--apply"], databaseEnvironment());
        expect(resumed.status).toBe(0);
        expect(resumed.stdout).toContain("planned=1 applied=1");
        expect(await db.collection("courses").findOne({})).toEqual(
            courseBeforeResume,
        );
        expect(
            await db
                .collection("lessons")
                .find({})
                .sort({ lessonId: 1 })
                .toArray(),
        ).toEqual(lessonsBeforeResume);
    });

    it("preserves learner progress and every commercial record", async () => {
        const { db, domainId } = await seedLaunchedBaseline();
        await db.collection("courses").updateOne(
            { courseId: "course_ai_for_actual_work_v1" },
            {
                $set: {
                    sales: 7,
                    customers: ["learner_ai_work_school_v1"],
                    tags: ["owner-tag"],
                    certificate: true,
                },
            },
        );
        await db.collection("domains").updateOne(
            { _id: domainId },
            {
                $set: {
                    "sharedWidgets.ownerWidget": {
                        widgetId: "owner-widget",
                        name: "owner-widget",
                        settings: { label: "Keep me" },
                    },
                    "draftSharedWidgets.ownerWidget": {
                        widgetId: "owner-widget-draft",
                        name: "owner-widget",
                        settings: { label: "Keep my draft" },
                    },
                },
            },
        );
        await db.collection("users").insertOne({
            domain: domainId,
            userId: "learner_ai_work_school_v1",
            email: "learner@example.com",
            active: true,
            name: "Learner",
            purchases: [
                {
                    courseId: "course_ai_for_actual_work_v1",
                    completedLessons: ["lesson_ai_for_actual_work_01"],
                    accessibleGroups: ["group_ai_for_actual_work_01"],
                    certificateId: "certificate_ai_work_school_v1",
                    scormData: {
                        lessons: {
                            lesson_ai_for_actual_work_01: {
                                cmi: { score: 100 },
                            },
                        },
                    },
                    createdAt: new Date("2026-08-01T09:00:00.000Z"),
                    updatedAt: new Date("2026-08-10T09:00:00.000Z"),
                },
            ],
        });
        await db.collection("memberships").insertOne({
            domain: domainId,
            membershipId: "membership_ai_work_school_v1",
            userId: "learner_ai_work_school_v1",
            paymentPlanId: "plan_ai_for_actual_work_free_v1",
            entityId: "course_ai_for_actual_work_v1",
            entityType: "course",
            sessionId: "session_ai_work_school_v1",
            status: "active",
        });
        await db.collection("invoices").insertOne({
            domain: domainId,
            invoiceId: "invoice_ai_work_school_v1",
            membershipId: "membership_ai_work_school_v1",
            membershipSessionId: "session_ai_work_school_v1",
            amount: 0,
            status: "paid",
            paymentProcessor: "none",
            currencyISOCode: "GBP",
        });
        await db.collection("certificates").insertOne({
            domain: domainId,
            certificateId: "certificate_ai_work_school_v1",
            userId: "learner_ai_work_school_v1",
            courseId: "course_ai_for_actual_work_v1",
        });
        await db.collection("activities").insertOne({
            domain: domainId,
            userId: "learner_ai_work_school_v1",
            type: "lesson_completed",
            entityId: "course_ai_for_actual_work_v1",
            metadata: { courseId: "course_ai_for_actual_work_v1" },
        });
        await db.collection("lessonevaluations").insertOne({
            domain: domainId,
            lessonId: "lesson_ai_for_actual_work_01",
            userId: "learner_ai_work_school_v1",
            pass: true,
            requiresPassingGrade: false,
            score: 100,
        });
        const before = await snapshotManagedCollections();

        const result = runMigration(["--apply"], databaseEnvironment());

        expect(result.status).toBe(0);
        const after = await snapshotManagedCollections();
        for (const name of [
            "users",
            "memberships",
            "invoices",
            "certificates",
            "activities",
            "lessonevaluations",
            "paymentplans",
        ]) {
            expect(after[name]).toEqual(before[name]);
        }
        const course = await db.collection("courses").findOne({
            courseId: "course_ai_for_actual_work_v1",
        });
        expect(course).toMatchObject({
            sales: 7,
            customers: ["learner_ai_work_school_v1"],
            tags: ["owner-tag"],
            certificate: true,
        });
        const beforeDomain = before.domains[0];
        const afterDomain = after.domains[0];
        expect(afterDomain.sharedWidgets.ownerWidget).toEqual(
            beforeDomain.sharedWidgets.ownerWidget,
        );
        expect(afterDomain.draftSharedWidgets.ownerWidget).toEqual(
            beforeDomain.draftSharedWidgets.ownerWidget,
        );
    });

    it.each<{
        label: string;
        expected: string;
        mutate: (
            db: TestDatabase,
            domainId: mongoose.Types.ObjectId,
        ) => Promise<unknown>;
    }>([
        {
            label: "owner-edited Course description",
            expected: "Managed course has owner edits",
            mutate: (db) =>
                db
                    .collection("courses")
                    .updateOne(
                        { courseId: "course_ai_for_actual_work_v1" },
                        { $set: { description: "Owner-authored description" } },
                    ),
        },
        {
            label: "owner-edited Course topology",
            expected: "Managed course has owner edits",
            mutate: (db) =>
                db
                    .collection("courses")
                    .updateOne(
                        { courseId: "course_ai_for_actual_work_v1" },
                        { $push: { lessons: "owner_lesson" } },
                    ),
        },
        {
            label: "owner-edited featured image",
            expected: "Managed course has owner edits",
            mutate: (db) =>
                db.collection("courses").updateOne(
                    { courseId: "course_ai_for_actual_work_v1" },
                    {
                        $set: {
                            featuredImage: {
                                access: "public",
                                file: "https://owner.example/cover.webp",
                                mediaId: "owner-cover",
                            },
                        },
                    },
                ),
        },
        {
            label: "owner-edited capstone",
            expected: "Managed capstone lesson has owner edits",
            mutate: (db) =>
                db
                    .collection("lessons")
                    .updateOne(
                        { lessonId: "lesson_ai_for_actual_work_14" },
                        { $set: { content: { type: "doc", content: [] } } },
                    ),
        },
        {
            label: "owner-edited homepage",
            expected: "Managed homepage has owner edits",
            mutate: (db) =>
                db.collection("pages").updateOne(
                    { pageId: "homepage" },
                    {
                        $push: {
                            layout: {
                                widgetId: "owner-widget",
                                name: "rich-text",
                                settings: {},
                            },
                        },
                    },
                ),
        },
        {
            label: "owner-edited managed shared widget",
            expected: "Managed shared widgets have owner edits",
            mutate: (db) =>
                db.collection("domains").updateOne(
                    { name: "main" },
                    {
                        $set: {
                            "sharedWidgets.header.settings.links.0.label":
                                "Owner CTA",
                        },
                    },
                ),
        },
        {
            label: "stable lesson ID collision",
            expected: "Managed lesson identity collides with existing data",
            mutate: (db) =>
                db.collection("lessons").insertOne({
                    domain: new mongoose.Types.ObjectId(),
                    lessonId: "lesson_ai_for_actual_work_15",
                    courseId: "another_course",
                    groupId: "another_group",
                    type: "text",
                    creatorId: "another_owner",
                    requiresEnrollment: true,
                    published: false,
                    title: "Collision",
                    content: { type: "doc", content: [] },
                }),
        },
        {
            label: "stable group ID collision",
            expected: "Managed group identity collides with existing data",
            mutate: (db, domainId) =>
                db.collection("courses").insertOne({
                    domain: domainId,
                    courseId: "another_course",
                    title: "Another course",
                    slug: "another-course",
                    groups: [{ _id: "group_ai_for_actual_work_08" }],
                }),
        },
        {
            label: "unknown lesson attached to the managed Course",
            expected: "Managed lesson identity collides with existing data",
            mutate: (db, domainId) =>
                db.collection("lessons").insertOne({
                    domain: domainId,
                    lessonId: "owner_lesson",
                    courseId: "course_ai_for_actual_work_v1",
                    groupId: "group_ai_for_actual_work_01",
                    type: "text",
                    creatorId: "owner_ai_work_school_v1",
                    requiresEnrollment: true,
                    published: false,
                    title: "Owner lesson",
                    content: { type: "doc", content: [] },
                }),
        },
        {
            label: "archived external free plan",
            expected: "External free plan is invalid",
            mutate: (db) =>
                db
                    .collection("paymentplans")
                    .updateOne(
                        { planId: "plan_ai_for_actual_work_free_v1" },
                        { $set: { archived: true } },
                    ),
        },
    ])("rejects $label before writing", async ({ expected, mutate }) => {
        const { db, domainId } = await seedLaunchedBaseline();
        await mutate(db, domainId);
        const before = await snapshotManagedCollections();

        const result = runMigration(["--apply"], databaseEnvironment());

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(expected);
        expect(await snapshotManagedCollections()).toEqual(before);
    });

    it("preserves Course and existing-lesson publication choices", async () => {
        const { db } = await seedLaunchedBaseline();
        await db
            .collection("courses")
            .updateOne(
                { courseId: "course_ai_for_actual_work_v1" },
                { $set: { published: false, privacy: "unlisted" } },
            );
        await db
            .collection("lessons")
            .updateOne(
                { lessonId: "lesson_ai_for_actual_work_01" },
                { $set: { published: false } },
            );

        const result = runMigration(["--apply"], databaseEnvironment());

        expect(result.status).toBe(0);
        expect(
            await db.collection("courses").findOne({
                courseId: "course_ai_for_actual_work_v1",
            }),
        ).toMatchObject({ published: false, privacy: "unlisted" });
        expect(
            await db.collection("lessons").findOne({
                lessonId: "lesson_ai_for_actual_work_01",
            }),
        ).toMatchObject({ published: false });
    });

    it("rejects a final homepage while the Course is still baseline", async () => {
        const { db } = await seedLaunchedBaseline();
        const desiredSite = JSON.parse(readFileSync(FROZEN_SITE_PATH, "utf8"));
        await db.collection("pages").updateOne(
            { pageId: "homepage" },
            {
                $set: {
                    title: desiredSite.page.title,
                    description: desiredSite.page.description,
                    robotsAllowed: desiredSite.page.robotsAllowed,
                    draftTitle: desiredSite.page.title,
                    draftDescription: desiredSite.page.description,
                    draftRobotsAllowed: desiredSite.page.robotsAllowed,
                    layout: desiredSite.page.layout,
                    draftLayout: desiredSite.page.layout,
                },
            },
        );
        const before = await snapshotManagedCollections();

        const result = runMigration(["--apply"], databaseEnvironment());

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
            "Final homepage has incomplete dependencies",
        );
        expect(await snapshotManagedCollections()).toEqual(before);
    });

    it("rejects final shared widgets while the Course is still baseline", async () => {
        const { db } = await seedLaunchedBaseline();
        const desiredSite = JSON.parse(readFileSync(FROZEN_SITE_PATH, "utf8"));
        const widgets = Object.fromEntries(
            desiredSite.sharedWidgets.map((widget: { name: string }) => [
                widget.name,
                widget,
            ]),
        );
        await db.collection("domains").updateOne(
            { name: "main" },
            {
                $set: {
                    "sharedWidgets.header": widgets.header,
                    "sharedWidgets.footer": widgets.footer,
                    "draftSharedWidgets.header": widgets.header,
                    "draftSharedWidgets.footer": widgets.footer,
                },
            },
        );
        const before = await snapshotManagedCollections();

        const result = runMigration(["--apply"], databaseEnvironment());

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
            "Final shared widgets have an incomplete Course dependency",
        );
        expect(await snapshotManagedCollections()).toEqual(before);
    });

    it("rejects a final Course with a staged new lesson", async () => {
        const { db } = await seedLaunchedBaseline();
        expect(
            runMigration(["--apply"], {
                ...databaseEnvironment(),
                FOLLOWUP_MIGRATION_TEST_FAIL_AT: "before-homepage-update",
            }).status,
        ).toBe(1);
        await db
            .collection("lessons")
            .updateOne(
                { lessonId: "lesson_ai_for_actual_work_19" },
                { $set: { published: false } },
            );
        const before = await snapshotManagedCollections();

        const result = runMigration(["--apply"], databaseEnvironment());

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Final course has incomplete lessons");
        expect(await snapshotManagedCollections()).toEqual(before);
    });

    it("never prints database credentials or stored content", async () => {
        const secret = "migration-user:migration-password";
        const result = runMigration(["--dry-run"], {
            DB_CONNECTION_STRING: `mongodb://${secret}@127.0.0.1:1/test?serverSelectionTimeoutMS=50`,
            TARGET_DOMAIN: "main",
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Database connection failed");
        expect(`${result.stdout}${result.stderr}`).not.toContain(secret);
        expect(`${result.stdout}${result.stderr}`).not.toContain(
            "A reusable skill is a packed kit",
        );
        expect(`${result.stdout}${result.stderr}`).not.toContain(
            "CvBV8mXoM8P2VdfimD-vOuwFCj5E9CwOO91sJ2SX",
        );
    });

    it("fails verification if the homepage changes after its CAS update", async () => {
        const { db } = await seedLaunchedBaseline();

        const result = runMigration(["--apply"], {
            ...databaseEnvironment(),
            FOLLOWUP_MIGRATION_TEST_CORRUPT_AFTER_SITE: "homepage",
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Homepage verification failed");
        const course = await db.collection("courses").findOne({
            courseId: "course_ai_for_actual_work_v1",
        });
        expect(course?.lessons).toHaveLength(22);
    });
});
