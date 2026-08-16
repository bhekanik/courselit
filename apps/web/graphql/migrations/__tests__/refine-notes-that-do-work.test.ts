import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
    copyFileSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
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

function runNodeAsync(script: string, args: string[], env: NodeJS.ProcessEnv) {
    const child = spawn(process.execPath, [script, ...args], {
        cwd: REPO_ROOT,
        env,
        timeout: 30_000,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
        stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
        stderr += chunk;
    });
    return new Promise<{
        status: number | null;
        signal: NodeJS.Signals | null;
        stdout: string;
        stderr: string;
    }>((resolve, reject) => {
        child.on("error", reject);
        child.on("close", (status, signal) => {
            resolve({ status, signal, stdout, stderr });
        });
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

const HUMANIZATION_ID = "16-08-26_11-15-humanize-notes-lessons-01-02";
const HUMANIZATION_PATH = join(MIGRATION_DIRECTORY, `${HUMANIZATION_ID}.js`);
const HUMANIZATION_TRANSITION_PATH = join(
    MIGRATION_DIRECTORY,
    `${HUMANIZATION_ID}.lessons.json`,
);
const HUMANIZATION_TRANSITION_HASH =
    "9ed25656644718ca324b6f39c0feeed5542b6f646539ba93af60f83f07b4ae8d";
const CANONICAL_COURSE_PATH = join(
    REPO_ROOT,
    "content",
    "courses",
    "notes-that-do-work",
    "course.json",
);
const CANONICAL_COURSE_HASH =
    "19d5d11042afe3070e80022ad8f0b03095acf5f370ff2233ccdb2eb1c7d69981";
const SOURCE_REVIEW_COMMIT = "560e256a1df54d0f2037ae5c773a3bf2d2acb503";
// Canonical section order: pair 11/12 ships before pair 09/10.
const CANONICAL_LESSON_ORDER = [
    "lesson_notes_that_do_work_01",
    "lesson_notes_that_do_work_02",
    "lesson_notes_that_do_work_03",
    "lesson_notes_that_do_work_04",
    "lesson_notes_that_do_work_05",
    "lesson_notes_that_do_work_06",
    "lesson_notes_that_do_work_07",
    "lesson_notes_that_do_work_08",
    "lesson_notes_that_do_work_11",
    "lesson_notes_that_do_work_12",
    "lesson_notes_that_do_work_09",
    "lesson_notes_that_do_work_10",
];
const TARGET_LESSON_IDS = [
    "lesson_notes_that_do_work_01",
    "lesson_notes_that_do_work_02",
];
const UNREACHABLE_DB = "mongodb://127.0.0.1:1/humanization-should-not-connect";

function sha256File(path: string) {
    return createHash("sha256")
        .update(readFileSync(path).toString("latin1"), "latin1")
        .digest("hex");
}

function readJson(path: string) {
    return JSON.parse(readFileSync(path, "utf8"));
}

function flattenCourseLessons(snapshot: any) {
    return snapshot.course.sections.flatMap((section: any) =>
        section.lessons.map((lesson: any) => ({
            ...lesson,
            groupId: section.groupId,
        })),
    );
}

function runHumanization(args: string[], env: NodeJS.ProcessEnv = {}) {
    return runNode(HUMANIZATION_PATH, args, {
        NODE_ENV: "test",
        PATH: process.env.PATH,
        ...env,
    });
}

async function seedRefinedBaseline() {
    const seeded = await seedLaunchedBaseline();
    const refined = runNode(MIGRATION_PATH, ["--apply"], databaseEnvironment());
    expect(refined.status).toBe(0);
    return seeded;
}

async function waitForBlockedLessonUpdate(db: TestDatabase, appName: string) {
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
        const { inprog } = await db.admin().command({
            currentOp: 1,
            $all: true,
        });
        if (
            inprog.some(
                (operation: {
                    appName?: string;
                    command?: { update?: string; $truncated?: string };
                }) => {
                    const command = operation.command;
                    return (
                        operation.appName === appName &&
                        (command?.update === "lessons" ||
                            command?.$truncated?.startsWith(
                                '{ update: "lessons"',
                            ))
                    );
                },
            )
        ) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error("Timed out waiting for the blocked lesson update");
}

/**
 * Stages an editable copy of the migration and its two frozen siblings so a
 * mutated snapshot can be run through the real CLI. `repin` rewrites the
 * migration's pinned transition hash, which is the only way to reach the
 * structural checks that sit behind the byte pin.
 */
function stageMutatedTransition(
    mutate: (transition: any) => void,
    repin = false,
) {
    const directory = mkdtempSync(join(tmpdir(), "humanize-notes-"));
    // The staged copy imports mongoose exactly as the committed migration does.
    symlinkSync(
        join(REPO_ROOT, "apps", "web", "node_modules"),
        join(directory, "node_modules"),
        "dir",
    );
    const transition = readJson(HUMANIZATION_TRANSITION_PATH);
    mutate(transition);
    const bytes = `${JSON.stringify(transition, null, 4)}\n`;
    writeFileSync(join(directory, `${HUMANIZATION_ID}.lessons.json`), bytes);
    copyFileSync(
        join(MIGRATION_DIRECTORY, `${MIGRATION_ID}.course.json`),
        join(directory, `${MIGRATION_ID}.course.json`),
    );
    const script = join(directory, `${HUMANIZATION_ID}.js`);
    const source = readFileSync(HUMANIZATION_PATH, "utf8");
    writeFileSync(
        script,
        repin
            ? source.replace(
                  HUMANIZATION_TRANSITION_HASH,
                  createHash("sha256").update(bytes).digest("hex"),
              )
            : source,
    );
    return { directory, script };
}

describe("Notes lessons 01-02 humanisation migration", () => {
    beforeEach(async () => {
        await mongoose.connection.db?.dropDatabase();
    });

    it.each([
        { args: [] },
        { args: ["--unknown"] },
        { args: ["--dry-run", "--apply"] },
    ])("rejects invalid CLI mode %# before database access", ({ args }) => {
        const result = runHumanization(args);

        expect(result.status).toBe(64);
        expect(result.stderr).toContain(
            "Usage: humanize-notes-lessons-01-02.js --dry-run|--apply",
        );
    });

    it("rejects any target domain other than main before database access", () => {
        const result = runHumanization(["--dry-run"], {
            DB_CONNECTION_STRING: UNREACHABLE_DB,
            TARGET_DOMAIN: "another-school",
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Target domain is not allowlisted");
        expect(result.stderr).not.toContain("Database connection failed");
    });

    it("pins the transition bytes to the reviewed canonical course", () => {
        expect(sha256File(HUMANIZATION_TRANSITION_PATH)).toBe(
            HUMANIZATION_TRANSITION_HASH,
        );
        expect(sha256File(CANONICAL_COURSE_PATH)).toBe(CANONICAL_COURSE_HASH);

        const transition = readJson(HUMANIZATION_TRANSITION_PATH);
        const canonical = flattenCourseLessons(readJson(CANONICAL_COURSE_PATH));

        expect(transition.sourceReviewCommit).toBe(SOURCE_REVIEW_COMMIT);
        expect(transition.finalCanonicalCourseSha256).toBe(
            CANONICAL_COURSE_HASH,
        );
        expect(transition.baselineCourseSnapshot).toEqual({
            migrationId: MIGRATION_ID,
            sha256: FROZEN_HASHES.course,
        });
        expect(canonical.map(({ lessonId }: any) => lessonId)).toEqual(
            CANONICAL_LESSON_ORDER,
        );
        expect(transition.course.expectedLessonIds).toEqual(
            CANONICAL_LESSON_ORDER,
        );
        expect(transition.lessons.map(({ lessonId }: any) => lessonId)).toEqual(
            TARGET_LESSON_IDS,
        );
        for (const target of transition.lessons) {
            const lesson = canonical.find(
                ({ lessonId }: any) => lessonId === target.lessonId,
            );
            expect(target.finalContent).toEqual(lesson.content);
            expect(target.identity).toEqual({
                title: lesson.title,
                type: lesson.type,
                groupId: lesson.groupId,
                requiresEnrollment: lesson.requiresEnrollment,
                downloadable: false,
                published: lesson.published,
            });
        }
    });

    it("refuses a mutated transition snapshot before opening the database", () => {
        const { directory, script } = stageMutatedTransition((transition) => {
            transition.lessons[1].finalContent =
                transition.lessons[1].baselineContent;
        });
        try {
            const result = runNode(script, ["--apply"], {
                NODE_ENV: "test",
                PATH: process.env.PATH,
                DB_CONNECTION_STRING: UNREACHABLE_DB,
                TARGET_DOMAIN: "main",
            });

            expect(result.status).toBe(1);
            expect(result.stderr).toContain("Frozen source hash is invalid");
        } finally {
            rmSync(directory, { recursive: true, force: true });
        }
    });

    it("refuses a re-pinned snapshot whose target contents were swapped", () => {
        const { directory, script } = stageMutatedTransition((transition) => {
            const [first, second] = transition.lessons;
            [first.finalContent, second.finalContent] = [
                second.finalContent,
                first.finalContent,
            ];
        }, true);
        try {
            const result = runNode(script, ["--apply"], {
                NODE_ENV: "test",
                PATH: process.env.PATH,
                DB_CONNECTION_STRING: UNREACHABLE_DB,
                TARGET_DOMAIN: "main",
            });

            expect(result.status).toBe(1);
            expect(result.stderr).toContain(
                "Transition content hashes are invalid",
            );
        } finally {
            rmSync(directory, { recursive: true, force: true });
        }
    });

    it("keeps a non-Error failure generic and secret-safe", () => {
        const thrownSecret = "pair01-non-error-secret";
        const { directory, script } = stageMutatedTransition(() => {});
        const source = readFileSync(script, "utf8");
        const runStart =
            "async function run() {\n    const mode = parseMode(process.argv.slice(2));";
        expect(source).toContain(runStart);
        writeFileSync(
            script,
            source.replace(
                runStart,
                `async function run() {\n    throw "${thrownSecret}";\n    const mode = parseMode(process.argv.slice(2));`,
            ),
        );
        try {
            const result = runNode(script, ["--dry-run"], {
                DB_CONNECTION_STRING: UNREACHABLE_DB,
                TARGET_DOMAIN: "main",
            });

            expect(result.status).toBe(1);
            expect(result.stderr).toContain(
                "Notes humanisation migration failed unexpectedly",
            );
            expect(result.stderr).not.toContain(thrownSecret);
            expect(result.stderr).not.toContain("name=");
            expect(result.stderr).not.toContain("code=");
            expect(result.stderr).not.toContain("codeName=");
        } finally {
            rmSync(directory, { recursive: true, force: true });
        }
    });

    it("dry-runs the refined baseline twice with two planned changes and zero writes", async () => {
        const { db } = await seedRefinedBaseline();
        const before = await snapshotCollections(db);

        const first = runHumanization(["--dry-run"], databaseEnvironment());
        const second = runHumanization(["--dry-run"], databaseEnvironment());

        expect(first.status).toBe(0);
        expect(first.stdout).toContain(
            "notes-humanization-01-02-migration mode=dry-run planned=2 applied=0",
        );
        expect(second.status).toBe(0);
        expect(second.stdout).toBe(first.stdout);
        expect(await snapshotCollections(db)).toEqual(before);
    });

    it("applies the reviewed prose to both targets and no other state", async () => {
        const { db } = await seedRefinedBaseline();
        const before = await snapshotCollections(db);
        const { lessons: transition } = readJson(HUMANIZATION_TRANSITION_PATH);
        const startedAt = Date.now();

        const result = runHumanization(["--apply"], databaseEnvironment());

        expect(result.status).toBe(0);
        expect(result.stdout).toContain(
            "notes-humanization-01-02-migration mode=apply planned=2 applied=2",
        );
        const after = await snapshotCollections(db);
        for (const target of transition) {
            const find = (lessons: any[]) =>
                lessons.find(
                    ({ lessonId }: any) => lessonId === target.lessonId,
                );
            const beforeLesson = find(before.lessons);
            const afterLesson = find(after.lessons);
            expect(beforeLesson.content).toEqual(target.baselineContent);
            expect(afterLesson.content).toEqual(target.finalContent);
            expect(afterLesson.updatedAt).toBeInstanceOf(Date);
            expect(afterLesson.updatedAt.getTime()).toBeGreaterThanOrEqual(
                startedAt,
            );
            expect(omit(afterLesson, ["content", "updatedAt"])).toEqual(
                omit(beforeLesson, ["content", "updatedAt"]),
            );
        }
        const untouched = (lessons: any[]) =>
            lessons.filter(
                ({ lessonId }: any) => !TARGET_LESSON_IDS.includes(lessonId),
            );
        expect(untouched(after.lessons)).toEqual(untouched(before.lessons));
        for (const collection of [
            "courses",
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
        ]) {
            expect(after[collection]).toEqual(before[collection]);
        }
    });

    it("refuses an owner edit that lands after preflight and before the first write", async () => {
        const { db } = await seedRefinedBaseline();
        const before = await snapshotCollections(db);
        const { lessons: transition } = readJson(HUMANIZATION_TRANSITION_PATH);
        const ownerContent = {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Owner edit made while the migration was running.",
                        },
                    ],
                },
            ],
        };
        const appName = "pair01-cas-race";
        const environment = databaseEnvironment();
        if (!environment.DB_CONNECTION_STRING) {
            throw new Error("Test database connection is unavailable");
        }
        const databaseUrl = new URL(environment.DB_CONNECTION_STRING);
        databaseUrl.searchParams.set("appName", appName);
        environment.DB_CONNECTION_STRING = databaseUrl.toString();

        await db.admin().command({
            configureFailPoint: "failCommand",
            mode: { times: 1 },
            data: {
                failCommands: ["update"],
                appName,
                blockConnection: true,
                blockTimeMS: 2_000,
            },
        });
        try {
            const migration = runNodeAsync(
                HUMANIZATION_PATH,
                ["--apply"],
                environment,
            );
            await waitForBlockedLessonUpdate(db, appName);
            await db
                .collection("lessons")
                .updateOne(
                    { lessonId: "lesson_notes_that_do_work_01" },
                    { $set: { content: ownerContent } },
                );

            const result = await migration;

            expect(result.status).toBe(1);
            expect(result.signal).toBeNull();
            expect(result.stderr).toContain(
                "Managed lesson changed during apply",
            );
            expect(result.stdout).not.toContain(
                "notes-humanization-01-02-migration",
            );
            const after = await snapshotCollections(db);
            const lesson = (lessons: any[], lessonId: string) =>
                lessons.find(
                    (candidate: any) => candidate.lessonId === lessonId,
                );
            expect(
                lesson(after.lessons, "lesson_notes_that_do_work_01").content,
            ).toEqual(ownerContent);
            expect(
                lesson(after.lessons, "lesson_notes_that_do_work_02").content,
            ).toEqual(transition[1].baselineContent);
            expect(
                lesson(after.lessons, "lesson_notes_that_do_work_02"),
            ).toEqual(lesson(before.lessons, "lesson_notes_that_do_work_02"));
            expect(after).toEqual({
                ...before,
                lessons: before.lessons.map((candidate: any) =>
                    candidate.lessonId === "lesson_notes_that_do_work_01"
                        ? { ...candidate, content: ownerContent }
                        : candidate,
                ),
            });
        } finally {
            await db.admin().command({
                configureFailPoint: "failCommand",
                mode: "off",
            });
        }
    });

    it("resumes after Mongo rejects lesson 02 without rewriting lesson 01", async () => {
        const { db } = await seedRefinedBaseline();
        const { lessons: transition } = readJson(HUMANIZATION_TRANSITION_PATH);
        const databaseSecret = "pair01-validator-database-secret";
        const documentSecret = "pair01-client-document-secret";
        const contentSecret =
            "The source, the exact extract and your interpretation carry different authority.";
        expect(JSON.stringify(transition[1].baselineContent)).toContain(
            contentSecret,
        );
        await db
            .collection("lessons")
            .updateOne(
                { lessonId: "lesson_notes_that_do_work_02" },
                { $set: { privateMarker: documentSecret } },
            );
        const before = await snapshotCollections(db);
        await db.command({
            collMod: "lessons",
            validator: {
                lessonId: { $ne: "lesson_notes_that_do_work_02" },
            },
            validationLevel: "strict",
            validationAction: "error",
        });
        const validatorEnvironment = databaseEnvironment();
        if (!validatorEnvironment.DB_CONNECTION_STRING) {
            throw new Error("Test database connection is unavailable");
        }
        const validatorDatabaseUrl = new URL(
            validatorEnvironment.DB_CONNECTION_STRING,
        );
        validatorDatabaseUrl.searchParams.set("appName", databaseSecret);
        validatorEnvironment.DB_CONNECTION_STRING =
            validatorDatabaseUrl.toString();

        const interrupted = runHumanization(["--apply"], validatorEnvironment);

        expect(interrupted.status).toBe(1);
        expect(interrupted.stdout).not.toContain(
            "notes-humanization-01-02-migration",
        );
        expect(interrupted.stderr).toContain("name=MongoServerError");
        expect(interrupted.stderr).toMatch(
            /code=121\b|codeName=DocumentValidationFailure\b/,
        );
        expect(interrupted.stderr).not.toContain(databaseSecret);
        expect(interrupted.stderr).not.toContain(documentSecret);
        expect(interrupted.stderr).not.toContain(contentSecret);
        const partial = await snapshotCollections(db);
        const lesson = (lessons: any[], lessonId: string) =>
            lessons.find((candidate: any) => candidate.lessonId === lessonId);
        const lesson01 = lesson(
            partial.lessons,
            "lesson_notes_that_do_work_01",
        );
        const lesson02 = lesson(
            partial.lessons,
            "lesson_notes_that_do_work_02",
        );
        expect(lesson01.content).toEqual(transition[0].finalContent);
        expect(lesson02.content).toEqual(transition[1].baselineContent);
        expect(omit(lesson01, ["content", "updatedAt"])).toEqual(
            omit(lesson(before.lessons, "lesson_notes_that_do_work_01"), [
                "content",
                "updatedAt",
            ]),
        );
        expect(omit(lesson02, ["content", "updatedAt"])).toEqual(
            omit(lesson(before.lessons, "lesson_notes_that_do_work_02"), [
                "content",
                "updatedAt",
            ]),
        );
        expect(
            partial.lessons.filter(
                ({ lessonId }: any) => !TARGET_LESSON_IDS.includes(lessonId),
            ),
        ).toEqual(
            before.lessons.filter(
                ({ lessonId }: any) => !TARGET_LESSON_IDS.includes(lessonId),
            ),
        );
        for (const collection of Object.keys(before).filter(
            (name) => name !== "lessons",
        )) {
            expect(partial[collection]).toEqual(before[collection]);
        }
        const lesson01AfterInterruption = lesson01;
        await db.command({
            collMod: "lessons",
            validator: {},
            validationLevel: "off",
        });

        const resumed = runHumanization(["--apply"], databaseEnvironment());

        expect(resumed.status).toBe(0);
        expect(resumed.stdout).toContain(
            "notes-humanization-01-02-migration mode=apply planned=1 applied=1",
        );
        const finalLessons = await db
            .collection("lessons")
            .find({ courseId: "course_notes_that_do_work_v1" })
            .sort({ lessonId: 1 })
            .toArray();
        expect(lesson(finalLessons, "lesson_notes_that_do_work_01")).toEqual(
            lesson01AfterInterruption,
        );
        expect(
            lesson(finalLessons, "lesson_notes_that_do_work_02").content,
        ).toEqual(transition[1].finalContent);
    });

    it("makes a second apply a byte-stable zero-write no-op", async () => {
        const { db } = await seedRefinedBaseline();
        expect(runHumanization(["--apply"], databaseEnvironment()).status).toBe(
            0,
        );
        const before = await snapshotCollections(db);

        const result = runHumanization(["--apply"], databaseEnvironment());

        expect(result.status).toBe(0);
        expect(result.stdout).toContain(
            "notes-humanization-01-02-migration mode=apply planned=0 applied=0",
        );
        expect(await snapshotCollections(db)).toEqual(before);
    });

    it.each([
        {
            name: "a third content state on a target lesson",
            error: "Managed lesson has owner edits",
            mutate: (db: TestDatabase) =>
                db
                    .collection("lessons")
                    .updateOne(
                        { lessonId: "lesson_notes_that_do_work_01" },
                        { $set: { content: { type: "doc", content: [] } } },
                    ),
        },
        {
            name: "an owner-edited target title",
            error: "Target lesson identity is invalid",
            mutate: (db: TestDatabase) =>
                db
                    .collection("lessons")
                    .updateOne(
                        { lessonId: "lesson_notes_that_do_work_01" },
                        { $set: { title: "Owner title" } },
                    ),
        },
        {
            name: "a target lesson moved to another group",
            error: "Managed lesson identity is invalid",
            mutate: (db: TestDatabase) =>
                db
                    .collection("lessons")
                    .updateOne(
                        { lessonId: "lesson_notes_that_do_work_02" },
                        { $set: { groupId: "group_notes_that_do_work_02" } },
                    ),
        },
        {
            name: "a target lesson with flipped enrollment",
            error: "Target lesson identity is invalid",
            mutate: (db: TestDatabase) =>
                db
                    .collection("lessons")
                    .updateOne(
                        { lessonId: "lesson_notes_that_do_work_01" },
                        { $set: { requiresEnrollment: true } },
                    ),
        },
        {
            name: "an unpublished target lesson",
            error: "Target lesson identity is invalid",
            mutate: (db: TestDatabase) =>
                db
                    .collection("lessons")
                    .updateOne(
                        { lessonId: "lesson_notes_that_do_work_02" },
                        { $set: { published: false } },
                    ),
        },
        {
            name: "a target lesson reassigned to another creator",
            error: "Target lesson identity is invalid",
            mutate: (db: TestDatabase) =>
                db
                    .collection("lessons")
                    .updateOne(
                        { lessonId: "lesson_notes_that_do_work_01" },
                        { $set: { creatorId: "someone_else" } },
                    ),
        },
        {
            name: "a missing target lesson",
            error: "Managed lesson identity set is invalid",
            mutate: (db: TestDatabase) =>
                db
                    .collection("lessons")
                    .deleteOne({ lessonId: "lesson_notes_that_do_work_02" }),
        },
        {
            name: "a duplicated target lesson ID",
            error: "Managed lesson identity is invalid",
            mutate: (db: TestDatabase, domainId: mongoose.Types.ObjectId) =>
                db.collection("lessons").insertOne({
                    domain: domainId,
                    lessonId: "lesson_notes_that_do_work_01",
                    courseId: "course_notes_that_do_work_v1",
                    title: "Duplicate lesson",
                }),
        },
        {
            name: "a target lesson ID owned by another course",
            error: "Managed lesson identity is invalid",
            mutate: (db: TestDatabase, domainId: mongoose.Types.ObjectId) =>
                db.collection("lessons").insertOne({
                    domain: domainId,
                    lessonId: "lesson_notes_that_do_work_02",
                    courseId: "owner_course",
                    title: "Owner lesson",
                }),
        },
        {
            name: "a target lesson ID owned by another domain",
            error: "Managed lesson identity is invalid",
            mutate: (db: TestDatabase) =>
                db.collection("lessons").insertOne({
                    domain: new mongoose.Types.ObjectId(),
                    lessonId: "lesson_notes_that_do_work_01",
                    courseId: "course_notes_that_do_work_v1",
                    title: "Other school lesson",
                }),
        },
        {
            name: "a same-domain course slug collision",
            error: "Managed course preflight failed",
            mutate: (db: TestDatabase, domainId: mongoose.Types.ObjectId) =>
                db.collection("courses").insertOne({
                    domain: domainId,
                    courseId: "owner_course",
                    slug: "notes-that-do-work",
                    title: "Owner course",
                }),
        },
        {
            name: "a managed course turned private",
            error: "Managed course identity is invalid",
            mutate: (db: TestDatabase) =>
                db
                    .collection("courses")
                    .updateOne(
                        { courseId: "course_notes_that_do_work_v1" },
                        { $set: { privacy: "unlisted" } },
                    ),
        },
        {
            name: "a managed course with the wrong slug",
            error: "Managed course identity is invalid",
            mutate: (db: TestDatabase) =>
                db
                    .collection("courses")
                    .updateOne(
                        { courseId: "course_notes_that_do_work_v1" },
                        { $set: { slug: "owner-slug" } },
                    ),
        },
        {
            name: "a managed course moved to another domain",
            error: "Managed course identity is invalid",
            mutate: (db: TestDatabase) =>
                db
                    .collection("courses")
                    .updateOne(
                        { courseId: "course_notes_that_do_work_v1" },
                        { $set: { domain: new mongoose.Types.ObjectId() } },
                    ),
        },
        {
            name: "an owner-edited course group topology",
            error: "Managed course identity is invalid",
            mutate: (db: TestDatabase) =>
                db.collection("courses").updateOne(
                    { courseId: "course_notes_that_do_work_v1" },
                    {
                        $set: {
                            "groups.0.lessonsOrder": [
                                "lesson_notes_that_do_work_02",
                                "lesson_notes_that_do_work_01",
                            ],
                        },
                    },
                ),
        },
        {
            name: "a non-target lesson moved to another group",
            error: "Managed lesson identity is invalid",
            mutate: (db: TestDatabase) =>
                db
                    .collection("lessons")
                    .updateOne(
                        { lessonId: "lesson_notes_that_do_work_03" },
                        { $set: { groupId: "group_notes_that_do_work_01" } },
                    ),
        },
        {
            name: "an owner without publish permission",
            error: "Domain owner permissions are incomplete",
            mutate: (db: TestDatabase) =>
                db
                    .collection("users")
                    .updateOne(
                        { userId: "owner_ai_work_school_v1" },
                        { $set: { permissions: ["course:manage_any"] } },
                    ),
        },
        {
            name: "a domain whose owner email no longer resolves",
            error: "Domain owner preflight failed",
            mutate: (db: TestDatabase) =>
                db
                    .collection("domains")
                    .updateOne(
                        { name: "main" },
                        { $set: { email: "another-owner@example.com" } },
                    ),
        },
        {
            name: "an archived free plan",
            error: "Managed free plan is invalid",
            mutate: (db: TestDatabase) =>
                db
                    .collection("paymentplans")
                    .updateOne(
                        { planId: "plan_notes_that_do_work_free_v1" },
                        { $set: { archived: true } },
                    ),
        },
    ])("refuses $name before writing", async ({ mutate, error }) => {
        const { db, domainId } = await seedRefinedBaseline();
        await mutate(db, domainId);
        const before = await snapshotCollections(db);

        const result = runHumanization(["--apply"], databaseEnvironment());

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(error);
        expect(await snapshotCollections(db)).toEqual(before);
    });
});
