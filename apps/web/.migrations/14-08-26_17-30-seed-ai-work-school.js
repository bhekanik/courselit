/**
 * Seeds and publishes the reviewed AI-for-work course and school site.
 * Course references and the external free plan are verified before publication;
 * theme and homepage changes run only after the published course is verified.
 *
 * Usage: node 14-08-26_17-30-seed-ai-work-school.js --dry-run|--apply
 */
import { readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import mongoose from "mongoose";

const TARGET_DOMAIN = "main";
const MIGRATION_ID = "14-08-26_17-30-seed-ai-work-school";
const COURSE_SNAPSHOT_URL = new URL(
    `./${MIGRATION_ID}.course.json`,
    import.meta.url,
);
const SITE_SNAPSHOT_URL = new URL(
    `./${MIGRATION_ID}.site.json`,
    import.meta.url,
);
const PLAN_ID = "plan_ai_for_actual_work_free_v1";
const DEFAULT_HOMEPAGE_MARKER =
    "This is the default page created for you by CourseLit.";
const REQUIRED_PERMISSIONS = [
    "course:publish",
    "site:manage",
    "setting:manage",
];
const COURSE_MANAGEMENT_PERMISSIONS = ["course:manage", "course:manage_any"];
const PRODUCT_WIDGETS = [
    {
        widgetId: "widget_ai_work_product_header_v1",
        name: "header",
        deleteable: false,
        shared: true,
    },
    {
        widgetId: "widget_ai_work_product_banner_v1",
        name: "banner",
        deleteable: true,
        shared: false,
        settings: {},
    },
    {
        widgetId: "widget_ai_work_product_content_v1",
        name: "content",
        deleteable: true,
        shared: false,
        settings: {
            title: "Curriculum",
            headerAlignment: "center",
        },
    },
    {
        widgetId: "widget_ai_work_product_footer_v1",
        name: "footer",
        deleteable: false,
        shared: true,
    },
];
const PRODUCT_WIDGET_IDS = PRODUCT_WIDGETS.map(({ widgetId }) => widgetId);
const DEFAULT_SHARED_WIDGETS = {
    header: {
        name: "header",
        shared: true,
        deleteable: false,
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
        name: "footer",
        shared: true,
        deleteable: false,
        settings: {
            sections: [
                {
                    name: "Legal",
                    links: [
                        { label: "Terms of Use", href: "/p/terms" },
                        { label: "Privacy Policy", href: "/p/privacy" },
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
};
const SUPPORTED_SITE_WIDGETS = new Set([
    "header",
    "rich-text",
    "hero",
    "grid",
    "faq",
    "footer",
]);

class SafeMigrationError extends Error {
    constructor(message, exitCode = 1) {
        super(message);
        this.exitCode = exitCode;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new SafeMigrationError(message);
    }
}

function parseMode(args) {
    if (args.length !== 1 || !["--dry-run", "--apply"].includes(args[0])) {
        throw new SafeMigrationError(
            "Usage: seed-ai-work-school.js --dry-run|--apply",
            64,
        );
    }

    return args[0] === "--apply" ? "apply" : "dry-run";
}

function readEnvironment() {
    const connectionString = process.env.DB_CONNECTION_STRING;
    const targetDomain = process.env.TARGET_DOMAIN;

    assert(connectionString, "Database connection is required");
    assert(targetDomain === TARGET_DOMAIN, "Target domain is not allowlisted");

    return { connectionString };
}

function nonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function validateSnapshot(snapshot) {
    assert(
        snapshot && snapshot.schemaVersion === 1,
        "Course snapshot schema is invalid",
    );
    const course = snapshot.course;
    assert(course && typeof course === "object", "Course snapshot is invalid");
    assert(
        nonEmptyString(course.courseId) &&
            nonEmptyString(course.title) &&
            nonEmptyString(course.slug) &&
            nonEmptyString(course.description),
        "Course identity is invalid",
    );
    assert(course.access === "free", "Course access is invalid");
    assert(course.privacy === "public", "Course privacy is invalid");
    assert(course.published === true, "Course publication intent is invalid");
    assert(
        Array.isArray(course.sections) && course.sections.length > 0,
        "Course sections are invalid",
    );

    const groupIds = new Set();
    const lessonIds = new Set();
    const lessons = [];
    for (const section of course.sections) {
        assert(
            nonEmptyString(section.groupId) &&
                nonEmptyString(section.title) &&
                Number.isSafeInteger(section.rank) &&
                Array.isArray(section.lessons) &&
                section.lessons.length > 0,
            "Course section is invalid",
        );
        assert(
            !groupIds.has(section.groupId),
            "Course group IDs are duplicated",
        );
        groupIds.add(section.groupId);

        for (const lesson of section.lessons) {
            assert(
                nonEmptyString(lesson.lessonId) &&
                    nonEmptyString(lesson.title) &&
                    lesson.type === "text" &&
                    typeof lesson.requiresEnrollment === "boolean" &&
                    lesson.published === true &&
                    lesson.content?.type === "doc" &&
                    Array.isArray(lesson.content.content),
                "Course lesson is invalid",
            );
            assert(
                !lessonIds.has(lesson.lessonId),
                "Course lesson IDs are duplicated",
            );
            lessonIds.add(lesson.lessonId);
            lessons.push({ ...lesson, groupId: section.groupId });
        }
    }

    assert(lessons.length === 14, "Course lesson count is invalid");
    lessons.forEach((lesson, index) => {
        const serial = String(index + 1).padStart(2, "0");
        assert(
            lesson.lessonId === `lesson_ai_for_actual_work_${serial}`,
            "Course lesson IDs are not serial",
        );
    });

    return { course, lessons, groupIds: [...groupIds] };
}

function validateSiteSnapshot(snapshot, course) {
    assert(
        snapshot &&
            snapshot.schemaVersion === 1 &&
            snapshot.siteKey === "ai-work-school",
        "Site snapshot schema is invalid",
    );
    assert(
        snapshot.domainScope?.selector === "current-domain" &&
            snapshot.domainScope.ownerUserIdSource === "domain-owner.userId" &&
            snapshot.domainScope.themeId === "theme_ai_work_school_v1" &&
            nonEmptyString(snapshot.domainScope.settingsPatch?.title) &&
            nonEmptyString(snapshot.domainScope.settingsPatch?.subtitle),
        "Site domain scope is invalid",
    );
    const lessonCount = course.sections.reduce(
        (total, section) => total + section.lessons.length,
        0,
    );
    assert(
        snapshot.course?.courseId === course.courseId &&
            snapshot.course.slug === course.slug &&
            snapshot.course.access === "free" &&
            snapshot.course.sections === course.sections.length &&
            snapshot.course.lessons === lessonCount &&
            snapshot.course.href ===
                `/course/${course.slug}/${course.courseId}`,
        "Site course contract is invalid",
    );
    assert(
        Array.isArray(snapshot.requiredPages) &&
            snapshot.requiredPages.length === 2 &&
            ["privacy", "terms"].every((pageId) =>
                snapshot.requiredPages.some(
                    (page) =>
                        page.pageId === pageId && page.href === `/p/${pageId}`,
                ),
            ),
        "Site legal-page contract is invalid",
    );
    assert(
        snapshot.theme?.themeId === snapshot.domainScope.themeId &&
            nonEmptyString(snapshot.theme.name) &&
            nonEmptyString(snapshot.theme.parentThemeId) &&
            snapshot.theme.userIdSource === "domain-owner.userId" &&
            valuesEqual(snapshot.theme.applyStyleTo, ["theme", "draftTheme"]) &&
            snapshot.theme.style?.colors?.light &&
            snapshot.theme.style?.colors?.dark &&
            snapshot.theme.style?.typography &&
            snapshot.theme.style?.interactives &&
            snapshot.theme.style?.structure,
        "Site theme contract is invalid",
    );
    for (const palette of [
        snapshot.theme.style.colors.light,
        snapshot.theme.style.colors.dark,
    ]) {
        assert(
            Object.values(palette).every(
                (value) =>
                    nonEmptyString(value) && !value.includes("undefined"),
            ),
            "Site theme values are invalid",
        );
    }

    assert(
        Array.isArray(snapshot.sharedWidgets) &&
            snapshot.sharedWidgets.length === 2 &&
            snapshot.draftSharedWidgetsSource === "sharedWidgets",
        "Site shared widgets are invalid",
    );
    const sharedWidgetsByName = new Map(
        snapshot.sharedWidgets.map((widget) => [widget.name, widget]),
    );
    assert(
        sharedWidgetsByName.get("header")?.widgetId ===
            "widget_ai_work_school_header_v1" &&
            sharedWidgetsByName.get("footer")?.widgetId ===
                "widget_ai_work_school_footer_v1",
        "Site shared widget IDs are invalid",
    );

    const page = snapshot.page;
    assert(
        page?.pageId === "homepage" &&
            page.type === "site" &&
            page.entityIdSource === "domain.name" &&
            page.creatorIdSource === "domain-owner.userId" &&
            page.draftTitleSource === "page.title" &&
            page.draftDescriptionSource === "page.description" &&
            page.draftRobotsAllowedSource === "page.robotsAllowed" &&
            page.draftLayoutSource === "page.layout" &&
            nonEmptyString(page.title) &&
            nonEmptyString(page.description) &&
            page.robotsAllowed === true &&
            Array.isArray(page.layout) &&
            page.layout.length > 0,
        "Site homepage contract is invalid",
    );
    const pageWidgetIds = new Set();
    for (const widget of page.layout) {
        assert(
            nonEmptyString(widget.widgetId) &&
                SUPPORTED_SITE_WIDGETS.has(widget.name) &&
                typeof widget.deleteable === "boolean" &&
                typeof widget.shared === "boolean",
            "Site homepage widget is invalid",
        );
        assert(
            !pageWidgetIds.has(widget.widgetId),
            "Site homepage widget IDs are duplicated",
        );
        pageWidgetIds.add(widget.widgetId);
    }
    assert(
        snapshot.managedMarker?.pageId === page.pageId &&
            snapshot.managedMarker.widgetId ===
                "widget_ai_work_school_managed_v1" &&
            snapshot.managedMarker.preflight === "default-or-managed" &&
            pageWidgetIds.has(snapshot.managedMarker.widgetId),
        "Site managed marker is invalid",
    );
    assert(
        pageWidgetIds.has(sharedWidgetsByName.get("header").widgetId) &&
            pageWidgetIds.has(sharedWidgetsByName.get("footer").widgetId),
        "Site shared widget references are invalid",
    );

    return {
        site: snapshot,
        pageWidgetIds: [...pageWidgetIds],
        sharedWidgetsByName,
    };
}

function valuesEqual(left, right) {
    return isDeepStrictEqual(left, right);
}

function managedFieldsMatch(existing, desired) {
    if (!existing) {
        return false;
    }

    return Object.entries(desired).every(([key, value]) =>
        valuesEqual(existing[key], value),
    );
}

function sameObjectId(left, right) {
    return left?.toString() === right?.toString();
}

function requireSingle(documents, message) {
    assert(documents.length === 1, message);
    return documents[0];
}

function assertMatchingCourse(existing, domainId, course) {
    if (!existing) {
        return;
    }
    assert(
        sameObjectId(existing.domain, domainId) &&
            existing.courseId === course.courseId &&
            existing.title === course.title &&
            existing.slug === course.slug,
        "Managed course identity collides with existing data",
    );
}

function assertMatchingPage(existing, domainId, course) {
    if (!existing) {
        return;
    }
    assert(
        sameObjectId(existing.domain, domainId) &&
            existing.pageId === course.slug &&
            existing.entityId === course.courseId,
        "Managed product page identity collides with existing data",
    );
}

function assertMatchingPlan(existing, domainId, course) {
    if (!existing) {
        return;
    }
    assert(
        sameObjectId(existing.domain, domainId) &&
            existing.planId === PLAN_ID &&
            existing.entityId === course.courseId &&
            existing.entityType === "course" &&
            existing.internal === false,
        "Managed payment plan identity collides with existing data",
    );
}

function assertMatchingTheme(existing, domainId, site) {
    if (!existing) {
        return;
    }
    assert(
        sameObjectId(existing.domain, domainId) &&
            existing.themeId === site.theme.themeId &&
            existing.name === site.theme.name,
        "Managed theme identity collides with existing data",
    );
}

function withoutWidgetId(widget) {
    if (!widget) {
        return undefined;
    }
    const { widgetId: _widgetId, ...rest } = widget;
    return rest;
}

function isKnownDefaultSharedWidget(widget, name) {
    return valuesEqual(withoutWidgetId(widget), DEFAULT_SHARED_WIDGETS[name]);
}

function isManagedSharedWidget(widget, managedWidget) {
    return managedFieldsMatch(widget, managedWidget);
}

function assertSharedWidgetsAreSafe(domain, sharedWidgetsByName) {
    for (const source of [
        domain.sharedWidgets ?? {},
        domain.draftSharedWidgets ?? {},
    ]) {
        for (const name of ["header", "footer"]) {
            const widget = source[name];
            if (!widget) {
                continue;
            }
            assert(
                isKnownDefaultSharedWidget(widget, name) ||
                    isManagedSharedWidget(
                        widget,
                        sharedWidgetsByName.get(name),
                    ),
                "Shared site widgets contain owner edits",
            );
        }
    }
}

function buildDesiredState({
    domain,
    owner,
    course,
    lessons,
    site,
    sharedWidgetsByName,
}) {
    const domainId = domain._id;
    const lessonIds = lessons.map((lesson) => lesson.lessonId);
    const groups = course.sections.map((section) => ({
        _id: section.groupId,
        name: section.title,
        rank: section.rank,
        collapsed: false,
        lessonsOrder: section.lessons.map((lesson) => lesson.lessonId),
    }));
    const description = JSON.stringify({
        type: "doc",
        content: [
            {
                type: "paragraph",
                content: [{ type: "text", text: course.description }],
            },
        ],
    });

    const stagedCourse = {
        domain: domainId,
        courseId: course.courseId,
        title: course.title,
        slug: course.slug,
        cost: 0,
        costType: "free",
        privacy: "unlisted",
        type: "course",
        creatorId: owner.userId,
        published: false,
        tags: [],
        lessons: lessonIds,
        description,
        groups,
        sales: 0,
        customers: [],
        pageId: course.slug,
        defaultPaymentPlan: PLAN_ID,
        leadMagnet: false,
        discussions: false,
    };
    const stagedLessons = lessons.map((lesson) => ({
        domain: domainId,
        lessonId: lesson.lessonId,
        title: lesson.title,
        type: lesson.type,
        content: lesson.content,
        downloadable: false,
        creatorId: owner.userId,
        courseId: course.courseId,
        requiresEnrollment: lesson.requiresEnrollment,
        published: false,
        groupId: lesson.groupId,
    }));
    const managedSharedWidgets = Object.fromEntries(
        ["header", "footer"].map((name) => [
            name,
            sharedWidgetsByName.get(name),
        ]),
    );
    const homepageLayout = site.page.layout;

    return {
        stagedCourse,
        course: {
            ...stagedCourse,
            privacy: "public",
            published: true,
        },
        productPage: {
            domain: domainId,
            creatorId: owner.userId,
            pageId: course.slug,
            type: "product",
            name: course.title,
            entityId: course.courseId,
            deleteable: false,
            layout: PRODUCT_WIDGETS,
            draftLayout: PRODUCT_WIDGETS,
            robotsAllowed: true,
            draftRobotsAllowed: true,
            deleted: false,
        },
        plan: {
            domain: domainId,
            planId: PLAN_ID,
            name: "AI for actual work — Free",
            type: "free",
            entityId: course.courseId,
            entityType: "course",
            userId: owner.userId,
            archived: false,
            internal: false,
            includedProducts: [],
        },
        stagedLessons,
        lessons: stagedLessons.map((lesson) => ({
            ...lesson,
            published: true,
        })),
        theme: {
            domain: domainId,
            themeId: site.theme.themeId,
            name: site.theme.name,
            parentThemeId: site.theme.parentThemeId,
            userId: owner.userId,
            theme: site.theme.style,
            draftTheme: site.theme.style,
        },
        domain: {
            settings: {
                ...(domain.settings ?? {}),
                ...site.domainScope.settingsPatch,
            },
            themeId: site.theme.themeId,
            lastEditedThemeId: site.theme.themeId,
            sharedWidgets: {
                ...(domain.sharedWidgets ?? {}),
                ...managedSharedWidgets,
            },
            draftSharedWidgets: {
                ...(domain.draftSharedWidgets ?? {}),
                ...managedSharedWidgets,
            },
        },
        homepage: {
            domain: domainId,
            pageId: site.page.pageId,
            name: site.page.name,
            type: site.page.type,
            entityId: domain.name,
            creatorId: owner.userId,
            title: site.page.title,
            description: site.page.description,
            robotsAllowed: site.page.robotsAllowed,
            draftTitle: site.page.title,
            draftDescription: site.page.description,
            draftRobotsAllowed: site.page.robotsAllowed,
            layout: homepageLayout,
            draftLayout: homepageLayout,
            deleteable: false,
            deleted: false,
        },
    };
}

async function preflight(db, courseSnapshot, siteSnapshot) {
    const { course, lessons, groupIds } = validateSnapshot(courseSnapshot);
    const { site, pageWidgetIds, sharedWidgetsByName } = validateSiteSnapshot(
        siteSnapshot,
        course,
    );
    const domains = await db
        .collection("domains")
        .find({ name: TARGET_DOMAIN, deleted: false })
        .limit(2)
        .toArray();
    const domain = requireSingle(domains, "Target domain preflight failed");
    assertSharedWidgetsAreSafe(domain, sharedWidgetsByName);

    const owners = await db
        .collection("users")
        .find({
            domain: domain._id,
            email: domain.email,
            active: true,
        })
        .limit(2)
        .toArray();
    const owner = requireSingle(owners, "Domain owner preflight failed");
    assert(nonEmptyString(owner.name), "Domain owner display name is required");
    assert(nonEmptyString(owner.userId), "Domain owner ID is required");
    assert(
        Array.isArray(owner.permissions) &&
            REQUIRED_PERMISSIONS.every((permission) =>
                owner.permissions.includes(permission),
            ) &&
            COURSE_MANAGEMENT_PERMISSIONS.some((permission) =>
                owner.permissions.includes(permission),
            ),
        "Domain owner permissions are incomplete",
    );

    const homepages = await db
        .collection("pages")
        .find({
            domain: domain._id,
            pageId: "homepage",
            deleted: { $ne: true },
        })
        .limit(2)
        .toArray();
    const homepage = requireSingle(homepages, "Homepage preflight failed");
    const homepageIsDefault = JSON.stringify(homepage.layout ?? []).includes(
        DEFAULT_HOMEPAGE_MARKER,
    );
    const homepageIsManaged = (homepage.layout ?? []).some(
        (widget) => widget.widgetId === site.managedMarker.widgetId,
    );
    assert(
        homepageIsDefault || homepageIsManaged,
        "Homepage is not the known default",
    );

    for (const requiredPage of site.requiredPages) {
        const pages = await db
            .collection("pages")
            .find({
                domain: domain._id,
                pageId: requiredPage.pageId,
                deleted: { $ne: true },
            })
            .limit(2)
            .toArray();
        assert(pages.length === 1, "Required legal pages preflight failed");
    }

    const unrelatedPublishedCourses = await db
        .collection("courses")
        .countDocuments({
            domain: domain._id,
            type: "course",
            published: true,
            courseId: { $ne: course.courseId },
        });
    assert(
        unrelatedPublishedCourses === 0,
        "An unrelated published course blocks launch",
    );

    const courseMatches = await db
        .collection("courses")
        .find({
            $or: [
                { courseId: course.courseId },
                { domain: domain._id, title: course.title },
                { domain: domain._id, slug: course.slug },
            ],
        })
        .limit(2)
        .toArray();
    assert(courseMatches.length <= 1, "Managed course identity is duplicated");
    const existingCourse = courseMatches[0];
    assertMatchingCourse(existingCourse, domain._id, course);
    const existingGroupIds = new Set();
    for (const group of existingCourse?.groups ?? []) {
        assert(
            groupIds.includes(group._id),
            "Managed course contains an unknown group",
        );
        assert(
            !existingGroupIds.has(group._id),
            "Managed group identity is duplicated",
        );
        existingGroupIds.add(group._id);
    }

    const pageMatches = await db
        .collection("pages")
        .find({
            domain: domain._id,
            $or: [{ pageId: course.slug }, { entityId: course.courseId }],
        })
        .limit(2)
        .toArray();
    assert(
        pageMatches.length <= 1,
        "Managed product page identity is duplicated",
    );
    const existingPage = pageMatches[0];
    assertMatchingPage(existingPage, domain._id, course);
    for (const layout of [
        existingPage?.layout ?? [],
        existingPage?.draftLayout ?? [],
    ]) {
        const existingWidgetIds = new Set();
        for (const widget of layout) {
            assert(
                PRODUCT_WIDGET_IDS.includes(widget.widgetId),
                "Managed product page contains an unknown widget",
            );
            assert(
                !existingWidgetIds.has(widget.widgetId),
                "Managed widget identity is duplicated",
            );
            existingWidgetIds.add(widget.widgetId);
        }
    }

    const widgetCollisionPages = await db
        .collection("pages")
        .find({
            $or: [
                { "layout.widgetId": { $in: PRODUCT_WIDGET_IDS } },
                { "draftLayout.widgetId": { $in: PRODUCT_WIDGET_IDS } },
            ],
        })
        .project({ _id: 1 })
        .toArray();
    assert(
        widgetCollisionPages.every(
            (page) => existingPage && sameObjectId(page._id, existingPage._id),
        ),
        "Managed widget identity collides with existing data",
    );

    const homepageWidgetCollisionPages = await db
        .collection("pages")
        .find({
            $or: [
                { "layout.widgetId": { $in: pageWidgetIds } },
                { "draftLayout.widgetId": { $in: pageWidgetIds } },
            ],
        })
        .project({ _id: 1 })
        .toArray();
    assert(
        homepageWidgetCollisionPages.every((page) =>
            sameObjectId(page._id, homepage._id),
        ),
        "Managed homepage widget identity collides with existing data",
    );
    const sharedWidgetIds = [...sharedWidgetsByName.values()].map(
        (widget) => widget.widgetId,
    );
    const sharedWidgetCollisionDomains = await db
        .collection("domains")
        .find({
            $or: [
                { "sharedWidgets.header.widgetId": { $in: sharedWidgetIds } },
                { "sharedWidgets.footer.widgetId": { $in: sharedWidgetIds } },
                {
                    "draftSharedWidgets.header.widgetId": {
                        $in: sharedWidgetIds,
                    },
                },
                {
                    "draftSharedWidgets.footer.widgetId": {
                        $in: sharedWidgetIds,
                    },
                },
            ],
        })
        .project({ _id: 1 })
        .toArray();
    assert(
        sharedWidgetCollisionDomains.every((match) =>
            sameObjectId(match._id, domain._id),
        ),
        "Managed shared widget identity collides with existing data",
    );

    const themeMatches = await db
        .collection("userthemes")
        .find({
            $or: [
                { themeId: site.theme.themeId },
                { domain: domain._id, name: site.theme.name },
            ],
        })
        .limit(2)
        .toArray();
    assert(themeMatches.length <= 1, "Managed theme identity is duplicated");
    const existingTheme = themeMatches[0];
    assertMatchingTheme(existingTheme, domain._id, site);

    const planMatches = await db
        .collection("paymentplans")
        .find({
            $or: [
                { planId: PLAN_ID },
                {
                    domain: domain._id,
                    entityId: course.courseId,
                    entityType: "course",
                    internal: false,
                },
            ],
        })
        .limit(2)
        .toArray();
    assert(
        planMatches.length <= 1,
        "Managed payment plan identity is duplicated",
    );
    const existingPlan = planMatches[0];
    assertMatchingPlan(existingPlan, domain._id, course);

    const lessonIds = lessons.map((lesson) => lesson.lessonId);
    const lessonMatches = await db
        .collection("lessons")
        .find({
            $or: [
                { lessonId: { $in: lessonIds } },
                { domain: domain._id, courseId: course.courseId },
            ],
        })
        .toArray();
    const lessonsById = new Map();
    for (const lesson of lessonMatches) {
        assert(
            lessonIds.includes(lesson.lessonId) &&
                sameObjectId(lesson.domain, domain._id) &&
                lesson.courseId === course.courseId,
            "Managed lesson identity collides with existing data",
        );
        assert(
            !lessonsById.has(lesson.lessonId),
            "Managed lesson identity is duplicated",
        );
        lessonsById.set(lesson.lessonId, lesson);
    }

    const groupCollisions = await db
        .collection("courses")
        .find({ "groups._id": { $in: groupIds } })
        .project({ domain: 1, courseId: 1 })
        .toArray();
    assert(
        groupCollisions.every(
            (match) =>
                sameObjectId(match.domain, domain._id) &&
                match.courseId === course.courseId,
        ),
        "Managed group identity collides with existing data",
    );

    const desired = buildDesiredState({
        domain,
        owner,
        course,
        lessons,
        site,
        sharedWidgetsByName,
    });
    if (homepageIsManaged) {
        assert(
            managedFieldsMatch(homepage, desired.homepage),
            "Managed homepage has owner edits",
        );
        assert(
            managedFieldsMatch(existingTheme, desired.theme),
            "Managed theme has owner edits",
        );
        assert(
            managedFieldsMatch(domain, desired.domain),
            "Managed domain settings have owner edits",
        );
    }
    const changes = [
        {
            kind: "course",
            collection: "courses",
            existing: existingCourse,
            desired: desired.course,
        },
        {
            kind: "product-page",
            collection: "pages",
            existing: existingPage,
            desired: desired.productPage,
        },
        {
            kind: "plan",
            collection: "paymentplans",
            existing: existingPlan,
            desired: desired.plan,
        },
        ...desired.lessons.map((lesson) => ({
            kind: "lesson",
            collection: "lessons",
            existing: lessonsById.get(lesson.lessonId),
            desired: lesson,
        })),
        {
            kind: "theme",
            collection: "userthemes",
            existing: existingTheme,
            desired: desired.theme,
        },
        {
            kind: "domain",
            collection: "domains",
            existing: domain,
            desired: desired.domain,
        },
        {
            kind: "homepage",
            collection: "pages",
            existing: homepage,
            desired: desired.homepage,
        },
    ].filter(
        ({ existing, desired: desiredDocument }) =>
            !managedFieldsMatch(existing, desiredDocument),
    );

    return { changes, desired };
}

const TIMESTAMPED_COLLECTIONS = new Set([
    "courses",
    "pages",
    "paymentplans",
    "userthemes",
    "domains",
]);

async function reconcileRecord(db, collectionName, filter, desired) {
    const collection = db.collection(collectionName);
    const existing = await collection.findOne(filter);
    if (managedFieldsMatch(existing, desired)) {
        return;
    }

    const timestamps = TIMESTAMPED_COLLECTIONS.has(collectionName);
    const now = new Date();
    if (existing) {
        const result = await collection.updateOne(
            { _id: existing._id },
            {
                $set: {
                    ...desired,
                    ...(timestamps ? { updatedAt: now } : {}),
                },
            },
        );
        assert(
            result.matchedCount === 1,
            "Managed record changed during apply",
        );
        return;
    }

    await collection.insertOne({
        ...desired,
        ...(timestamps ? { createdAt: now, updatedAt: now } : {}),
    });
}

async function verifyCourseState(db, desired, published) {
    const expectedCourse = published ? desired.course : desired.stagedCourse;
    const expectedLessons = published ? desired.lessons : desired.stagedLessons;
    const course = await db
        .collection("courses")
        .findOne({ courseId: expectedCourse.courseId });
    const productPage = await db.collection("pages").findOne({
        domain: desired.productPage.domain,
        pageId: desired.productPage.pageId,
    });
    const plan = await db
        .collection("paymentplans")
        .findOne({ planId: desired.plan.planId });
    assert(
        managedFieldsMatch(course, expectedCourse),
        "Course verification failed",
    );
    assert(
        managedFieldsMatch(productPage, desired.productPage),
        "Product page verification failed",
    );
    assert(
        managedFieldsMatch(plan, desired.plan) &&
            plan.type === "free" &&
            plan.internal === false &&
            plan.archived === false,
        "External free plan verification failed",
    );

    const lessons = await db
        .collection("lessons")
        .find({ courseId: expectedCourse.courseId })
        .toArray();
    assert(
        lessons.length === expectedLessons.length,
        "Lesson count verification failed",
    );
    const lessonsById = new Map(
        lessons.map((lesson) => [lesson.lessonId, lesson]),
    );
    assert(
        expectedLessons.every((lesson) =>
            managedFieldsMatch(lessonsById.get(lesson.lessonId), lesson),
        ),
        "Lesson verification failed",
    );
    assert(
        course.published === published &&
            lessons.every((lesson) => lesson.published === published),
        "Course publication verification failed",
    );
}

async function verifySiteState(db, desired) {
    const theme = await db
        .collection("userthemes")
        .findOne({ themeId: desired.theme.themeId });
    const domain = await db
        .collection("domains")
        .findOne({ _id: desired.homepage.domain });
    const homepage = await db.collection("pages").findOne({
        domain: desired.homepage.domain,
        pageId: desired.homepage.pageId,
    });
    assert(
        managedFieldsMatch(theme, desired.theme),
        "Theme verification failed",
    );
    assert(
        managedFieldsMatch(domain, desired.domain),
        "Domain theme verification failed",
    );
    assert(
        managedFieldsMatch(homepage, desired.homepage),
        "Homepage verification failed",
    );
}

async function applyCourseAggregate(db, plan) {
    const courseKinds = new Set(["course", "product-page", "plan", "lesson"]);
    const courseNeedsChanges = plan.changes.some(({ kind }) =>
        courseKinds.has(kind),
    );
    if (!courseNeedsChanges) {
        await verifyCourseState(db, plan.desired, true);
        return;
    }

    await reconcileRecord(
        db,
        "courses",
        { courseId: plan.desired.stagedCourse.courseId },
        plan.desired.stagedCourse,
    );
    await reconcileRecord(
        db,
        "pages",
        {
            domain: plan.desired.productPage.domain,
            pageId: plan.desired.productPage.pageId,
        },
        plan.desired.productPage,
    );
    for (const lesson of plan.desired.stagedLessons) {
        await reconcileRecord(
            db,
            "lessons",
            { lessonId: lesson.lessonId },
            lesson,
        );
    }
    await reconcileRecord(
        db,
        "paymentplans",
        { planId: plan.desired.plan.planId },
        plan.desired.plan,
    );

    await verifyCourseState(db, plan.desired, false);
    for (const lesson of plan.desired.lessons) {
        await reconcileRecord(
            db,
            "lessons",
            { lessonId: lesson.lessonId },
            lesson,
        );
    }
    await reconcileRecord(
        db,
        "courses",
        { courseId: plan.desired.course.courseId },
        plan.desired.course,
    );
    await verifyCourseState(db, plan.desired, true);
}

async function applySite(db, plan) {
    await verifyCourseState(db, plan.desired, true);
    const siteKinds = new Set(["theme", "domain", "homepage"]);
    if (!plan.changes.some(({ kind }) => siteKinds.has(kind))) {
        await verifySiteState(db, plan.desired);
        return;
    }

    await reconcileRecord(
        db,
        "userthemes",
        { themeId: plan.desired.theme.themeId },
        plan.desired.theme,
    );
    await reconcileRecord(
        db,
        "domains",
        { _id: plan.desired.homepage.domain },
        plan.desired.domain,
    );
    await reconcileRecord(
        db,
        "pages",
        {
            domain: plan.desired.homepage.domain,
            pageId: plan.desired.homepage.pageId,
        },
        plan.desired.homepage,
    );
    await verifySiteState(db, plan.desired);
}

async function applyPlan(db, plan) {
    await applyCourseAggregate(db, plan);
    await applySite(db, plan);
    await verifyCourseState(db, plan.desired, true);
    await verifySiteState(db, plan.desired);
    return plan.changes.length;
}

async function run() {
    const mode = parseMode(process.argv.slice(2));
    const { connectionString } = readEnvironment();
    let courseSnapshot;
    let siteSnapshot;
    try {
        [courseSnapshot, siteSnapshot] = await Promise.all(
            [COURSE_SNAPSHOT_URL, SITE_SNAPSHOT_URL].map(async (url) =>
                JSON.parse(await readFile(url, "utf8")),
            ),
        );
    } catch {
        throw new SafeMigrationError("Launch snapshots could not be read");
    }

    try {
        await mongoose.connect(connectionString);
    } catch {
        throw new SafeMigrationError("Database connection failed");
    }

    try {
        const db = mongoose.connection.db;
        assert(db, "Database connection failed");
        const plan = await preflight(db, courseSnapshot, siteSnapshot);
        const applied = mode === "apply" ? await applyPlan(db, plan) : 0;
        console.log(
            `launch-migration mode=${mode} planned=${plan.changes.length} applied=${applied}`,
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

    console.error("Launch migration failed unexpectedly");
    process.exitCode = 1;
});
