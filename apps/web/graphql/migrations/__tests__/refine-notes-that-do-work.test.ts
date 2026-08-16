import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import mongoose from "mongoose";

const REPO_ROOT = join(__dirname, "..", "..", "..", "..", "..");
const MIGRATION_ID = "16-08-26_02-15-refine-notes-that-do-work";
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
    course: "4becdb8799d9bbae6e8e22ab8848949f3aa74f08aa0d369449c451f83be90179",
    media: "1e45833e77e132bc9f75e869b7b8be2e82da3574016231a0b1de57eaa4d6f7c3",
    site: "523d29b2d6954eb4f5bf599ee51cad62a229c52b7468ecbbaebd1bb99b514d05",
};
const PREREQUISITE_MIGRATIONS = [
    "14-08-26_17-30-seed-ai-work-school.js",
    "14-08-26_20-00-expand-ai-work-school.js",
    "14-08-26_22-45-pedagogy-v3-ai-work-school.js",
    "15-08-26_01-00-humanize-ai-work-school.js",
    "16-08-26_00-40-add-notes-that-do-work.js",
].map((name) => join(MIGRATION_DIRECTORY, name));
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
            NODE_ENV: "test",
            PATH: process.env.PATH,
            ...env,
        },
        encoding: "utf8",
        timeout: 30_000,
    });
}

function runNode(script: string, args: string[], env: NodeJS.ProcessEnv) {
    return spawnSync(process.execPath, [script, ...args], {
        cwd: REPO_ROOT,
        env,
        encoding: "utf8",
        timeout: 30_000,
    });
}

async function seedLaunchedBaseline() {
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
                                            text: "This is the default page created for you by CourseLit.",
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

function omit(
    document: Record<string, any> | null | undefined,
    fields: string[],
) {
    if (!document) return document;
    const excluded = new Set(fields);
    return Object.fromEntries(
        Object.entries(document).filter(([key]) => !excluded.has(key)),
    );
}

describe("Notes that do work refinement migration", () => {
    beforeEach(async () => {
        await mongoose.connection.db?.dropDatabase();
    });

    it("pins the reviewed course, media, and site bytes", () => {
        for (const key of Object.keys(FROZEN_PATHS) as Array<
            keyof typeof FROZEN_PATHS
        >) {
            expect(
                createHash("sha256")
                    .update(
                        readFileSync(FROZEN_PATHS[key]).toString("latin1"),
                        "latin1",
                    )
                    .digest("hex"),
            ).toBe(FROZEN_HASHES[key]);
        }
    });

    it.each([
        { args: [] },
        { args: ["--unknown"] },
        { args: ["--dry-run", "--apply"] },
    ])("rejects invalid CLI mode %# before database access", ({ args }) => {
        const result = runMigration(args);

        expect(result.status).toBe(64);
        expect(result.stderr).toContain(
            "Usage: refine-notes-that-do-work.js --dry-run|--apply",
        );
    });

    it("dry-runs the exact launch baseline with zero writes", async () => {
        const { db } = await seedLaunchedBaseline();
        const before = await snapshotCollections(db);

        const result = runMigration(["--dry-run"], databaseEnvironment());

        expect(result.status).toBe(0);
        expect(result.stdout).toContain(
            "notes-refinement-migration mode=dry-run planned=7 applied=0",
        );
        expect(await snapshotCollections(db)).toEqual(before);
    });

    it("resumes after one new lesson is staged", async () => {
        const { db } = await seedLaunchedBaseline();

        const interrupted = runMigration(["--apply"], {
            ...databaseEnvironment(),
            NOTES_REFINEMENT_MIGRATION_TEST_FAIL_AT: "after-stage",
        });

        expect(interrupted.status).toBe(1);
        expect(interrupted.stderr).toContain(
            "Injected failure after lesson stage",
        );
        expect(
            await db.collection("lessons").countDocuments({
                courseId: "course_notes_that_do_work_v1",
            }),
        ).toBe(11);

        const resumed = runMigration(["--apply"], databaseEnvironment());

        expect(resumed.status).toBe(0);
        expect(
            await db.collection("lessons").countDocuments({
                courseId: "course_notes_that_do_work_v1",
                published: true,
            }),
        ).toBe(12);
    });

    it("refuses to publish a staged lesson that changed after insertion", async () => {
        const { db } = await seedLaunchedBaseline();
        const homepageBefore = await db.collection("pages").findOne({
            pageId: "homepage",
        });

        const result = runMigration(["--apply"], {
            ...databaseEnvironment(),
            NOTES_REFINEMENT_MIGRATION_TEST_FAIL_AT: "corrupt-staged-title",
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
            "Managed new lesson verification failed",
        );
        expect(
            await db
                .collection("lessons")
                .find({
                    lessonId: {
                        $in: [
                            "lesson_notes_that_do_work_11",
                            "lesson_notes_that_do_work_12",
                        ],
                    },
                })
                .project({ _id: 0, lessonId: 1, published: 1 })
                .sort({ lessonId: 1 })
                .toArray(),
        ).toEqual([
            {
                lessonId: "lesson_notes_that_do_work_11",
                published: false,
            },
            {
                lessonId: "lesson_notes_that_do_work_12",
                published: false,
            },
        ]);
        expect(
            await db.collection("pages").findOne({ pageId: "homepage" }),
        ).toEqual(homepageBefore);
    });

    it("applies only the reviewed course, lesson, and homepage fields", async () => {
        const { db, domainId } = await seedLaunchedBaseline();
        await db.collection("courses").updateOne(
            { courseId: "course_notes_that_do_work_v1" },
            {
                $set: {
                    sales: 9,
                    customers: ["learner_notes_v1"],
                    tags: ["owner-tag"],
                    certificate: true,
                    ownerField: "keep-course",
                },
            },
        );
        await db
            .collection("lessons")
            .updateOne(
                { lessonId: "lesson_notes_that_do_work_01" },
                { $set: { ownerField: "keep-lesson" } },
            );
        await db.collection("users").insertOne({
            domain: domainId,
            userId: "learner_notes_v1",
            email: "learner@example.com",
            active: true,
            purchases: [
                {
                    courseId: "course_notes_that_do_work_v1",
                    completedLessons: ["lesson_notes_that_do_work_01"],
                },
            ],
        });
        await db.collection("memberships").insertOne({
            domain: domainId,
            membershipId: "membership_notes_v1",
            entityId: "course_notes_that_do_work_v1",
            entityType: "course",
            progress: 40,
        });
        const before = await snapshotCollections(db);
        const desired = JSON.parse(readFileSync(FROZEN_PATHS.course, "utf8"));

        const result = runMigration(["--apply"], databaseEnvironment());

        expect(result.status).toBe(0);
        expect(result.stdout).toContain(
            "notes-refinement-migration mode=apply planned=7 applied=7",
        );
        const after = await snapshotCollections(db);
        const beforeCourse = before.courses.find(
            ({ courseId }: any) => courseId === "course_notes_that_do_work_v1",
        );
        const afterCourse = after.courses.find(
            ({ courseId }: any) => courseId === "course_notes_that_do_work_v1",
        );
        expect(afterCourse).toMatchObject({
            audience: desired.course.audience,
            outcome: desired.course.outcome,
            lessons: desired.course.sections.flatMap((section: any) =>
                section.lessons.map(({ lessonId }: any) => lessonId),
            ),
        });
        expect(
            omit(afterCourse, [
                "description",
                "audience",
                "outcome",
                "lessons",
                "groups",
                "updatedAt",
            ]),
        ).toEqual(
            omit(beforeCourse, [
                "description",
                "audience",
                "outcome",
                "lessons",
                "groups",
                "updatedAt",
            ]),
        );
        const beforeLesson = before.lessons.find(
            ({ lessonId }: any) => lessonId === "lesson_notes_that_do_work_01",
        );
        const afterLesson = after.lessons.find(
            ({ lessonId }: any) => lessonId === "lesson_notes_that_do_work_01",
        );
        expect(omit(afterLesson, ["content", "updatedAt"])).toEqual(
            omit(beforeLesson, ["content", "updatedAt"]),
        );
        for (const collection of [
            "domains",
            "userthemes",
            "users",
            "memberships",
            "invoices",
            "certificates",
            "activities",
            "lessonevaluations",
            "paymentplans",
        ]) {
            expect(after[collection]).toEqual(before[collection]);
        }
    });

    it("keeps the homepage baseline until the refined course verifies", async () => {
        const { db } = await seedLaunchedBaseline();
        const homepageBefore = await db.collection("pages").findOne({
            pageId: "homepage",
        });

        const interrupted = runMigration(["--apply"], {
            ...databaseEnvironment(),
            NOTES_REFINEMENT_MIGRATION_TEST_FAIL_AT: "before-homepage",
        });

        expect(interrupted.status).toBe(1);
        expect(interrupted.stderr).toContain(
            "Injected failure before homepage",
        );
        expect(
            await db.collection("pages").findOne({ pageId: "homepage" }),
        ).toEqual(homepageBefore);
        expect(
            await db.collection("courses").findOne({
                courseId: "course_notes_that_do_work_v1",
            }),
        ).toMatchObject({
            lessons: expect.arrayContaining([
                "lesson_notes_that_do_work_11",
                "lesson_notes_that_do_work_12",
            ]),
        });

        const resumed = runMigration(["--apply"], databaseEnvironment());

        expect(resumed.status).toBe(0);
        expect(resumed.stdout).toContain("planned=1 applied=1");
    });

    it("makes a second apply a byte-stable zero-write no-op", async () => {
        const { db } = await seedLaunchedBaseline();
        expect(runMigration(["--apply"], databaseEnvironment()).status).toBe(0);
        const before = await snapshotCollections(db);

        const result = runMigration(["--apply"], databaseEnvironment());

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("planned=0 applied=0");
        expect(await snapshotCollections(db)).toEqual(before);
    });

    it("rejects an owner-edited existing lesson identity before writing", async () => {
        const { db } = await seedLaunchedBaseline();
        await db
            .collection("lessons")
            .updateOne(
                { lessonId: "lesson_notes_that_do_work_05" },
                { $set: { title: "Owner title" } },
            );
        const before = await snapshotCollections(db);

        const result = runMigration(["--apply"], databaseEnvironment());

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Existing lesson identity is invalid");
        expect(await snapshotCollections(db)).toEqual(before);
    });

    it("rejects a new lesson ID owned by another course before writing", async () => {
        const { db, domainId } = await seedLaunchedBaseline();
        await db.collection("lessons").insertOne({
            domain: domainId,
            lessonId: "lesson_notes_that_do_work_11",
            courseId: "owner_course",
            title: "Owner lesson",
        });
        const before = await snapshotCollections(db);

        const result = runMigration(["--apply"], databaseEnvironment());

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Managed lesson identity is invalid");
        expect(await snapshotCollections(db)).toEqual(before);
    });

    it("rejects a same-domain course slug collision before writing", async () => {
        const { db, domainId } = await seedLaunchedBaseline();
        await db.collection("courses").insertOne({
            domain: domainId,
            courseId: "owner_course",
            slug: "notes-that-do-work",
            title: "Owner course",
        });
        const before = await snapshotCollections(db);

        const result = runMigration(["--apply"], databaseEnvironment());

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Managed course preflight failed");
        expect(await snapshotCollections(db)).toEqual(before);
    });

    it("rejects reuse of a new media ID on another page before writing", async () => {
        const { db, domainId } = await seedLaunchedBaseline();
        await db.collection("pages").insertOne({
            domain: domainId,
            pageId: "owner-page",
            type: "site",
            layout: [
                {
                    name: "image",
                    settings: {
                        src: "https://media.bhekani.com/p/tWTY3oXFnAPjVrGMn1TwTCukywazlYIVsleoV_eR/main.webp",
                    },
                },
            ],
        });
        const before = await snapshotCollections(db);

        const result = runMigration(["--apply"], databaseEnvironment());

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("New media identity is already in use");
        expect(await snapshotCollections(db)).toEqual(before);
    });
});
