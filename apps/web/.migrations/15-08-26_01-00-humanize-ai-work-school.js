/**
 * Applies the reviewed humanized AI Work School site after pedagogy v3.
 *
 * Usage: node 15-08-26_01-00-humanize-ai-work-school.js --dry-run|--apply
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import mongoose from "mongoose";

const TARGET_DOMAIN = "main";
const COURSE_ID = "course_ai_for_actual_work_v1";
const COURSE_SLUG = "ai-for-actual-work";
const PLAN_ID = "plan_ai_for_actual_work_free_v1";
const THEME_ID = "theme_ai_work_school_v1";
const MIGRATION_ID = "15-08-26_01-00-humanize-ai-work-school";
const BASELINE_ID = "14-08-26_22-45-pedagogy-v3-ai-work-school";
const EXPECTED_HASHES = {
    baselineTheme:
        "1b575590a109315cabdc34cad25925531e561fc1d5dff3bf28fd6a77736eed71",
    baseline:
        "475d47bc8a0d3ae0b6d08885cf4b88069790757baa7b06ac143c878a219efb7a",
    desired: "4f4893bc0368a96a8d666b6a75da2cc72c6d5ca69d7bddd38f49eafddcea90c8",
};
const SNAPSHOT_URLS = {
    baselineTheme: new URL(
        "./14-08-26_17-30-seed-ai-work-school.site.json",
        import.meta.url,
    ),
    baseline: new URL(`./${BASELINE_ID}.site.json`, import.meta.url),
    desired: new URL(`./${MIGRATION_ID}.site.json`, import.meta.url),
};

class SafeMigrationError extends Error {
    constructor(message, exitCode = 1) {
        super(message);
        this.exitCode = exitCode;
    }
}

function assert(condition, message) {
    if (!condition) throw new SafeMigrationError(message);
}

function parseMode(args) {
    if (args.length !== 1 || !["--dry-run", "--apply"].includes(args[0])) {
        throw new SafeMigrationError(
            "Usage: humanize-ai-work-school.js --dry-run|--apply",
            64,
        );
    }
    return args[0] === "--apply" ? "apply" : "dry-run";
}

function readEnvironment() {
    const connectionString = process.env.DB_CONNECTION_STRING;
    assert(connectionString, "Database connection is required");
    assert(
        process.env.TARGET_DOMAIN === TARGET_DOMAIN,
        "Target domain is not allowlisted",
    );
    return { connectionString };
}

function sha256(bytes) {
    return createHash("sha256").update(bytes).digest("hex");
}

async function readFrozenInputs() {
    try {
        const [baselineThemeBytes, baselineBytes, desiredBytes] =
            await Promise.all(
                Object.values(SNAPSHOT_URLS).map((url) => readFile(url)),
            );
        return {
            baselineTheme: JSON.parse(baselineThemeBytes.toString("utf8")),
            baseline: JSON.parse(baselineBytes.toString("utf8")),
            desired: JSON.parse(desiredBytes.toString("utf8")),
            sourceBytes: {
                baselineTheme: baselineThemeBytes,
                baseline: baselineBytes,
                desired: desiredBytes,
            },
        };
    } catch {
        throw new SafeMigrationError("Humanize snapshots could not be read");
    }
}

function sameId(left, right) {
    return String(left) === String(right);
}

function nonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function requireSingle(documents, message) {
    assert(documents.length === 1, message);
    return documents[0];
}

function classifyManaged(value, baseline, desired, message) {
    if (isDeepStrictEqual(value, desired)) return "final";
    if (isDeepStrictEqual(value, baseline)) return "baseline";
    throw new SafeMigrationError(message);
}

function widgetsByName(site) {
    assert(
        Array.isArray(site.sharedWidgets) && site.sharedWidgets.length === 2,
        "Shared widget snapshot is invalid",
    );
    const entries = site.sharedWidgets.map((widget) => [widget.name, widget]);
    const widgets = Object.fromEntries(entries);
    assert(
        Object.keys(widgets).length === 2 && widgets.header && widgets.footer,
        "Shared widget snapshot is invalid",
    );
    return widgets;
}

function stableSiteProjection(site) {
    const {
        domainScope,
        theme,
        sharedWidgets: _sharedWidgets,
        page,
        ...root
    } = site;
    const { settingsPatch, ...domainIdentity } = domainScope;
    const { style: _style, ...themeIdentity } = theme;
    const {
        description: _description,
        layout: _layout,
        ...pageIdentity
    } = page;
    return {
        ...root,
        domainScope: {
            ...domainIdentity,
            settingsPatch: { title: settingsPatch.title },
        },
        theme: themeIdentity,
        page: pageIdentity,
    };
}

function validateFrozenInputs(inputs) {
    assert(
        Object.entries(EXPECTED_HASHES).every(
            ([key, expected]) => sha256(inputs.sourceBytes[key]) === expected,
        ),
        "Frozen source hash is invalid",
    );
    const { baselineTheme, baseline, desired } = inputs;
    for (const site of [baseline, desired]) {
        assert(
            site?.schemaVersion === 1 &&
                site.siteKey === "ai-work-school" &&
                site.domainScope?.selector === "current-domain" &&
                site.domainScope.ownerUserIdSource === "domain-owner.userId" &&
                site.domainScope.themeId === THEME_ID &&
                site.theme?.themeId === THEME_ID &&
                site.theme.userIdSource === "domain-owner.userId" &&
                site.page?.pageId === "homepage" &&
                site.page.type === "site" &&
                site.page.entityIdSource === "domain.name" &&
                site.page.creatorIdSource === "domain-owner.userId" &&
                site.course?.courseId === COURSE_ID &&
                site.course.slug === COURSE_SLUG &&
                site.course.access === "free" &&
                site.course.href === `/course/${COURSE_SLUG}/${COURSE_ID}` &&
                site.managedMarker?.widgetId ===
                    "widget_ai_work_school_managed_v1" &&
                site.page.layout.some(
                    ({ widgetId }) =>
                        widgetId === "widget_ai_work_school_managed_v1",
                ),
            "Site snapshot identity is invalid",
        );
        assert(
            ["privacy", "terms"].every(
                (pageId) =>
                    site.requiredPages.filter(
                        (page) =>
                            page.pageId === pageId &&
                            page.href === `/p/${pageId}`,
                    ).length === 1,
            ),
            "Legal-page snapshot is invalid",
        );
        widgetsByName(site);
    }
    assert(
        baselineTheme?.schemaVersion === 1 &&
            baselineTheme.siteKey === "ai-work-school" &&
            baselineTheme.theme?.themeId === THEME_ID &&
            baselineTheme.theme.userIdSource === "domain-owner.userId",
        "Baseline theme snapshot identity is invalid",
    );
    assert(
        isDeepStrictEqual(
            stableSiteProjection(baseline),
            stableSiteProjection(desired),
        ) &&
            baseline.domainScope.settingsPatch.title ===
                desired.domainScope.settingsPatch.title &&
            baseline.page.title === desired.page.title &&
            baseline.page.robotsAllowed === desired.page.robotsAllowed,
        "Humanize snapshot changed an unowned contract",
    );
    assert(
        !isDeepStrictEqual(baselineTheme.theme.style, desired.theme.style) &&
            baseline.domainScope.settingsPatch.subtitle !==
                desired.domainScope.settingsPatch.subtitle &&
            !isDeepStrictEqual(
                widgetsByName(baseline),
                widgetsByName(desired),
            ) &&
            baseline.page.description !== desired.page.description &&
            !isDeepStrictEqual(baseline.page.layout, desired.page.layout),
        "Humanize snapshot has no managed changes",
    );
    return {
        baselineTheme: {
            theme: baselineTheme.theme.style,
            draftTheme: baselineTheme.theme.style,
        },
        desiredTheme: {
            theme: desired.theme.style,
            draftTheme: desired.theme.style,
        },
        baselineDomain: {
            subtitle: baseline.domainScope.settingsPatch.subtitle,
            widgets: widgetsByName(baseline),
        },
        desiredDomain: {
            subtitle: desired.domainScope.settingsPatch.subtitle,
            widgets: widgetsByName(desired),
        },
        baselineHomepage: {
            description: baseline.page.description,
            draftDescription: baseline.page.description,
            layout: baseline.page.layout,
            draftLayout: baseline.page.layout,
        },
        desiredHomepage: {
            description: desired.page.description,
            draftDescription: desired.page.description,
            layout: desired.page.layout,
            draftLayout: desired.page.layout,
        },
        site: desired,
    };
}

async function preflight(db, validated) {
    const domain = requireSingle(
        await db
            .collection("domains")
            .find({ name: TARGET_DOMAIN, deleted: false })
            .limit(2)
            .toArray(),
        "Target domain preflight failed",
    );
    const owner = requireSingle(
        await db
            .collection("users")
            .find({ domain: domain._id, email: domain.email, active: true })
            .limit(2)
            .toArray(),
        "Domain owner preflight failed",
    );
    assert(
        nonEmptyString(owner.userId) &&
            nonEmptyString(owner.name) &&
            ["site:manage", "setting:manage"].every((permission) =>
                owner.permissions?.includes(permission),
            ),
        "Domain owner identity is invalid",
    );

    const course = requireSingle(
        await db
            .collection("courses")
            .find({
                $or: [
                    { courseId: COURSE_ID },
                    { domain: domain._id, slug: COURSE_SLUG },
                ],
            })
            .limit(2)
            .toArray(),
        "Managed Course preflight failed",
    );
    assert(
        sameId(course.domain, domain._id) &&
            course.courseId === COURSE_ID &&
            course.slug === COURSE_SLUG &&
            course.pageId === COURSE_SLUG &&
            course.creatorId === owner.userId &&
            course.type === "course" &&
            course.published === true &&
            course.defaultPaymentPlan === PLAN_ID,
        "Managed Course identity is invalid",
    );
    const paymentPlan = requireSingle(
        await db
            .collection("paymentplans")
            .find({
                $or: [
                    { planId: PLAN_ID },
                    {
                        domain: domain._id,
                        entityId: COURSE_ID,
                        entityType: "course",
                        internal: false,
                    },
                ],
            })
            .limit(2)
            .toArray(),
        "External free plan preflight failed",
    );
    assert(
        sameId(paymentPlan.domain, domain._id) &&
            paymentPlan.planId === PLAN_ID &&
            paymentPlan.entityId === COURSE_ID &&
            paymentPlan.entityType === "course" &&
            paymentPlan.type === "free" &&
            paymentPlan.internal === false &&
            paymentPlan.archived === false &&
            paymentPlan.userId === owner.userId,
        "External free plan is invalid",
    );
    const productPage = requireSingle(
        await db
            .collection("pages")
            .find({
                domain: domain._id,
                pageId: COURSE_SLUG,
                entityId: COURSE_ID,
                type: "product",
                deleted: { $ne: true },
            })
            .limit(2)
            .toArray(),
        "Product page preflight failed",
    );
    assert(
        productPage.creatorId === owner.userId,
        "Product page identity is invalid",
    );
    for (const pageId of ["privacy", "terms"]) {
        const legalPage = requireSingle(
            await db
                .collection("pages")
                .find({
                    domain: domain._id,
                    pageId,
                    type: "site",
                    deleted: { $ne: true },
                })
                .limit(2)
                .toArray(),
            "Legal page preflight failed",
        );
        assert(
            legalPage.creatorId === owner.userId &&
                legalPage.entityId === TARGET_DOMAIN,
            "Legal page identity is invalid",
        );
    }

    const theme = requireSingle(
        await db
            .collection("userthemes")
            .find({
                $or: [
                    { themeId: THEME_ID },
                    { domain: domain._id, name: validated.site.theme.name },
                ],
            })
            .limit(2)
            .toArray(),
        "Managed theme preflight failed",
    );
    assert(
        sameId(theme.domain, domain._id) &&
            theme.themeId === THEME_ID &&
            theme.name === validated.site.theme.name &&
            theme.parentThemeId === validated.site.theme.parentThemeId &&
            theme.userId === owner.userId,
        "Managed theme identity is invalid",
    );
    const themeState = classifyManaged(
        currentThemeState(theme),
        validated.baselineTheme,
        validated.desiredTheme,
        "Managed theme has owner edits",
    );

    assert(
        domain.themeId === THEME_ID &&
            domain.lastEditedThemeId === THEME_ID &&
            domain.settings?.title ===
                validated.site.domainScope.settingsPatch.title,
        "Managed Domain identity is invalid",
    );
    const domainState = classifyManaged(
        currentDomainState(domain),
        desiredDomainState(validated, false),
        desiredDomainState(validated, true),
        "Managed Domain has owner edits",
    );

    const homepage = requireSingle(
        await db
            .collection("pages")
            .find({
                domain: domain._id,
                pageId: "homepage",
                deleted: { $ne: true },
            })
            .limit(2)
            .toArray(),
        "Homepage preflight failed",
    );
    assert(
        homepage.type === "site" &&
            homepage.entityId === TARGET_DOMAIN &&
            homepage.creatorId === owner.userId &&
            homepage.name === validated.site.page.name &&
            homepage.title === validated.site.page.title &&
            homepage.draftTitle === validated.site.page.title &&
            homepage.robotsAllowed === validated.site.page.robotsAllowed &&
            homepage.draftRobotsAllowed === validated.site.page.robotsAllowed,
        "Homepage identity is invalid",
    );
    const homepageState = classifyManaged(
        currentHomepageState(homepage),
        validated.baselineHomepage,
        validated.desiredHomepage,
        "Managed homepage has owner edits",
    );

    assert(
        domainState !== "final" || themeState === "final",
        "Final Domain has a baseline theme",
    );
    assert(
        homepageState !== "final" ||
            (themeState === "final" && domainState === "final"),
        "Final homepage has incomplete dependencies",
    );
    const changes = [
        ...(themeState === "baseline" ? [{ kind: "theme" }] : []),
        ...(domainState === "baseline" ? [{ kind: "domain" }] : []),
        ...(homepageState === "baseline" ? [{ kind: "homepage" }] : []),
    ];
    return {
        changes,
        domain,
        owner,
        course,
        paymentPlan,
        productPage,
        theme,
        homepage,
        themeState,
        domainState,
        homepageState,
        validated,
    };
}

function omitFields(document, fields) {
    const excluded = new Set(fields);
    return Object.fromEntries(
        Object.entries(document).filter(([key]) => !excluded.has(key)),
    );
}

async function readWithCursor(collection, filter) {
    const documents = [];
    for await (const document of collection.find(filter).sort({ _id: 1 })) {
        documents.push(document);
    }
    return documents;
}

async function captureProtectedState(db, plan) {
    const domain = await db
        .collection("domains")
        .findOne({ _id: plan.domain._id });
    const theme = await db
        .collection("userthemes")
        .findOne({ _id: plan.theme._id });
    const homepage = await db
        .collection("pages")
        .findOne({ _id: plan.homepage._id });
    assert(domain && theme && homepage, "Managed site disappeared");
    return {
        course: await db
            .collection("courses")
            .findOne({ _id: plan.course._id }),
        lessons: await readWithCursor(db.collection("lessons"), {
            domain: plan.domain._id,
            courseId: COURSE_ID,
        }),
        domain: {
            ...omitFields(domain, [
                "settings",
                "sharedWidgets",
                "draftSharedWidgets",
                "updatedAt",
            ]),
            settings: omitFields(domain.settings ?? {}, ["subtitle"]),
            sharedWidgets: omitFields(domain.sharedWidgets ?? {}, [
                "header",
                "footer",
            ]),
            draftSharedWidgets: omitFields(domain.draftSharedWidgets ?? {}, [
                "header",
                "footer",
            ]),
        },
        theme: omitFields(theme, ["theme", "draftTheme", "updatedAt"]),
        homepage: omitFields(homepage, [
            "description",
            "draftDescription",
            "layout",
            "draftLayout",
            "updatedAt",
        ]),
        otherPages: await readWithCursor(db.collection("pages"), {
            domain: plan.domain._id,
            _id: { $ne: plan.homepage._id },
        }),
        users: await readWithCursor(db.collection("users"), {
            domain: plan.domain._id,
        }),
        memberships: await readWithCursor(db.collection("memberships"), {
            domain: plan.domain._id,
        }),
        invoices: await readWithCursor(db.collection("invoices"), {
            domain: plan.domain._id,
        }),
        certificates: await readWithCursor(db.collection("certificates"), {
            domain: plan.domain._id,
        }),
        activities: await readWithCursor(db.collection("activities"), {
            domain: plan.domain._id,
        }),
        lessonEvaluations: await readWithCursor(
            db.collection("lessonevaluations"),
            { domain: plan.domain._id },
        ),
        paymentPlans: await readWithCursor(db.collection("paymentplans"), {
            domain: plan.domain._id,
        }),
    };
}

async function verifyProtectedState(db, plan, expected) {
    assert(
        isDeepStrictEqual(await captureProtectedState(db, plan), expected),
        "Protected state changed during apply",
    );
}

function currentThemeState(theme) {
    return { theme: theme.theme, draftTheme: theme.draftTheme };
}

function currentDomainState(domain) {
    return {
        subtitle: domain.settings?.subtitle,
        header: domain.sharedWidgets?.header,
        footer: domain.sharedWidgets?.footer,
        draftHeader: domain.draftSharedWidgets?.header,
        draftFooter: domain.draftSharedWidgets?.footer,
    };
}

function desiredDomainState(validated, desired) {
    const source = desired ? validated.desiredDomain : validated.baselineDomain;
    return {
        subtitle: source.subtitle,
        header: source.widgets.header,
        footer: source.widgets.footer,
        draftHeader: source.widgets.header,
        draftFooter: source.widgets.footer,
    };
}

function currentHomepageState(homepage) {
    return {
        description: homepage.description,
        draftDescription: homepage.draftDescription,
        layout: homepage.layout,
        draftLayout: homepage.draftLayout,
    };
}

async function updateTheme(db, plan) {
    const current = await db
        .collection("userthemes")
        .findOne({ _id: plan.theme._id });
    assert(current, "Managed theme disappeared during apply");
    if (
        isDeepStrictEqual(
            currentThemeState(current),
            plan.validated.desiredTheme,
        )
    ) {
        return;
    }
    assert(
        isDeepStrictEqual(
            currentThemeState(current),
            plan.validated.baselineTheme,
        ),
        "Managed theme changed during apply",
    );
    const result = await db.collection("userthemes").updateOne(
        {
            _id: current._id,
            theme: plan.validated.baselineTheme.theme,
            draftTheme: plan.validated.baselineTheme.draftTheme,
        },
        {
            $set: {
                ...plan.validated.desiredTheme,
                updatedAt: new Date(),
            },
        },
    );
    assert(result.matchedCount === 1, "Managed theme changed during update");
}

async function updateDomain(db, plan) {
    const current = await db
        .collection("domains")
        .findOne({ _id: plan.domain._id });
    assert(current, "Managed Domain disappeared during apply");
    const desired = desiredDomainState(plan.validated, true);
    if (isDeepStrictEqual(currentDomainState(current), desired)) return;
    const baseline = desiredDomainState(plan.validated, false);
    assert(
        isDeepStrictEqual(currentDomainState(current), baseline),
        "Managed Domain changed during apply",
    );
    const result = await db.collection("domains").updateOne(
        {
            _id: current._id,
            "settings.subtitle": baseline.subtitle,
            "sharedWidgets.header": baseline.header,
            "sharedWidgets.footer": baseline.footer,
            "draftSharedWidgets.header": baseline.draftHeader,
            "draftSharedWidgets.footer": baseline.draftFooter,
        },
        {
            $set: {
                "settings.subtitle": desired.subtitle,
                "sharedWidgets.header": desired.header,
                "sharedWidgets.footer": desired.footer,
                "draftSharedWidgets.header": desired.draftHeader,
                "draftSharedWidgets.footer": desired.draftFooter,
                updatedAt: new Date(),
            },
        },
    );
    assert(result.matchedCount === 1, "Managed Domain changed during update");
}

async function updateHomepage(db, plan) {
    const current = await db
        .collection("pages")
        .findOne({ _id: plan.homepage._id });
    assert(current, "Managed homepage disappeared during apply");
    if (
        isDeepStrictEqual(
            currentHomepageState(current),
            plan.validated.desiredHomepage,
        )
    ) {
        return;
    }
    assert(
        isDeepStrictEqual(
            currentHomepageState(current),
            plan.validated.baselineHomepage,
        ),
        "Managed homepage changed during apply",
    );
    const result = await db.collection("pages").updateOne(
        {
            _id: current._id,
            ...plan.validated.baselineHomepage,
        },
        {
            $set: {
                ...plan.validated.desiredHomepage,
                updatedAt: new Date(),
            },
        },
    );
    assert(result.matchedCount === 1, "Managed homepage changed during update");
}

async function verifyThemeAndDomain(db, plan) {
    const theme = await db
        .collection("userthemes")
        .findOne({ _id: plan.theme._id });
    const domain = await db
        .collection("domains")
        .findOne({ _id: plan.domain._id });
    assert(
        isDeepStrictEqual(
            currentThemeState(theme ?? {}),
            plan.validated.desiredTheme,
        ),
        "Theme verification failed",
    );
    assert(
        isDeepStrictEqual(
            currentDomainState(domain ?? {}),
            desiredDomainState(plan.validated, true),
        ),
        "Domain verification failed",
    );
}

async function verifyHomepage(db, plan) {
    const homepage = await db
        .collection("pages")
        .findOne({ _id: plan.homepage._id });
    assert(
        isDeepStrictEqual(
            currentHomepageState(homepage ?? {}),
            plan.validated.desiredHomepage,
        ),
        "Homepage verification failed",
    );
}

async function applyPlan(db, plan) {
    const protectedState = await captureProtectedState(db, plan);
    await updateTheme(db, plan);
    await updateDomain(db, plan);
    await verifyThemeAndDomain(db, plan);
    await verifyProtectedState(db, plan, protectedState);
    if (
        process.env.NODE_ENV === "test" &&
        process.env.HUMANIZE_MIGRATION_TEST_FAIL_AT === "before-homepage"
    ) {
        throw new Error("Injected failure before homepage");
    }
    await updateHomepage(db, plan);
    await verifyThemeAndDomain(db, plan);
    await verifyHomepage(db, plan);
    await verifyProtectedState(db, plan, protectedState);
    return plan.changes.length;
}

async function run() {
    const mode = parseMode(process.argv.slice(2));
    const { connectionString } = readEnvironment();
    const inputs = await readFrozenInputs();
    const validated = validateFrozenInputs(inputs);
    try {
        await mongoose.connect(connectionString);
    } catch {
        throw new SafeMigrationError("Database connection failed");
    }
    try {
        const db = mongoose.connection.db;
        assert(db, "Database connection failed");
        const plan = await preflight(db, validated);
        const applied = mode === "apply" ? await applyPlan(db, plan) : 0;
        console.log(
            `humanize-migration mode=${mode} planned=${plan.changes.length} applied=${applied}`,
        );
    } finally {
        await mongoose.disconnect();
    }
}

run().catch((error) => {
    if (error instanceof SafeMigrationError) {
        console.error(error.message);
        process.exitCode = error.exitCode;
        return;
    }
    console.error("Humanize migration failed unexpectedly");
    process.exitCode = 1;
});
