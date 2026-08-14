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
import { isDeepStrictEqual } from "node:util";
import mongoose from "mongoose";

const REPO_ROOT = join(__dirname, "..", "..", "..", "..", "..");
const MIGRATION_ID = "14-08-26_22-45-pedagogy-v3-ai-work-school";
const MIGRATION_DIRECTORY = join(REPO_ROOT, "apps", "web", ".migrations");
const MIGRATION_PATH = join(MIGRATION_DIRECTORY, `${MIGRATION_ID}.js`);
const LAUNCH_MIGRATION_PATH = join(
    MIGRATION_DIRECTORY,
    "14-08-26_17-30-seed-ai-work-school.js",
);
const EXPAND_MIGRATION_PATH = join(
    MIGRATION_DIRECTORY,
    "14-08-26_20-00-expand-ai-work-school.js",
);
const frozenPath = (suffix: string) =>
    join(MIGRATION_DIRECTORY, `${MIGRATION_ID}.${suffix}.json`);
const COURSE_ID = "course_ai_for_actual_work_v1";
const EXPECTED_V5_DIAGRAM_MEDIA = {
    "landing-tool-selection": "YlQ52LAJHswnjuDLFP49r3UFqcWg9bCZ005kQXuV",
    "skill-package-lesson": "aZoZonTLcZIGwlV4KNLDEVKiqmoIxXiq2waYtjSx",
    "mcp-connection-lesson": "iLYyEZx2o2hLRmF4SGL6FIYnWtLGsjOuRu4PZCy5",
    "checked-workflow-lesson": "Y1CVNTysd20XWcmk-WQK7GO1oSE6IV7WHRV-BkVJ",
    "behaviour-card-comparison-lesson":
        "OyoQwlb9jhJT_UGtw4zVGPtCrSqhvRBGNlIueJlq",
    "context-router-lesson": "B_XeC0UdWLg30QBjTlinflSeTcJCMIG2UOBQ5z-Q",
    "mechanism-ladder-lesson": "4xappc5WAehv7fhmaI6gwMiWJL9rk1irNcg07Vul",
    "check-repair-lesson": "7PCPUETILaIq2CPQ_N1CLjJU781swtVnClt1ueUu",
    "decision-trace-lesson": "KIGSO650HCXX2a1K0IYQX4XGv_FkSzplX9VoV-v-",
    "closure-states-lesson": "YovnjEwdKfLiA-Qs6i2jueLjb-10k9X7xyxD14Ul",
    "work-surface-choice-lesson": "7plFDkUb_zdrXVTp8wZ5UggLQk9FO_ZDW1O_bcLY",
    "claim-argument-map-lesson": "Rbvtux50mu8VtvN-dw8fjew40UM66-vxbhM8Xogj",
    "authority-sequence-lesson": "wtDdSo9RExjLA22S1VD9b3YKhNvK9OYu1Ux65r6g",
    "capstone-loop-lesson": "5eBVQRO1s3srRhTrlGfygKW_xySd8xR4MZ6ybz58",
};
const EXPECTED_V5_SCREENSHOT_MEDIA = {
    "chatgpt-work-interface-lesson": "6ZLWTJ-6808I-0rnctAqx0KqRDWgeIT_-eRfEZve",
    "claude-cowork-interface-lesson":
        "8bZNTIFxUfOLiOBCxW2A8SLsAexVhNIJWQS72iPc",
    "microsoft-cowork-interface-lesson":
        "s1_GaaDD-xUpd3It_ehubb3QR3zS31iqj8WXu68v",
    "chatgpt-plugin-directory-lesson":
        "m0xhJnv1WtU5OvHk7JGrrt2QiwqLogWcQXOoyJr5",
};
const DEFAULT_HOMEPAGE_MARKER =
    "This is the default page created for you by CourseLit.";
type TestDatabase = NonNullable<(typeof mongoose.connection)["db"]>;

function sha256(path: string) {
    return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function flattenLessons(snapshot: any) {
    return snapshot.course.sections.flatMap(
        (section: { lessons: any[]; groupId: string }) =>
            section.lessons.map((lesson) => ({
                ...lesson,
                groupId: section.groupId,
            })),
    );
}

function desiredCourseManaged(snapshot: any) {
    return {
        lessons: flattenLessons(snapshot).map(({ lessonId }: any) => lessonId),
        groups: snapshot.course.sections.map((section: any) => ({
            _id: section.groupId,
            name: section.title,
            rank: section.rank,
            collapsed: false,
            lessonsOrder: section.lessons.map(({ lessonId }: any) => lessonId),
        })),
    };
}

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

function runMigration(args: string[], env = databaseEnvironment()) {
    return runNode(MIGRATION_PATH, args, env);
}

async function seedExpandedBaseline() {
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

    for (const migration of [LAUNCH_MIGRATION_PATH, EXPAND_MIGRATION_PATH]) {
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

function omit(document: any, fields: string[]) {
    const excluded = new Set(fields);
    return Object.fromEntries(
        Object.entries(document).filter(([key]) => !excluded.has(key)),
    );
}

function runMutatedBundle() {
    const directory = mkdtempSync(
        join(MIGRATION_DIRECTORY, ".test-pedagogy-v3-"),
    );
    for (const name of [
        `${MIGRATION_ID}.js`,
        `${MIGRATION_ID}.course.json`,
        `${MIGRATION_ID}.site.json`,
        `${MIGRATION_ID}.media.json`,
        "14-08-26_20-00-expand-ai-work-school.course.json",
        "14-08-26_20-00-expand-ai-work-school.site.json",
        "14-08-26_20-00-expand-ai-work-school.media-site.json",
    ]) {
        cpSync(join(MIGRATION_DIRECTORY, name), join(directory, name));
    }
    const coursePath = join(directory, `${MIGRATION_ID}.course.json`);
    const course = JSON.parse(readFileSync(coursePath, "utf8"));
    course.course.title = "Mutated frozen title";
    writeFileSync(coursePath, `${JSON.stringify(course, null, 4)}\n`);
    try {
        return runNode(join(directory, `${MIGRATION_ID}.js`), ["--dry-run"], {
            DB_CONNECTION_STRING: "mongodb://127.0.0.1:1/not-used",
            TARGET_DOMAIN: "main",
        });
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
}

describe("pedagogy v3 frozen inputs", () => {
    it("freezes the reviewed course, site, and MediaLit manifest", () => {
        expect(sha256(frozenPath("course"))).toBe(
            "ab5845006cab2a558789c5bb93126da168c87792a85f4b1cba325e0cbb57032b",
        );
        expect(sha256(frozenPath("site"))).toBe(
            "475d47bc8a0d3ae0b6d08885cf4b88069790757baa7b06ac143c878a219efb7a",
        );
        expect(sha256(frozenPath("media"))).toBe(
            "60036604448bba19abdf88a07c9ce7f8cb264865cee52b1f06861f9d27433a60",
        );
    });

    it("contains 21 lesson images and the exact v5 visual entries", () => {
        const course = JSON.parse(readFileSync(frozenPath("course"), "utf8"));
        const lessons = flattenLessons(course);
        const baseline = JSON.parse(
            readFileSync(
                join(
                    MIGRATION_DIRECTORY,
                    "14-08-26_20-00-expand-ai-work-school.course.json",
                ),
                "utf8",
            ),
        );
        const oldIds = new Set(
            flattenLessons(baseline)
                .flatMap((lesson: any) => lesson.content.content)
                .filter((node: any) => node.type === "image")
                .map((node: any) => node.attrs.src.match(/\/p\/([^/]+)/)?.[1]),
        );
        const imageIds = lessons
            .flatMap((lesson: any) => lesson.content.content)
            .filter((node: any) => node.type === "image")
            .map((node: any) => node.attrs.src.match(/\/p\/([^/]+)/)?.[1]);
        const media = JSON.parse(readFileSync(frozenPath("media"), "utf8"));
        const newIds = imageIds.filter((id: string) => !oldIds.has(id));

        expect(lessons).toHaveLength(22);
        expect(imageIds).toHaveLength(21);
        expect(newIds).toHaveLength(17);
        expect(media.group).toBe("ai-work-school-v5");
        expect(media.entries).toHaveLength(25);
        expect(
            new Set(media.entries.map(({ sourcePath }: any) => sourcePath))
                .size,
        ).toBe(23);
        expect(
            Object.fromEntries(
                media.entries
                    .filter(({ key }: any) =>
                        Object.hasOwn(EXPECTED_V5_DIAGRAM_MEDIA, key),
                    )
                    .map(({ key, media: { mediaId } }: any) => [key, mediaId]),
            ),
        ).toEqual(EXPECTED_V5_DIAGRAM_MEDIA);
        expect(
            Object.fromEntries(
                media.entries
                    .filter(({ key }: any) =>
                        Object.hasOwn(EXPECTED_V5_SCREENSHOT_MEDIA, key),
                    )
                    .map(({ key, media: { mediaId } }: any) => [key, mediaId]),
            ),
        ).toEqual(EXPECTED_V5_SCREENSHOT_MEDIA);
    });

    it("rejects changed frozen bytes before database access", () => {
        const result = runMutatedBundle();

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Frozen source hash is invalid");
        expect(result.stderr).not.toContain("Database connection failed");
    });
});

describe("pedagogy v3 production migration", () => {
    beforeEach(async () => {
        await mongoose.connection.db?.dropDatabase();
    });

    it.each([
        { args: [] },
        { args: ["--unknown"] },
        { args: ["--dry-run", "--apply"] },
    ])("rejects invalid CLI mode %# before connecting", ({ args }) => {
        const result = runNode(MIGRATION_PATH, args);

        expect(result.status).toBe(64);
        expect(result.stderr).toContain(
            "Usage: pedagogy-v3-ai-work-school.js --dry-run|--apply",
        );
    });

    it("dry-runs the exact expanded baseline with zero writes", async () => {
        const { db } = await seedExpandedBaseline();
        const before = await snapshotCollections(db);

        const result = runMigration(["--dry-run"]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain(
            "pedagogy-v3-migration mode=dry-run planned=24 applied=0",
        );
        expect(await snapshotCollections(db)).toEqual(before);
    });

    it("updates only lesson content, Course topology, and homepage layouts", async () => {
        const { db, domainId } = await seedExpandedBaseline();
        await db.collection("courses").updateOne(
            { courseId: COURSE_ID },
            {
                $set: {
                    sales: 17,
                    customers: ["learner_ai_work_school_v3"],
                    tags: ["owner-tag"],
                    certificate: true,
                    published: false,
                    privacy: "unlisted",
                },
            },
        );
        await db
            .collection("lessons")
            .updateOne(
                { lessonId: "lesson_ai_for_actual_work_01" },
                { $set: { published: false, ownerField: "keep" } },
            );
        await db
            .collection("pages")
            .updateOne(
                { pageId: "homepage" },
                { $set: { ownerField: "keep-homepage" } },
            );
        await db.collection("users").insertOne({
            domain: domainId,
            userId: "learner_ai_work_school_v3",
            email: "learner@example.com",
            active: true,
            purchases: [
                {
                    courseId: COURSE_ID,
                    completedLessons: ["lesson_ai_for_actual_work_01"],
                },
            ],
        });
        await db.collection("memberships").insertOne({
            domain: domainId,
            membershipId: "membership_ai_work_school_v3",
            userId: "learner_ai_work_school_v3",
            entityId: COURSE_ID,
            entityType: "course",
            status: "active",
        });
        const before = await snapshotCollections(db);
        const beforeCourse = before.courses[0];
        const beforeLessons = before.lessons;
        const beforeHomepage = before.pages.find(
            ({ pageId }: any) => pageId === "homepage",
        );
        const desiredCourse = JSON.parse(
            readFileSync(frozenPath("course"), "utf8"),
        );
        const desiredSite = JSON.parse(
            readFileSync(frozenPath("site"), "utf8"),
        );

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain(
            "pedagogy-v3-migration mode=apply planned=24 applied=24",
        );
        const after = await snapshotCollections(db);
        const afterCourse = after.courses[0];
        const afterLessons = after.lessons;
        const afterHomepage = after.pages.find(
            ({ pageId }: any) => pageId === "homepage",
        );
        expect(omit(afterCourse, ["lessons", "groups"])).toEqual(
            omit(beforeCourse, ["lessons", "groups"]),
        );
        expect(afterCourse).toMatchObject(desiredCourseManaged(desiredCourse));
        expect(afterLessons.map(({ _id }: any) => _id)).toEqual(
            beforeLessons.map(({ _id }: any) => _id),
        );
        expect(afterLessons.map(({ published }: any) => published)).toEqual(
            beforeLessons.map(({ published }: any) => published),
        );
        const desiredLessons = new Map(
            flattenLessons(desiredCourse).map((lesson: any) => [
                lesson.lessonId,
                lesson,
            ]),
        );
        for (const lesson of afterLessons) {
            expect(lesson.content).toEqual(
                desiredLessons.get(lesson.lessonId).content,
            );
            expect(omit(lesson, ["content"])).toEqual(
                omit(
                    beforeLessons.find(
                        ({ lessonId }: any) => lessonId === lesson.lessonId,
                    ),
                    ["content"],
                ),
            );
        }
        expect(omit(afterHomepage, ["layout", "draftLayout"])).toEqual(
            omit(beforeHomepage, ["layout", "draftLayout"]),
        );
        expect(afterHomepage.layout).toEqual(desiredSite.page.layout);
        expect(afterHomepage.draftLayout).toEqual(desiredSite.page.layout);
        for (const name of [
            "domains",
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
    });

    it("accepts mixed old-or-final fields and converges", async () => {
        const { db } = await seedExpandedBaseline();
        const courseSnapshot = JSON.parse(
            readFileSync(frozenPath("course"), "utf8"),
        );
        const siteSnapshot = JSON.parse(
            readFileSync(frozenPath("site"), "utf8"),
        );
        const desired = desiredCourseManaged(courseSnapshot);
        const desiredLessons = flattenLessons(courseSnapshot);
        for (const lesson of desiredLessons.slice(0, 11)) {
            await db
                .collection("lessons")
                .updateOne(
                    { lessonId: lesson.lessonId },
                    { $set: { content: lesson.content } },
                );
        }
        await db
            .collection("courses")
            .updateOne(
                { courseId: COURSE_ID },
                { $set: { lessons: desired.lessons } },
            );
        await db
            .collection("pages")
            .updateOne(
                { pageId: "homepage" },
                { $set: { layout: siteSnapshot.page.layout } },
            );

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("planned=13 applied=13");
        expect(
            await db.collection("courses").findOne({ courseId: COURSE_ID }),
        ).toMatchObject(desired);
        expect(
            await db.collection("pages").findOne({ pageId: "homepage" }),
        ).toMatchObject({
            layout: siteSnapshot.page.layout,
            draftLayout: siteSnapshot.page.layout,
        });
    });

    it("keeps the homepage baseline until every course write verifies", async () => {
        const { db } = await seedExpandedBaseline();
        const homepageBefore = await db
            .collection("pages")
            .findOne({ pageId: "homepage" });

        const interrupted = runMigration(["--apply"], {
            ...databaseEnvironment(),
            PEDAGOGY_V3_TEST_FAIL_AT: "before-homepage",
        });

        expect(interrupted.status).toBe(1);
        expect(
            await db.collection("pages").findOne({ pageId: "homepage" }),
        ).toEqual(homepageBefore);
        const desiredCourse = JSON.parse(
            readFileSync(frozenPath("course"), "utf8"),
        );
        const desiredLessons = new Map(
            flattenLessons(desiredCourse).map((lesson: any) => [
                lesson.lessonId,
                lesson.content,
            ]),
        );
        const lessons = await db
            .collection("lessons")
            .find({ courseId: COURSE_ID })
            .toArray();
        expect(
            lessons.every((lesson) =>
                isDeepStrictEqual(
                    lesson.content,
                    desiredLessons.get(lesson.lessonId),
                ),
            ),
        ).toBe(true);
        expect(
            await db.collection("courses").findOne({ courseId: COURSE_ID }),
        ).toMatchObject(desiredCourseManaged(desiredCourse));

        const resumed = runMigration(["--apply"]);
        expect(resumed.status).toBe(0);
        expect(resumed.stdout).toContain("planned=1 applied=1");
    });

    it("makes a second apply a byte-stable zero-write no-op", async () => {
        const { db } = await seedExpandedBaseline();
        expect(runMigration(["--apply"]).status).toBe(0);
        const before = await snapshotCollections(db);

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("planned=0 applied=0");
        expect(await snapshotCollections(db)).toEqual(before);
    });

    it("rejects a same-domain duplicate that hides a missing lesson", async () => {
        const { db, domainId } = await seedExpandedBaseline();
        const duplicateSource = await db.collection("lessons").findOne({
            domain: domainId,
            courseId: COURSE_ID,
            lessonId: "lesson_ai_for_actual_work_01",
        });
        if (!duplicateSource) {
            throw new Error("Expanded lesson fixture is missing");
        }
        await db.collection("lessons").deleteOne({
            domain: domainId,
            courseId: COURSE_ID,
            lessonId: "lesson_ai_for_actual_work_22",
        });
        await db.collection("lessons").insertOne({
            ...duplicateSource,
            _id: new mongoose.Types.ObjectId(),
        });
        expect(
            await db.collection("lessons").countDocuments({
                domain: domainId,
                courseId: COURSE_ID,
            }),
        ).toBe(22);
        const before = await snapshotCollections(db);

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Managed lesson set is invalid");
        expect(await snapshotCollections(db)).toEqual(before);
    });

    it.each([
        {
            label: "lesson content",
            expected: "Managed lesson has owner edits",
            mutate: (db: TestDatabase) =>
                db
                    .collection("lessons")
                    .updateOne(
                        { lessonId: "lesson_ai_for_actual_work_09" },
                        { $set: { content: { type: "doc", content: [] } } },
                    ),
        },
        {
            label: "Course groups",
            expected: "Managed Course has owner edits",
            mutate: (db: TestDatabase) =>
                db
                    .collection("courses")
                    .updateOne(
                        { courseId: COURSE_ID },
                        { $set: { "groups.0.name": "Owner group" } },
                    ),
        },
        {
            label: "homepage layout",
            expected: "Managed homepage has owner edits",
            mutate: (db: TestDatabase) =>
                db
                    .collection("pages")
                    .updateOne(
                        { pageId: "homepage" },
                        { $push: { layout: { name: "owner-block" } } },
                    ),
        },
        {
            label: "stable lesson ID collision",
            expected: "Managed lesson identity collides with existing data",
            mutate: (db: TestDatabase) =>
                db.collection("lessons").insertOne({
                    domain: new mongoose.Types.ObjectId(),
                    courseId: "another_course",
                    lessonId: "lesson_ai_for_actual_work_09",
                    title: "Collision",
                    type: "text",
                    creatorId: "another_owner",
                    groupId: "another_group",
                    content: { type: "doc", content: [] },
                }),
        },
    ])("rejects non-baseline $label before writing", async (testCase) => {
        const { db } = await seedExpandedBaseline();
        await testCase.mutate(db);
        const before = await snapshotCollections(db);

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(testCase.expected);
        expect(await snapshotCollections(db)).toEqual(before);
    });

    it("never prints credentials or stored lesson content", () => {
        const secret =
            "mongodb://user:password@127.0.0.1:1/production?serverSelectionTimeoutMS=100";
        const result = runNode(MIGRATION_PATH, ["--dry-run"], {
            DB_CONNECTION_STRING: secret,
            TARGET_DOMAIN: "main",
        });

        expect(result.status).toBe(1);
        expect(`${result.stdout}${result.stderr}`).not.toContain(secret);
        expect(`${result.stdout}${result.stderr}`).not.toContain(
            "Predict before you delegate",
        );
    });
});
