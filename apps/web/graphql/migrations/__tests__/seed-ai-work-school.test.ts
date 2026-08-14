import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
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
const CANONICAL_SITE_PATH = join(
    REPO_ROOT,
    "content",
    "site",
    "ai-work-school",
    "site.json",
);
const FROZEN_COURSE_PATH = join(
    REPO_ROOT,
    "apps",
    "web",
    ".migrations",
    "14-08-26_17-30-seed-ai-work-school.course.json",
);
const FROZEN_SITE_PATH = join(
    REPO_ROOT,
    "apps",
    "web",
    ".migrations",
    "14-08-26_17-30-seed-ai-work-school.site.json",
);
const MIGRATION_PATH = join(
    REPO_ROOT,
    "apps",
    "web",
    ".migrations",
    "14-08-26_17-30-seed-ai-work-school.js",
);
const DEFAULT_HOMEPAGE_MARKER =
    "This is the default page created for you by CourseLit.";
const REQUIRED_PERMISSIONS = [
    "course:manage_any",
    "course:publish",
    "site:manage",
    "setting:manage",
];

type MigrationResult = ReturnType<typeof spawnSync>;

function migrationEnvironment(
    overrides: Record<string, string | undefined> = {},
): NodeJS.ProcessEnv {
    const connection = mongoose.connection;
    const databaseName = connection.name;
    const databaseUri = `mongodb://${connection.host}:${connection.port}/${databaseName}`;

    return {
        NODE_ENV: process.env.NODE_ENV ?? "test",
        PATH: process.env.PATH,
        DB_CONNECTION_STRING: databaseUri,
        TARGET_DOMAIN: "main",
        ...overrides,
    };
}

function runMigration(
    args: string[],
    overrides: Record<string, string | undefined> = {},
): MigrationResult {
    const env = Object.fromEntries(
        Object.entries(migrationEnvironment(overrides)).filter(
            (entry): entry is [string, string] => Boolean(entry[1]),
        ),
    ) as NodeJS.ProcessEnv;

    return spawnSync(process.execPath, [MIGRATION_PATH, ...args], {
        cwd: REPO_ROOT,
        env,
        encoding: "utf8",
        timeout: 20_000,
    });
}

async function seedLaunchPrerequisites() {
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
        settings: {
            title: "My school",
            subtitle: "Learn something new",
        },
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
        permissions: REQUIRED_PERMISSIONS,
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

    return { db, domainId };
}

describe("launch migration frozen curriculum data", () => {
    // The runtime image and the migration image both build from apps/web and
    // packages only: services/app/Dockerfile never copies root content/. The
    // migration therefore ships its own copy, and this test is what stops that
    // copy from drifting away from the reviewed P3 curriculum.
    it("is deep equal to the canonical P3 curriculum manifest", () => {
        const canonical = JSON.parse(
            readFileSync(CANONICAL_COURSE_PATH, "utf8"),
        );
        const frozen = JSON.parse(readFileSync(FROZEN_COURSE_PATH, "utf8"));

        expect(frozen).toStrictEqual(canonical);
    });

    it("is a byte-for-byte copy of the canonical P3 curriculum manifest", () => {
        expect(readFileSync(FROZEN_COURSE_PATH)).toEqual(
            readFileSync(CANONICAL_COURSE_PATH),
        );
    });

    it("keeps the launch site snapshot deep-equal to the P2 manifest", () => {
        expect(
            JSON.parse(readFileSync(FROZEN_SITE_PATH, "utf8")),
        ).toStrictEqual(JSON.parse(readFileSync(CANONICAL_SITE_PATH, "utf8")));
    });

    it("keeps the launch site snapshot byte-equal to the P2 manifest", () => {
        expect(readFileSync(FROZEN_SITE_PATH)).toEqual(
            readFileSync(CANONICAL_SITE_PATH),
        );
    });
});

describe("launch migration CLI", () => {
    beforeEach(async () => {
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error("Test database is unavailable");
        }
        await db.dropDatabase();
    });

    it.each([
        { label: "missing mode", args: [] },
        { label: "unknown mode", args: ["--unknown"] },
        { label: "more than one mode", args: ["--dry-run", "--apply"] },
    ])("rejects $label before connecting", ({ args }) => {
        const result = runMigration(args, {
            DB_CONNECTION_STRING: undefined,
        });

        expect(result.status).toBe(64);
        expect(result.stderr).toContain(
            "Usage: seed-ai-work-school.js --dry-run|--apply",
        );
        expect(`${result.stdout}${result.stderr}`).not.toContain("mongodb://");
    });

    it("rejects a missing database connection before connecting", () => {
        const result = runMigration(["--dry-run"], {
            DB_CONNECTION_STRING: undefined,
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Database connection is required");
        expect(`${result.stdout}${result.stderr}`).not.toContain("mongodb://");
    });

    it("rejects a non-allowlisted target before writing", async () => {
        const { db } = await seedLaunchPrerequisites();
        const before = await db.collections();

        const result = runMigration(["--dry-run"], {
            TARGET_DOMAIN: "other",
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Target domain is not allowlisted");
        expect(await db.collections()).toHaveLength(before.length);
        expect(`${result.stdout}${result.stderr}`).not.toContain("mongodb://");
    });

    it("dry-runs a valid launch without writing", async () => {
        const { db } = await seedLaunchPrerequisites();
        const before = {
            courses: await db.collection("courses").countDocuments(),
            lessons: await db.collection("lessons").countDocuments(),
            pages: await db.collection("pages").countDocuments(),
            plans: await db.collection("paymentplans").countDocuments(),
        };

        const result = runMigration(["--dry-run"]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("mode=dry-run");
        expect(result.stdout).toContain("planned=20");
        expect({
            courses: await db.collection("courses").countDocuments(),
            lessons: await db.collection("lessons").countDocuments(),
            pages: await db.collection("pages").countDocuments(),
            plans: await db.collection("paymentplans").countDocuments(),
        }).toEqual(before);
        expect(`${result.stdout}${result.stderr}`).not.toContain("mongodb://");
    });

    it("publishes the complete course before switching the site", async () => {
        const { db, domainId } = await seedLaunchPrerequisites();

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("mode=apply");
        expect(result.stdout).toContain("planned=20");
        expect(result.stdout).toContain("applied=20");

        const course = await db.collection("courses").findOne({
            courseId: "course_ai_for_actual_work_v1",
        });
        const page = await db.collection("pages").findOne({
            domain: domainId,
            pageId: "ai-for-actual-work",
        });
        const plan = await db.collection("paymentplans").findOne({
            planId: "plan_ai_for_actual_work_free_v1",
        });
        const homepage = await db.collection("pages").findOne({
            domain: domainId,
            pageId: "homepage",
        });
        const domain = await db.collection("domains").findOne({
            _id: domainId,
        });
        const theme = await db.collection("userthemes").findOne({
            themeId: "theme_ai_work_school_v1",
        });
        const lessons = await db
            .collection("lessons")
            .find({ courseId: "course_ai_for_actual_work_v1" })
            .sort({ lessonId: 1 })
            .toArray();

        expect(course).toMatchObject({
            domain: domainId,
            title: "AI for actual work",
            slug: "ai-for-actual-work",
            privacy: "public",
            type: "course",
            published: true,
            defaultPaymentPlan: "plan_ai_for_actual_work_free_v1",
            pageId: "ai-for-actual-work",
            lessons: Array.from(
                { length: 14 },
                (_, index) =>
                    `lesson_ai_for_actual_work_${String(index + 1).padStart(2, "0")}`,
            ),
        });
        expect(course?.groups).toHaveLength(7);
        expect(course?.groups[0]).toMatchObject({
            _id: "group_ai_for_actual_work_01",
            rank: 1000,
            lessonsOrder: [
                "lesson_ai_for_actual_work_01",
                "lesson_ai_for_actual_work_02",
            ],
        });
        expect(JSON.parse(course?.description)).toMatchObject({ type: "doc" });
        expect(page).toMatchObject({
            domain: domainId,
            entityId: "course_ai_for_actual_work_v1",
            type: "product",
            deleted: false,
        });
        expect(page?.layout.map(({ widgetId }) => widgetId)).toEqual([
            "widget_ai_work_product_header_v1",
            "widget_ai_work_product_banner_v1",
            "widget_ai_work_product_content_v1",
            "widget_ai_work_product_footer_v1",
        ]);
        expect(page?.draftLayout).toEqual(page?.layout);
        expect(plan).toMatchObject({
            domain: domainId,
            entityId: "course_ai_for_actual_work_v1",
            entityType: "course",
            type: "free",
            internal: false,
            archived: false,
        });
        expect(homepage).toMatchObject({
            pageId: "homepage",
            title: "AI for actual work | AI Work School",
            robotsAllowed: true,
        });
        expect(homepage?.layout.map(({ widgetId }) => widgetId)).toContain(
            "widget_ai_work_school_managed_v1",
        );
        expect(homepage?.draftLayout).toEqual(homepage?.layout);
        expect(domain).toMatchObject({
            themeId: "theme_ai_work_school_v1",
            lastEditedThemeId: "theme_ai_work_school_v1",
            settings: {
                title: "AI Work School",
                subtitle: "Bring the task. Build the checks.",
            },
        });
        expect(domain?.sharedWidgets.header.widgetId).toBe(
            "widget_ai_work_school_header_v1",
        );
        expect(domain?.sharedWidgets.header.settings.linkFontWeight).toBe(
            "font-bold",
        );
        expect(domain?.sharedWidgets.footer.widgetId).toBe(
            "widget_ai_work_school_footer_v1",
        );
        expect(domain?.draftSharedWidgets).toEqual(domain?.sharedWidgets);
        expect(theme).toMatchObject({
            domain: domainId,
            themeId: "theme_ai_work_school_v1",
            name: "AI Work School",
            parentThemeId: "learning",
            userId: "owner_ai_work_school_v1",
        });
        expect(theme?.draftTheme).toEqual(theme?.theme);
        expect(lessons).toHaveLength(14);
        expect(lessons.every(({ published }) => published === true)).toBe(true);
        expect(lessons[0]).toMatchObject({
            lessonId: "lesson_ai_for_actual_work_01",
            groupId: "group_ai_for_actual_work_01",
            requiresEnrollment: false,
            content: { type: "doc" },
        });
        expect(lessons[13]).toMatchObject({
            lessonId: "lesson_ai_for_actual_work_14",
            groupId: "group_ai_for_actual_work_07",
            requiresEnrollment: true,
        });
    });

    it("makes the second apply a timestamp-stable no-op", async () => {
        const { db } = await seedLaunchPrerequisites();
        expect(runMigration(["--apply"]).status).toBe(0);
        const before = {
            course: await db.collection("courses").findOne({}),
            productPage: await db.collection("pages").findOne({
                pageId: "ai-for-actual-work",
            }),
            homepage: await db.collection("pages").findOne({
                pageId: "homepage",
            }),
            domain: await db.collection("domains").findOne({}),
            theme: await db.collection("userthemes").findOne({}),
            plan: await db.collection("paymentplans").findOne({}),
            lessons: await db
                .collection("lessons")
                .find({})
                .sort({ lessonId: 1 })
                .toArray(),
        };

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("planned=0");
        expect(result.stdout).toContain("applied=0");
        expect({
            course: await db.collection("courses").findOne({}),
            productPage: await db.collection("pages").findOne({
                pageId: "ai-for-actual-work",
            }),
            homepage: await db.collection("pages").findOne({
                pageId: "homepage",
            }),
            domain: await db.collection("domains").findOne({}),
            theme: await db.collection("userthemes").findOne({}),
            plan: await db.collection("paymentplans").findOne({}),
            lessons: await db
                .collection("lessons")
                .find({})
                .sort({ lessonId: 1 })
                .toArray(),
        }).toEqual(before);
    });

    it("resumes an interrupted aggregate and republishes it", async () => {
        const { db } = await seedLaunchPrerequisites();
        expect(runMigration(["--apply"]).status).toBe(0);
        await db.collection("paymentplans").deleteOne({
            planId: "plan_ai_for_actual_work_free_v1",
        });
        await db.collection("lessons").deleteMany({
            lessonId: {
                $in: [
                    "lesson_ai_for_actual_work_12",
                    "lesson_ai_for_actual_work_13",
                    "lesson_ai_for_actual_work_14",
                ],
            },
        });

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("planned=4");
        expect(result.stdout).toContain("applied=4");
        expect(
            await db.collection("lessons").countDocuments({
                courseId: "course_ai_for_actual_work_v1",
                published: true,
            }),
        ).toBe(14);
        expect(
            await db.collection("courses").countDocuments({ published: true }),
        ).toBe(1);
    });

    it("rejects a stable lesson ID owned by another aggregate", async () => {
        const { db } = await seedLaunchPrerequisites();
        await db.collection("lessons").insertOne({
            domain: new mongoose.Types.ObjectId(),
            lessonId: "lesson_ai_for_actual_work_07",
            courseId: "unrelated_course",
            published: true,
        });

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
            "Managed lesson identity collides with existing data",
        );
        expect(
            await db.collection("courses").countDocuments({
                courseId: "course_ai_for_actual_work_v1",
            }),
        ).toBe(0);
        expect(
            await db.collection("lessons").countDocuments({
                courseId: "course_ai_for_actual_work_v1",
            }),
        ).toBe(0);
    });

    it("rejects a natural course-key collision before writing", async () => {
        const { db, domainId } = await seedLaunchPrerequisites();
        await db.collection("courses").insertOne({
            domain: domainId,
            courseId: "different_course",
            title: "AI for actual work",
            slug: "different-course",
            type: "course",
            published: false,
        });

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
            "Managed course identity collides with existing data",
        );
        expect(await db.collection("courses").countDocuments({})).toBe(1);
        expect(await db.collection("lessons").countDocuments({})).toBe(0);
    });

    it("rejects an external-plan stable-ID collision before writing", async () => {
        const { db, domainId } = await seedLaunchPrerequisites();
        await db.collection("paymentplans").insertOne({
            domain: domainId,
            planId: "plan_ai_for_actual_work_free_v1",
            entityId: "different_course",
            entityType: "course",
            type: "free",
            internal: false,
            archived: false,
        });

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
            "Managed payment plan identity collides with existing data",
        );
        expect(
            await db.collection("courses").countDocuments({ published: true }),
        ).toBe(0);
        expect(await db.collection("paymentplans").countDocuments({})).toBe(1);
    });

    it("rejects an owner without every launch permission", async () => {
        const { db } = await seedLaunchPrerequisites();
        await db
            .collection<{ email: string; permissions: string[] }>("users")
            .updateOne(
                { email: "owner@example.com" },
                { $pull: { permissions: "course:publish" } },
            );

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
            "Domain owner permissions are incomplete",
        );
        expect(await db.collection("courses").countDocuments({})).toBe(0);
    });

    it("accepts owner-scoped course management permission", async () => {
        const { db } = await seedLaunchPrerequisites();
        await db.collection("users").updateOne(
            { email: "owner@example.com" },
            {
                $set: {
                    permissions: [
                        "course:manage",
                        "course:publish",
                        "site:manage",
                        "setting:manage",
                    ],
                },
            },
        );

        const result = runMigration(["--dry-run"]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("planned=20");
        expect(await db.collection("courses").countDocuments({})).toBe(0);
    });

    it("rejects an owner without a display name", async () => {
        const { db } = await seedLaunchPrerequisites();
        await db
            .collection("users")
            .updateOne({ email: "owner@example.com" }, { $set: { name: "" } });

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
            "Domain owner display name is required",
        );
        expect(await db.collection("courses").countDocuments({})).toBe(0);
    });

    it("rejects an owner-edited homepage before writing", async () => {
        const { db } = await seedLaunchPrerequisites();
        await db.collection("pages").updateOne(
            { pageId: "homepage" },
            {
                $set: {
                    layout: [
                        {
                            widgetId: "owner-copy",
                            name: "hero",
                            settings: { title: "Owner-authored homepage" },
                        },
                    ],
                },
            },
        );

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Homepage is not the known default");
        expect(await db.collection("courses").countDocuments({})).toBe(0);
        expect(await db.collection("pages").countDocuments({})).toBe(3);
    });

    it("rejects a managed homepage changed after launch", async () => {
        const { db } = await seedLaunchPrerequisites();
        expect(runMigration(["--apply"]).status).toBe(0);
        await db
            .collection<{
                pageId: string;
                layout: Array<{
                    widgetId: string;
                    name: string;
                    settings: Record<string, unknown>;
                }>;
            }>("pages")
            .updateOne(
                { pageId: "homepage" },
                {
                    $push: {
                        layout: {
                            widgetId: "owner-added-widget",
                            name: "rich-text",
                            settings: { text: { type: "doc", content: [] } },
                        },
                    },
                },
            );

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Managed homepage has owner edits");
        expect(
            await db.collection("pages").countDocuments({
                pageId: "homepage",
                "layout.widgetId": "owner-added-widget",
            }),
        ).toBe(1);
    });

    it("requires the legal pages referenced by the footer", async () => {
        const { db } = await seedLaunchPrerequisites();
        await db.collection("pages").deleteOne({ pageId: "privacy" });

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
            "Required legal pages preflight failed",
        );
        expect(await db.collection("courses").countDocuments({})).toBe(0);
        expect(await db.collection("userthemes").countDocuments({})).toBe(0);
    });

    it("rejects a stable theme ID owned by another domain", async () => {
        const { db } = await seedLaunchPrerequisites();
        await db.collection("userthemes").insertOne({
            domain: new mongoose.Types.ObjectId(),
            themeId: "theme_ai_work_school_v1",
            name: "Unrelated theme",
        });

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
            "Managed theme identity collides with existing data",
        );
        expect(await db.collection("courses").countDocuments({})).toBe(0);
        expect(await db.collection("userthemes").countDocuments({})).toBe(1);
    });

    it("keeps course and site unpublished when lesson staging is interrupted", async () => {
        const { db, domainId } = await seedLaunchPrerequisites();
        await db.createCollection("lessons", {
            validator: {
                $nor: [{ lessonId: "lesson_ai_for_actual_work_07" }],
            },
        });

        const interrupted = runMigration(["--apply"]);

        expect(interrupted.status).toBe(1);
        expect(
            await db.collection("courses").countDocuments({
                courseId: "course_ai_for_actual_work_v1",
                published: false,
            }),
        ).toBe(1);
        const stagedLessons = await db.collection("lessons").find({}).toArray();
        expect(stagedLessons.length).toBeGreaterThan(0);
        expect(
            stagedLessons.every(({ published }) => published === false),
        ).toBe(true);
        expect(await db.collection("userthemes").countDocuments({})).toBe(0);
        expect(
            await db.collection("pages").countDocuments({
                pageId: "homepage",
                "layout.settings.text.content.content.text":
                    DEFAULT_HOMEPAGE_MARKER,
            }),
        ).toBe(1);
        expect(
            await db.collection("domains").countDocuments({
                _id: domainId,
                themeId: "learning",
            }),
        ).toBe(1);

        await db.command({ collMod: "lessons", validator: {} });
        const resumed = runMigration(["--apply"]);

        expect(resumed.status).toBe(0);
        expect(
            await db.collection("courses").countDocuments({ published: true }),
        ).toBe(1);
        expect(
            await db.collection("pages").countDocuments({
                pageId: "homepage",
                "layout.widgetId": "widget_ai_work_school_managed_v1",
            }),
        ).toBe(1);
    });

    it("rejects an unrelated published course before writing", async () => {
        const { db, domainId } = await seedLaunchPrerequisites();
        await db.collection("courses").insertOne({
            domain: domainId,
            courseId: "existing_public_course",
            title: "Existing public course",
            slug: "existing-public-course",
            type: "course",
            published: true,
        });

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
            "An unrelated published course blocks launch",
        );
        expect(await db.collection("courses").countDocuments({})).toBe(1);
        expect(await db.collection("lessons").countDocuments({})).toBe(0);
    });

    it("rejects duplicate managed group IDs in a resumable course", async () => {
        const { db, domainId } = await seedLaunchPrerequisites();
        await db.collection("courses").insertOne({
            domain: domainId,
            courseId: "course_ai_for_actual_work_v1",
            title: "AI for actual work",
            slug: "ai-for-actual-work",
            type: "course",
            published: false,
            groups: [
                { _id: "group_ai_for_actual_work_01" },
                { _id: "group_ai_for_actual_work_01" },
            ],
        });

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Managed group identity is duplicated");
        expect(await db.collection("courses").countDocuments({})).toBe(1);
        expect(await db.collection("lessons").countDocuments({})).toBe(0);
    });

    it("rejects a managed widget ID reused by another page", async () => {
        const { db, domainId } = await seedLaunchPrerequisites();
        await db.collection("pages").insertOne({
            domain: domainId,
            pageId: "owner-page",
            entityId: "owner-page",
            deleted: false,
            layout: [
                {
                    widgetId: "widget_ai_work_product_banner_v1",
                    name: "banner",
                },
            ],
        });

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
            "Managed widget identity collides with existing data",
        );
        expect(await db.collection("pages").countDocuments({})).toBe(4);
        expect(await db.collection("courses").countDocuments({})).toBe(0);
    });
});
