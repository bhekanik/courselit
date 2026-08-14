/**
 * Seeds the reviewed AI-for-work course as an unpublished, resumable aggregate.
 * The launch migration publishes it only after the P2 site snapshot is integrated.
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

function buildDesiredState({ domainId, owner, course, lessons }) {
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

    return {
        course: {
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
        },
        page: {
            domain: domainId,
            pageId: course.slug,
            type: "product",
            creatorId: owner.userId,
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
        lessons: lessons.map((lesson) => ({
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
        })),
    };
}

async function preflight(db, snapshot) {
    const { course, lessons, groupIds } = validateSnapshot(snapshot);
    const domains = await db
        .collection("domains")
        .find({ name: TARGET_DOMAIN, deleted: false })
        .limit(2)
        .toArray();
    const domain = requireSingle(domains, "Target domain preflight failed");

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
    assert(
        JSON.stringify(homepage.layout ?? []).includes(DEFAULT_HOMEPAGE_MARKER),
        "Homepage is not the known default",
    );

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
        domainId: domain._id,
        owner,
        course,
        lessons,
    });
    const changes = [
        {
            collection: "courses",
            existing: existingCourse,
            desired: desired.course,
        },
        {
            collection: "pages",
            existing: existingPage,
            desired: desired.page,
        },
        {
            collection: "paymentplans",
            existing: existingPlan,
            desired: desired.plan,
        },
        ...desired.lessons.map((lesson) => ({
            collection: "lessons",
            existing: lessonsById.get(lesson.lessonId),
            desired: lesson,
        })),
    ].filter(
        ({ existing, desired: desiredDocument }) =>
            !managedFieldsMatch(existing, desiredDocument),
    );

    return { changes, desired };
}

async function applyChanges(db, changes) {
    let applied = 0;
    for (const change of changes) {
        const collection = db.collection(change.collection);
        if (change.existing) {
            const result = await collection.updateOne(
                { _id: change.existing._id },
                {
                    $set: {
                        ...change.desired,
                        ...(change.collection === "lessons"
                            ? {}
                            : { updatedAt: new Date() }),
                    },
                },
            );
            assert(
                result.matchedCount === 1,
                "Managed record changed during apply",
            );
        } else {
            const now = new Date();
            await collection.insertOne({
                ...change.desired,
                ...(change.collection === "lessons"
                    ? {}
                    : { createdAt: now, updatedAt: now }),
            });
        }
        applied += 1;
    }

    return applied;
}

async function verifyAppliedState(db, desired) {
    const course = await db
        .collection("courses")
        .findOne({ courseId: desired.course.courseId });
    const page = await db.collection("pages").findOne({
        domain: desired.page.domain,
        pageId: desired.page.pageId,
    });
    const plan = await db
        .collection("paymentplans")
        .findOne({ planId: desired.plan.planId });
    assert(
        managedFieldsMatch(course, desired.course),
        "Course verification failed",
    );
    assert(
        managedFieldsMatch(page, desired.page),
        "Product page verification failed",
    );
    assert(
        managedFieldsMatch(plan, desired.plan),
        "Payment plan verification failed",
    );

    const lessons = await db
        .collection("lessons")
        .find({ courseId: desired.course.courseId })
        .toArray();
    assert(
        lessons.length === desired.lessons.length,
        "Lesson count verification failed",
    );
    const lessonsById = new Map(
        lessons.map((lesson) => [lesson.lessonId, lesson]),
    );
    assert(
        desired.lessons.every((lesson) =>
            managedFieldsMatch(lessonsById.get(lesson.lessonId), lesson),
        ),
        "Lesson verification failed",
    );
    assert(
        course.published === false &&
            lessons.every((lesson) => lesson.published === false),
        "Publication occurred before site integration",
    );
}

async function run() {
    const mode = parseMode(process.argv.slice(2));
    const { connectionString } = readEnvironment();
    let snapshot;
    try {
        snapshot = JSON.parse(await readFile(COURSE_SNAPSHOT_URL, "utf8"));
    } catch {
        throw new SafeMigrationError("Course snapshot could not be read");
    }

    try {
        await mongoose.connect(connectionString);
    } catch {
        throw new SafeMigrationError("Database connection failed");
    }

    try {
        const db = mongoose.connection.db;
        assert(db, "Database connection failed");
        const plan = await preflight(db, snapshot);
        const applied =
            mode === "apply" ? await applyChanges(db, plan.changes) : 0;
        if (mode === "apply") {
            await verifyAppliedState(db, plan.desired);
        }
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
