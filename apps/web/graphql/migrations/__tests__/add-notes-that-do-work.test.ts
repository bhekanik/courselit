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
const MIGRATION_ID = "16-08-26_00-40-add-notes-that-do-work";
const MIGRATION_PATH = join(
    REPO_ROOT,
    "apps",
    "web",
    ".migrations",
    `${MIGRATION_ID}.js`,
);
const MIGRATION_DIRECTORY = join(REPO_ROOT, "apps", "web", ".migrations");
const FROZEN_PATHS = {
    course: join(MIGRATION_DIRECTORY, `${MIGRATION_ID}.course.json`),
    media: join(MIGRATION_DIRECTORY, `${MIGRATION_ID}.media.json`),
    site: join(MIGRATION_DIRECTORY, `${MIGRATION_ID}.site.json`),
};
const FROZEN_HASHES = {
    course: "4835a2b0bcba46bde66f47d81e338bc4ceabb7f980b561b381ec052fa803d637",
    media: "5435797ff68a44c8639d7da4670e70580e08b388a309339a6e1c0d12cabeadcb",
    site: "ef71d8f2f12b51c488770edaf47046980bf9dae3849816f8bbefde3037d2b50f",
};
const PREREQUISITE_MIGRATIONS = [
    "14-08-26_17-30-seed-ai-work-school.js",
    "14-08-26_20-00-expand-ai-work-school.js",
    "14-08-26_22-45-pedagogy-v3-ai-work-school.js",
    "15-08-26_01-00-humanize-ai-work-school.js",
].map((name) => join(MIGRATION_DIRECTORY, name));
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

function runNode(script: string, args: string[], env: NodeJS.ProcessEnv = {}) {
    return spawnSync(process.execPath, [script, ...args], {
        cwd: REPO_ROOT,
        env: {
            NODE_ENV: process.env.NODE_ENV ?? "test",
            PATH: process.env.PATH,
            ...env,
        },
        encoding: "utf8",
        timeout: 30_000,
    });
}

function runMigration(
    args: string[],
    env: NodeJS.ProcessEnv = databaseEnvironment(),
) {
    return runNode(MIGRATION_PATH, args, env);
}

async function seedCurrentBaseline() {
    const db = mongoose.connection.db;
    if (!db) throw new Error("Test database is unavailable");
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

    for (const migration of PREREQUISITE_MIGRATIONS) {
        const result = runNode(migration, ["--apply"], databaseEnvironment());
        expect(result.status).toBe(0);
    }
    return { db, domainId };
}

async function snapshotCollections(db: TestDatabase) {
    const names = [
        "courses",
        "lessons",
        "pages",
        "domains",
        "userthemes",
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

function runMutatedBundle() {
    const directory = mkdtempSync(join(MIGRATION_DIRECTORY, ".test-notes-"));
    for (const name of [
        `${MIGRATION_ID}.js`,
        `${MIGRATION_ID}.course.json`,
        `${MIGRATION_ID}.media.json`,
        `${MIGRATION_ID}.site.json`,
        "15-08-26_01-00-humanize-ai-work-school.site.json",
    ]) {
        cpSync(join(MIGRATION_DIRECTORY, name), join(directory, name));
    }
    const coursePath = join(directory, `${MIGRATION_ID}.course.json`);
    const snapshot = JSON.parse(readFileSync(coursePath, "utf8"));
    snapshot.course.description = "Mutated frozen description";
    writeFileSync(coursePath, `${JSON.stringify(snapshot, null, 2)}\n`);
    try {
        return runNode(join(directory, `${MIGRATION_ID}.js`), ["--dry-run"], {
            DB_CONNECTION_STRING: "mongodb://127.0.0.1:1/not-used",
            TARGET_DOMAIN: "main",
        });
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
}

describe("Notes that do work migration", () => {
    beforeEach(async () => {
        await mongoose.connection.db?.dropDatabase();
    });

    it.each([
        { args: [] },
        { args: ["--unknown"] },
        { args: ["--dry-run", "--apply"] },
    ])("rejects invalid CLI mode %# before connecting", ({ args }) => {
        const result = runMigration(args);

        expect(result.status).toBe(64);
        expect(result.stderr).toContain(
            "Usage: add-notes-that-do-work.js --dry-run|--apply",
        );
    });

    it("pins the reviewed course, media and site bytes", () => {
        for (const key of Object.keys(FROZEN_PATHS) as Array<
            keyof typeof FROZEN_PATHS
        >) {
            expect(
                createHash("sha256")
                    .update(readFileSync(FROZEN_PATHS[key]))
                    .digest("hex"),
            ).toBe(FROZEN_HASHES[key]);
        }
        expect(
            JSON.parse(readFileSync(FROZEN_PATHS.course, "utf8")).course
                .courseId,
        ).toBe("course_notes_that_do_work_v1");
    });

    it("rejects changed frozen bytes before database access", () => {
        const result = runMutatedBundle();

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Frozen source hash is invalid");
        expect(result.stderr).not.toContain("Database connection failed");
    });

    it("dry-runs the current site with zero writes", async () => {
        const { db } = await seedCurrentBaseline();
        const before = await snapshotCollections(db);

        const result = runMigration(["--dry-run"]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain(
            "notes-course-migration mode=dry-run planned=2 applied=0",
        );
        expect(await snapshotCollections(db)).toEqual(before);
    });

    it("publishes the second free course before adding it to the homepage", async () => {
        const { db, domainId } = await seedCurrentBaseline();
        const primaryCourseBefore = await db.collection("courses").findOne({
            courseId: "course_ai_for_actual_work_v1",
        });
        const primaryLessonsBefore = await db
            .collection("lessons")
            .find({ courseId: "course_ai_for_actual_work_v1" })
            .sort({ lessonId: 1 })
            .toArray();
        const domainBefore = await db.collection("domains").findOne({
            _id: domainId,
        });
        await db.collection("users").insertOne({
            domain: domainId,
            userId: "learner_ai_work_school_v1",
            email: "learner@example.com",
            active: true,
            purchases: [{ courseId: "course_ai_for_actual_work_v1" }],
        });
        await db.collection("memberships").insertOne({
            domain: domainId,
            membershipId: "membership_ai_work_school_v1",
            entityId: "course_ai_for_actual_work_v1",
            entityType: "course",
            progress: 37,
        });
        const learnerStateBefore = {
            users: await db
                .collection("users")
                .find({ userId: "learner_ai_work_school_v1" })
                .toArray(),
            memberships: await db.collection("memberships").find({}).toArray(),
        };
        const desiredCourse = JSON.parse(
            readFileSync(FROZEN_PATHS.course, "utf8"),
        ).course;
        const desiredSite = JSON.parse(readFileSync(FROZEN_PATHS.site, "utf8"));

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain(
            "notes-course-migration mode=apply planned=2 applied=2",
        );
        const course = await db.collection("courses").findOne({
            courseId: "course_notes_that_do_work_v1",
        });
        expect(course).toMatchObject({
            title: desiredCourse.title,
            slug: desiredCourse.slug,
            published: true,
            privacy: "public",
            cost: 0,
            costType: "free",
            lessons: desiredCourse.sections.flatMap((section: any) =>
                section.lessons.map((lesson: any) => lesson.lessonId),
            ),
            featuredImage: desiredCourse.featuredImage,
        });
        const lessons = await db
            .collection("lessons")
            .find({ courseId: "course_notes_that_do_work_v1" })
            .sort({ lessonId: 1 })
            .toArray();
        expect(lessons).toHaveLength(10);
        expect(lessons.every(({ published }) => published === true)).toBe(true);
        expect(lessons[0]).toMatchObject({ requiresEnrollment: false });
        const plan = await db.collection("paymentplans").findOne({
            planId: "plan_notes_that_do_work_free_v1",
        });
        expect(plan).toMatchObject({
            type: "free",
            internal: false,
            entityId: "course_notes_that_do_work_v1",
        });
        const productPage = await db.collection("pages").findOne({
            domain: domainId,
            pageId: "notes-that-do-work",
        });
        expect(productPage).toMatchObject({
            type: "product",
            entityId: "course_notes_that_do_work_v1",
            robotsAllowed: true,
        });
        const homepage = await db.collection("pages").findOne({
            domain: domainId,
            pageId: "homepage",
        });
        expect(homepage).toMatchObject({
            layout: desiredSite.page.layout,
            draftLayout: desiredSite.page.layout,
        });
        expect(
            JSON.stringify(homepage?.layout).indexOf(
                "/course/notes-that-do-work/course_notes_that_do_work_v1",
            ),
        ).toBeGreaterThan(-1);
        expect(
            await db.collection("courses").findOne({
                courseId: "course_ai_for_actual_work_v1",
            }),
        ).toEqual(primaryCourseBefore);
        expect(
            await db
                .collection("lessons")
                .find({ courseId: "course_ai_for_actual_work_v1" })
                .sort({ lessonId: 1 })
                .toArray(),
        ).toEqual(primaryLessonsBefore);
        expect(
            await db.collection("domains").findOne({ _id: domainId }),
        ).toEqual(domainBefore);
        expect({
            users: await db
                .collection("users")
                .find({ userId: "learner_ai_work_school_v1" })
                .toArray(),
            memberships: await db.collection("memberships").find({}).toArray(),
        }).toEqual(learnerStateBefore);
    });

    it("makes a second apply byte-stable", async () => {
        const { db } = await seedCurrentBaseline();
        expect(runMigration(["--apply"]).status).toBe(0);
        const before = await snapshotCollections(db);

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("planned=0 applied=0");
        expect(await snapshotCollections(db)).toEqual(before);
    });

    it("resumes after the course is published and keeps the homepage last", async () => {
        const { db, domainId } = await seedCurrentBaseline();
        const baselineSite = JSON.parse(
            readFileSync(
                join(
                    MIGRATION_DIRECTORY,
                    "15-08-26_01-00-humanize-ai-work-school.site.json",
                ),
                "utf8",
            ),
        );

        const interrupted = runMigration(["--apply"], {
            ...databaseEnvironment(),
            NOTES_COURSE_MIGRATION_TEST_FAIL_AT: "before-homepage",
        });

        expect(interrupted.status).toBe(1);
        expect(interrupted.stderr).toContain(
            "Injected failure before homepage",
        );
        expect(
            await db.collection("courses").findOne({
                courseId: "course_notes_that_do_work_v1",
            }),
        ).toMatchObject({ published: true, privacy: "public" });
        expect(
            await db.collection("pages").findOne({
                domain: domainId,
                pageId: "homepage",
            }),
        ).toMatchObject({
            layout: baselineSite.page.layout,
            draftLayout: baselineSite.page.layout,
        });

        const resumed = runMigration(["--apply"]);

        expect(resumed.status).toBe(0);
        expect(resumed.stdout).toContain("planned=1 applied=1");
    });

    it("leaves a staged course unpublished when lesson insertion fails, then resumes", async () => {
        const { db, domainId } = await seedCurrentBaseline();
        await db.command({
            collMod: "lessons",
            validator: {
                lessonId: { $ne: "lesson_notes_that_do_work_07" },
            },
            validationLevel: "strict",
            validationAction: "error",
        });

        const interrupted = runMigration(["--apply"]);

        expect(interrupted.status).toBe(1);
        expect(
            await db.collection("courses").findOne({
                courseId: "course_notes_that_do_work_v1",
            }),
        ).toMatchObject({ published: false, privacy: "unlisted" });
        expect(
            await db.collection("pages").findOne({
                domain: domainId,
                pageId: "homepage",
            }),
        ).not.toMatchObject({
            layout: JSON.parse(readFileSync(FROZEN_PATHS.site, "utf8")).page
                .layout,
        });
        await db.command({
            collMod: "lessons",
            validator: {},
            validationLevel: "off",
        });

        const resumed = runMigration(["--apply"]);

        expect(resumed.status).toBe(0);
        expect(
            await db.collection("lessons").countDocuments({
                courseId: "course_notes_that_do_work_v1",
                published: true,
            }),
        ).toBe(10);
    });

    it.each([
        {
            label: "owner-edited homepage",
            expected: "Managed homepage has owner edits",
            mutate: (db: TestDatabase) =>
                db
                    .collection("pages")
                    .updateOne(
                        { pageId: "homepage" },
                        { $set: { "layout.1.settings.text": "Owner copy" } },
                    ),
        },
        {
            label: "lesson ID owned by another course",
            expected: "Managed lesson identity is invalid",
            mutate: (db: TestDatabase, domainId: mongoose.Types.ObjectId) =>
                db.collection("lessons").insertOne({
                    domain: domainId,
                    lessonId: "lesson_notes_that_do_work_01",
                    courseId: "owner_course",
                    title: "Owner lesson",
                }),
        },
        {
            label: "product slug collision",
            expected: "Managed product page has owner edits",
            mutate: (db: TestDatabase, domainId: mongoose.Types.ObjectId) =>
                db.collection("pages").insertOne({
                    domain: domainId,
                    pageId: "notes-that-do-work",
                    entityId: "owner_product",
                    type: "product",
                }),
        },
        {
            label: "product widget collision",
            expected: "Product widget identity is already in use",
            mutate: (db: TestDatabase, domainId: mongoose.Types.ObjectId) =>
                db.collection("pages").insertOne({
                    domain: domainId,
                    pageId: "owner-page",
                    type: "site",
                    layout: [
                        {
                            widgetId: "widget_notes_work_product_content_v1",
                            name: "rich-text",
                        },
                    ],
                }),
        },
        {
            label: "unpublished primary course",
            expected: "Primary course is not public",
            mutate: (db: TestDatabase) =>
                db
                    .collection("courses")
                    .updateOne(
                        { courseId: "course_ai_for_actual_work_v1" },
                        { $set: { published: false } },
                    ),
        },
    ])("rejects $label before writing", async (testCase) => {
        const { db, domainId } = await seedCurrentBaseline();
        await testCase.mutate(db, domainId);
        const before = await snapshotCollections(db);

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(testCase.expected);
        expect(await snapshotCollections(db)).toEqual(before);
    });

    it("rejects a constant-cardinality missing and duplicate lesson set", async () => {
        const { db } = await seedCurrentBaseline();
        expect(runMigration(["--apply"]).status).toBe(0);
        const lessonToDuplicate = await db.collection("lessons").findOne({
            lessonId: "lesson_notes_that_do_work_01",
        });
        if (!lessonToDuplicate) throw new Error("Expected managed lesson");
        await db.collection("lessons").deleteOne({
            lessonId: "lesson_notes_that_do_work_10",
        });
        const { _id: _ignored, ...duplicate } = lessonToDuplicate;
        await db.collection("lessons").insertOne(duplicate);
        expect(
            await db.collection("lessons").countDocuments({
                courseId: "course_notes_that_do_work_v1",
            }),
        ).toBe(10);
        const before = await snapshotCollections(db);

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Managed lesson identity is invalid");
        expect(await snapshotCollections(db)).toEqual(before);
    });
});
