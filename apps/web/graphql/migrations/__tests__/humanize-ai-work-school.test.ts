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
const MIGRATION_ID = "15-08-26_01-00-humanize-ai-work-school";
const MIGRATION_PATH = join(
    REPO_ROOT,
    "apps",
    "web",
    ".migrations",
    `${MIGRATION_ID}.js`,
);
const FROZEN_SITE_PATH = join(
    REPO_ROOT,
    "apps",
    "web",
    ".migrations",
    `${MIGRATION_ID}.site.json`,
);
const BASELINE_SITE_PATH = join(
    REPO_ROOT,
    "apps",
    "web",
    ".migrations",
    "14-08-26_22-45-pedagogy-v3-ai-work-school.site.json",
);
const MIGRATION_DIRECTORY = join(REPO_ROOT, "apps", "web", ".migrations");
const PREREQUISITE_MIGRATIONS = [
    "14-08-26_17-30-seed-ai-work-school.js",
    "14-08-26_20-00-expand-ai-work-school.js",
    "14-08-26_22-45-pedagogy-v3-ai-work-school.js",
].map((name) => join(REPO_ROOT, "apps", "web", ".migrations", name));
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

function runMigration(args: string[], env = databaseEnvironment()) {
    return runNode(MIGRATION_PATH, args, env);
}

async function seedPedagogyV3Baseline() {
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

function omit(document: Record<string, any>, fields: string[]) {
    const excluded = new Set(fields);
    return Object.fromEntries(
        Object.entries(document).filter(([key]) => !excluded.has(key)),
    );
}

async function protectedSnapshot(db: TestDatabase) {
    const snapshot = await snapshotCollections(db);
    return {
        ...snapshot,
        domains: snapshot.domains.map((domain) => ({
            ...omit(domain, [
                "settings",
                "sharedWidgets",
                "draftSharedWidgets",
                "updatedAt",
            ]),
            settings: omit(domain.settings ?? {}, ["subtitle"]),
            sharedWidgets: omit(domain.sharedWidgets ?? {}, [
                "header",
                "footer",
            ]),
            draftSharedWidgets: omit(domain.draftSharedWidgets ?? {}, [
                "header",
                "footer",
            ]),
        })),
        userthemes: snapshot.userthemes.map((theme) =>
            omit(theme, ["theme", "draftTheme", "updatedAt"]),
        ),
        pages: snapshot.pages.map((page) =>
            page.pageId === "homepage"
                ? omit(page, [
                      "description",
                      "draftDescription",
                      "layout",
                      "draftLayout",
                      "updatedAt",
                  ])
                : page,
        ),
    };
}

function runMutatedBundle() {
    const directory = mkdtempSync(join(MIGRATION_DIRECTORY, ".test-humanize-"));
    for (const name of [
        `${MIGRATION_ID}.js`,
        `${MIGRATION_ID}.site.json`,
        "14-08-26_17-30-seed-ai-work-school.site.json",
        "14-08-26_22-45-pedagogy-v3-ai-work-school.site.json",
    ]) {
        cpSync(join(MIGRATION_DIRECTORY, name), join(directory, name));
    }
    const sitePath = join(directory, `${MIGRATION_ID}.site.json`);
    const site = JSON.parse(readFileSync(sitePath, "utf8"));
    site.page.description = "Mutated frozen description";
    writeFileSync(sitePath, `${JSON.stringify(site, null, 4)}\n`);
    try {
        return runNode(join(directory, `${MIGRATION_ID}.js`), ["--dry-run"], {
            DB_CONNECTION_STRING: "mongodb://127.0.0.1:1/not-used",
            TARGET_DOMAIN: "main",
        });
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
}

describe("humanized AI Work School migration", () => {
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
            "Usage: humanize-ai-work-school.js --dry-run|--apply",
        );
    });

    it("freezes the exact reviewed landing snapshot", () => {
        expect(
            createHash("sha256")
                .update(readFileSync(FROZEN_SITE_PATH))
                .digest("hex"),
        ).toBe(
            "4f4893bc0368a96a8d666b6a75da2cc72c6d5ca69d7bddd38f49eafddcea90c8",
        );
    });

    it("rejects changed frozen bytes before database access", () => {
        const result = runMutatedBundle();

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Frozen source hash is invalid");
        expect(result.stderr).not.toContain("Database connection failed");
    });

    it("dry-runs the exact pedagogy-v3 baseline with zero writes", async () => {
        const { db } = await seedPedagogyV3Baseline();
        const before = await snapshotCollections(db);

        const result = runMigration(["--dry-run"]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain(
            "humanize-migration mode=dry-run planned=3 applied=0",
        );
        expect(await snapshotCollections(db)).toEqual(before);
    });

    it("applies only the reviewed site fields and preserves protected state", async () => {
        const { db, domainId } = await seedPedagogyV3Baseline();
        const extraWidget = {
            widgetId: "owner-announcement",
            name: "announcement",
            settings: { text: "Owner content" },
        };
        await db.collection("domains").updateOne(
            { _id: domainId },
            {
                $set: {
                    "settings.supportEmail": "support@example.com",
                    "sharedWidgets.announcement": extraWidget,
                    "draftSharedWidgets.announcement": extraWidget,
                },
            },
        );
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
        await db.collection("invoices").insertOne({
            domain: domainId,
            invoiceId: "invoice_ai_work_school_v1",
            membershipId: "membership_ai_work_school_v1",
            amount: 0,
        });
        await db.collection("certificates").insertOne({
            domain: domainId,
            certificateId: "certificate_ai_work_school_v1",
            courseId: "course_ai_for_actual_work_v1",
        });
        await db.collection("activities").insertOne({
            domain: domainId,
            activityId: "activity_ai_work_school_v1",
            entityId: "course_ai_for_actual_work_v1",
        });
        await db.collection("lessonevaluations").insertOne({
            domain: domainId,
            lessonId: "lesson_ai_for_actual_work_01",
            completed: true,
        });
        const beforeProtected = await protectedSnapshot(db);
        const desired = JSON.parse(readFileSync(FROZEN_SITE_PATH, "utf8"));

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain(
            "humanize-migration mode=apply planned=3 applied=3",
        );
        const domain = await db.collection("domains").findOne({
            _id: domainId,
        });
        const theme = await db.collection("userthemes").findOne({
            themeId: "theme_ai_work_school_v1",
        });
        const homepage = await db.collection("pages").findOne({
            domain: domainId,
            pageId: "homepage",
        });
        const widgets = Object.fromEntries(
            desired.sharedWidgets.map((widget: any) => [widget.name, widget]),
        );
        expect(theme).toMatchObject({
            theme: desired.theme.style,
            draftTheme: desired.theme.style,
        });
        expect(domain).toMatchObject({
            settings: {
                title: "AI Work School",
                subtitle: desired.domainScope.settingsPatch.subtitle,
                supportEmail: "support@example.com",
            },
            sharedWidgets: { ...widgets, announcement: extraWidget },
            draftSharedWidgets: { ...widgets, announcement: extraWidget },
        });
        expect(homepage).toMatchObject({
            title: desired.page.title,
            robotsAllowed: desired.page.robotsAllowed,
            draftTitle: desired.page.title,
            draftRobotsAllowed: desired.page.robotsAllowed,
            description: desired.page.description,
            draftDescription: desired.page.description,
            layout: desired.page.layout,
            draftLayout: desired.page.layout,
        });
        expect(await protectedSnapshot(db)).toEqual(beforeProtected);
    });

    it("makes a second apply a byte-stable zero-write no-op", async () => {
        const { db } = await seedPedagogyV3Baseline();
        expect(runMigration(["--apply"]).status).toBe(0);
        const before = await snapshotCollections(db);

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("planned=0 applied=0");
        expect(await snapshotCollections(db)).toEqual(before);
    });

    it("resumes after dependencies finish and keeps the homepage last", async () => {
        const { db, domainId } = await seedPedagogyV3Baseline();
        const baseline = JSON.parse(readFileSync(BASELINE_SITE_PATH, "utf8"));
        const desired = JSON.parse(readFileSync(FROZEN_SITE_PATH, "utf8"));

        const interrupted = runMigration(["--apply"], {
            ...databaseEnvironment(),
            HUMANIZE_MIGRATION_TEST_FAIL_AT: "before-homepage",
        });

        expect(interrupted.status).toBe(1);
        const homepageBeforeResume = await db.collection("pages").findOne({
            domain: domainId,
            pageId: "homepage",
        });
        const domainBeforeResume = await db.collection("domains").findOne({
            _id: domainId,
        });
        const themeBeforeResume = await db.collection("userthemes").findOne({
            themeId: "theme_ai_work_school_v1",
        });
        expect(homepageBeforeResume).toMatchObject({
            description: baseline.page.description,
            draftDescription: baseline.page.description,
            layout: baseline.page.layout,
            draftLayout: baseline.page.layout,
        });
        expect(themeBeforeResume).toMatchObject({
            theme: desired.theme.style,
            draftTheme: desired.theme.style,
        });
        expect(domainBeforeResume?.settings.subtitle).toBe(
            desired.domainScope.settingsPatch.subtitle,
        );

        const resumed = runMigration(["--apply"]);

        expect(resumed.status).toBe(0);
        expect(resumed.stdout).toContain("planned=1 applied=1");
    });

    it.each([
        {
            label: "theme",
            expected: "Managed theme has owner edits",
            mutate: (db: TestDatabase) =>
                db
                    .collection("userthemes")
                    .updateOne(
                        { themeId: "theme_ai_work_school_v1" },
                        { $set: { "theme.structure.page.width": "max-w-3xl" } },
                    ),
        },
        {
            label: "Domain subtitle",
            expected: "Managed Domain has owner edits",
            mutate: (db: TestDatabase) =>
                db
                    .collection("domains")
                    .updateOne(
                        { name: "main" },
                        { $set: { "settings.subtitle": "Owner subtitle" } },
                    ),
        },
        {
            label: "shared header",
            expected: "Managed Domain has owner edits",
            mutate: (db: TestDatabase) =>
                db.collection("domains").updateOne(
                    { name: "main" },
                    {
                        $set: {
                            "sharedWidgets.header.settings.links.0.label":
                                "Owner link",
                        },
                    },
                ),
        },
        {
            label: "homepage description",
            expected: "Managed homepage has owner edits",
            mutate: (db: TestDatabase) =>
                db
                    .collection("pages")
                    .updateOne(
                        { pageId: "homepage" },
                        { $set: { description: "Owner description" } },
                    ),
        },
        {
            label: "missing legal page",
            expected: "Legal page preflight failed",
            mutate: (db: TestDatabase) =>
                db.collection("pages").deleteOne({ pageId: "privacy" }),
        },
        {
            label: "unpublished Course",
            expected: "Managed Course identity is invalid",
            mutate: (db: TestDatabase) =>
                db
                    .collection("courses")
                    .updateOne(
                        { courseId: "course_ai_for_actual_work_v1" },
                        { $set: { published: false } },
                    ),
        },
    ])("rejects $label before writing", async (testCase) => {
        const { db } = await seedPedagogyV3Baseline();
        await testCase.mutate(db);
        const before = await snapshotCollections(db);

        const result = runMigration(["--apply"]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(testCase.expected);
        expect(await snapshotCollections(db)).toEqual(before);
    });
});
