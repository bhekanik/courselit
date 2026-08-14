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
const FROZEN_COURSE_PATH = join(
    REPO_ROOT,
    "apps",
    "web",
    ".migrations",
    "14-08-26_17-30-seed-ai-work-school.course.json",
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
) {
    const connection = mongoose.connection;
    const databaseName = connection.name;
    const databaseUri = `mongodb://${connection.host}:${connection.port}/${databaseName}`;

    return {
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
    const env = migrationEnvironment(overrides);

    return spawnSync(process.execPath, [MIGRATION_PATH, ...args], {
        cwd: REPO_ROOT,
        env: Object.fromEntries(
            Object.entries(env).filter((entry): entry is [string, string] =>
                Boolean(entry[1]),
            ),
        ),
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
    });
    await db.collection("users").insertOne({
        domain: domainId,
        userId: "owner_ai_work_school_v1",
        email: "owner@example.com",
        active: true,
        name: "BK",
        permissions: REQUIRED_PERMISSIONS,
    });
    await db.collection("pages").insertOne({
        domain: domainId,
        pageId: "homepage",
        name: "Home",
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
    });

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
        expect(result.stdout).toContain("planned=17");
        expect({
            courses: await db.collection("courses").countDocuments(),
            lessons: await db.collection("lessons").countDocuments(),
            pages: await db.collection("pages").countDocuments(),
            plans: await db.collection("paymentplans").countDocuments(),
        }).toEqual(before);
        expect(`${result.stdout}${result.stderr}`).not.toContain("mongodb://");
    });

    it("applies the complete course aggregate without publishing it", async () => {
        const { db, domainId } = await seedLaunchPrerequisites();

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("mode=apply");
        expect(result.stdout).toContain("planned=17");
        expect(result.stdout).toContain("applied=17");

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
        const lessons = await db
            .collection("lessons")
            .find({ courseId: "course_ai_for_actual_work_v1" })
            .sort({ lessonId: 1 })
            .toArray();

        expect(course).toMatchObject({
            domain: domainId,
            title: "AI for actual work",
            slug: "ai-for-actual-work",
            privacy: "unlisted",
            type: "course",
            published: false,
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
        expect(lessons).toHaveLength(14);
        expect(lessons.every(({ published }) => published === false)).toBe(
            true,
        );
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
            plan: await db.collection("paymentplans").findOne({}),
            lessons: await db
                .collection("lessons")
                .find({})
                .sort({ lessonId: 1 })
                .toArray(),
        }).toEqual(before);
    });

    it("resumes an interrupted unpublished aggregate", async () => {
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
                published: false,
            }),
        ).toBe(14);
        expect(
            await db.collection("courses").countDocuments({ published: true }),
        ).toBe(0);
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
            .collection("users")
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
        expect(result.stdout).toContain("planned=17");
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
        expect(await db.collection("pages").countDocuments({})).toBe(1);
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
        expect(await db.collection("pages").countDocuments({})).toBe(2);
        expect(await db.collection("courses").countDocuments({})).toBe(0);
    });
});
