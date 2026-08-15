/**
 * Adds the reviewed Notes that do work course and then updates the homepage.
 *
 * Usage: node 16-08-26_00-40-add-notes-that-do-work.js --dry-run|--apply
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import mongoose from "mongoose";

const TARGET_DOMAIN = "main";
const MIGRATION_ID = "16-08-26_00-40-add-notes-that-do-work";
const BASELINE_SITE_ID = "15-08-26_01-00-humanize-ai-work-school";
const COURSE_ID = "course_notes_that_do_work_v1";
const COURSE_SLUG = "notes-that-do-work";
const PLAN_ID = "plan_notes_that_do_work_free_v1";
const PRIMARY_COURSE_ID = "course_ai_for_actual_work_v1";
const PRIMARY_PLAN_ID = "plan_ai_for_actual_work_free_v1";
const EXPECTED_HASHES = {
    course: "4835a2b0bcba46bde66f47d81e338bc4ceabb7f980b561b381ec052fa803d637",
    media: "5435797ff68a44c8639d7da4670e70580e08b388a309339a6e1c0d12cabeadcb",
    baselineSite:
        "4f4893bc0368a96a8d666b6a75da2cc72c6d5ca69d7bddd38f49eafddcea90c8",
    desiredSite:
        "ef71d8f2f12b51c488770edaf47046980bf9dae3849816f8bbefde3037d2b50f",
};
const SNAPSHOT_URLS = {
    course: new URL(`./${MIGRATION_ID}.course.json`, import.meta.url),
    media: new URL(`./${MIGRATION_ID}.media.json`, import.meta.url),
    baselineSite: new URL(`./${BASELINE_SITE_ID}.site.json`, import.meta.url),
    desiredSite: new URL(`./${MIGRATION_ID}.site.json`, import.meta.url),
};
const REQUIRED_PERMISSIONS = ["course:publish", "site:manage"];
const COURSE_MANAGEMENT_PERMISSIONS = ["course:manage", "course:manage_any"];
const PRODUCT_WIDGETS = [
    {
        widgetId: "widget_notes_work_product_header_v1",
        name: "header",
        deleteable: false,
        shared: true,
    },
    {
        widgetId: "widget_notes_work_product_banner_v1",
        name: "banner",
        deleteable: true,
        shared: false,
        settings: {},
    },
    {
        widgetId: "widget_notes_work_product_content_v1",
        name: "content",
        deleteable: true,
        shared: false,
        settings: { title: "Curriculum", headerAlignment: "center" },
    },
    {
        widgetId: "widget_notes_work_product_footer_v1",
        name: "footer",
        deleteable: false,
        shared: true,
    },
];
const TIMESTAMPED_COLLECTIONS = new Set(["courses", "pages", "paymentplans"]);

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
            "Usage: add-notes-that-do-work.js --dry-run|--apply",
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
        const entries = await Promise.all(
            Object.entries(SNAPSHOT_URLS).map(async ([key, url]) => {
                const bytes = await readFile(url);
                return [key, { bytes, value: JSON.parse(bytes.toString()) }];
            }),
        );
        return Object.fromEntries(entries);
    } catch {
        throw new SafeMigrationError(
            "Notes course snapshots could not be read",
        );
    }
}

function nonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function requireSingle(documents, message) {
    assert(documents.length === 1, message);
    return documents[0];
}

function sameId(left, right) {
    return String(left) === String(right);
}

function managedFieldsMatch(existing, desired) {
    return (
        existing &&
        Object.entries(desired).every(([key, value]) =>
            isDeepStrictEqual(existing[key], value),
        )
    );
}

function collectImages(node, images = []) {
    if (Array.isArray(node)) {
        for (const child of node) collectImages(child, images);
    } else if (node && typeof node === "object") {
        if (node.type === "image") images.push(node.attrs);
        for (const value of Object.values(node)) collectImages(value, images);
    }
    return images;
}

function stableSiteProjection(site) {
    const {
        secondaryCourse: _secondaryCourse,
        managedMarker,
        page,
        ...root
    } = site;
    return {
        ...root,
        managedMarker: {
            ...managedMarker,
            preflight: undefined,
        },
        page: { ...page, layout: undefined },
    };
}

function validateFrozenInputs(inputs) {
    assert(
        Object.entries(EXPECTED_HASHES).every(
            ([key, expected]) => sha256(inputs[key].bytes) === expected,
        ),
        "Frozen source hash is invalid",
    );
    const snapshot = inputs.course.value;
    const course = snapshot?.course;
    assert(
        snapshot?.schemaVersion === 1 &&
            course?.courseId === COURSE_ID &&
            course.slug === COURSE_SLUG &&
            course.title === "Notes that do work" &&
            course.access === "free" &&
            course.privacy === "public" &&
            course.published === true &&
            nonEmptyString(course.description) &&
            course.featuredImage?.access === "public" &&
            Array.isArray(course.sections) &&
            course.sections.length === 5,
        "Course snapshot identity is invalid",
    );
    const lessons = course.sections.flatMap((section) =>
        section.lessons.map((lesson) => ({
            ...lesson,
            groupId: section.groupId,
        })),
    );
    const lessonIds = lessons.map(({ lessonId }) => lessonId);
    const groupIds = course.sections.map(({ groupId }) => groupId);
    assert(
        lessons.length === 10 &&
            new Set(lessonIds).size === 10 &&
            new Set(groupIds).size === 5 &&
            lessons.every(
                (lesson) =>
                    nonEmptyString(lesson.lessonId) &&
                    lesson.type === "text" &&
                    lesson.published === true &&
                    lesson.content?.type === "doc",
            ),
        "Course lesson topology is invalid",
    );

    const media = inputs.media.value;
    assert(
        media?.schemaVersion === 1 &&
            media.group === "notes-that-do-work-v1" &&
            media.cdnHost === "media.bhekani.com" &&
            Array.isArray(media.entries) &&
            media.entries.length === 11,
        "Media snapshot identity is invalid",
    );
    const mediaIds = media.entries.map(({ media: item }) => item?.mediaId);
    const mediaFiles = new Set(
        media.entries.map(({ media: item }) => item?.file),
    );
    assert(
        new Set(mediaIds).size === 11 &&
            media.entries.every(
                ({ media: item, mimeType, bytes }) =>
                    item?.access === "public" &&
                    item.mimeType === "image/webp" &&
                    mimeType === "image/webp" &&
                    item.size === bytes &&
                    item.file ===
                        `https://media.bhekani.com/p/${item.mediaId}/main.webp` &&
                    item.thumbnail ===
                        `https://media.bhekani.com/p/${item.mediaId}/thumb.webp`,
            ) &&
            mediaFiles.has(course.featuredImage.file),
        "Media records are invalid",
    );
    const lessonImages = lessons.flatMap((lesson) =>
        collectImages(lesson.content),
    );
    assert(
        lessonImages.length === 10 &&
            lessonImages.every(({ src }) => mediaFiles.has(src)),
        "Lesson media references are invalid",
    );

    const baselineSite = inputs.baselineSite.value;
    const desiredSite = inputs.desiredSite.value;
    const courseHref = `/course/${COURSE_SLUG}/${COURSE_ID}`;
    assert(
        baselineSite?.siteKey === "ai-work-school" &&
            desiredSite?.siteKey === "ai-work-school" &&
            desiredSite.secondaryCourse?.courseId === COURSE_ID &&
            desiredSite.secondaryCourse.slug === COURSE_SLUG &&
            desiredSite.secondaryCourse.href === courseHref &&
            desiredSite.secondaryCourse.access === "free" &&
            desiredSite.page?.pageId === "homepage" &&
            desiredSite.page.layout.some(
                ({ widgetId }) =>
                    widgetId === "widget_ai_work_school_courses_v1",
            ) &&
            JSON.stringify(desiredSite.page.layout).includes(courseHref) &&
            isDeepStrictEqual(
                stableSiteProjection(baselineSite),
                stableSiteProjection(desiredSite),
            ),
        "Site snapshot identity is invalid",
    );
    return {
        course,
        lessons,
        lessonIds,
        groupIds,
        media,
        baselineSite,
        desiredSite,
    };
}

function buildDesiredState({ course, lessons, domain, owner, existingCourse }) {
    const domainId = domain._id;
    const lessonIds = lessons.map(({ lessonId }) => lessonId);
    const description = JSON.stringify({
        type: "doc",
        content: [
            {
                type: "paragraph",
                content: [{ type: "text", text: course.description }],
            },
        ],
    });
    const groups = course.sections.map((section) => ({
        _id: section.groupId,
        name: section.title,
        rank: section.rank,
        collapsed: false,
        lessonsOrder: section.lessons.map(({ lessonId }) => lessonId),
    }));
    const stagedCourse = {
        domain: domainId,
        courseId: COURSE_ID,
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
        sales: existingCourse?.sales ?? 0,
        customers: existingCourse?.customers ?? [],
        pageId: course.slug,
        defaultPaymentPlan: PLAN_ID,
        leadMagnet: false,
        discussions: false,
        featuredImage: course.featuredImage,
    };
    const stagedLessons = lessons.map((lesson) => ({
        domain: domainId,
        lessonId: lesson.lessonId,
        title: lesson.title,
        type: lesson.type,
        content: lesson.content,
        downloadable: false,
        creatorId: owner.userId,
        courseId: COURSE_ID,
        requiresEnrollment: lesson.requiresEnrollment,
        published: false,
        groupId: lesson.groupId,
    }));
    return {
        stagedCourse,
        course: { ...stagedCourse, privacy: "public", published: true },
        stagedLessons,
        lessons: stagedLessons.map((lesson) => ({
            ...lesson,
            published: true,
        })),
        productPage: {
            domain: domainId,
            creatorId: owner.userId,
            pageId: COURSE_SLUG,
            type: "product",
            name: course.title,
            entityId: COURSE_ID,
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
            name: "Notes that do work: free",
            type: "free",
            entityId: COURSE_ID,
            entityType: "course",
            userId: owner.userId,
            archived: false,
            internal: false,
            includedProducts: [],
        },
    };
}

function assertKnownManagedRecord(existing, staged, final, message) {
    assert(
        !existing ||
            managedFieldsMatch(existing, staged) ||
            managedFieldsMatch(existing, final),
        message,
    );
}

async function findAtMostOne(collection, query, message) {
    const documents = await collection.find(query).limit(2).toArray();
    assert(documents.length <= 1, message);
    return documents[0];
}

async function assertExactLessonIds(db, domainId, lessonIds) {
    const lessons = await db
        .collection("lessons")
        .find({ domain: domainId, courseId: COURSE_ID })
        .toArray();
    const actual = lessons.map(({ lessonId }) => lessonId).sort();
    assert(
        lessons.length === lessonIds.length &&
            new Set(actual).size === lessonIds.length &&
            isDeepStrictEqual(actual, [...lessonIds].sort()),
        "Managed lesson identity set is invalid",
    );
}

async function preflight(db, frozen) {
    const { course, lessons, lessonIds, groupIds, baselineSite, desiredSite } =
        frozen;
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
    assert(nonEmptyString(owner.name), "Domain owner display name is required");
    assert(
        nonEmptyString(owner.userId) &&
            REQUIRED_PERMISSIONS.every((value) =>
                owner.permissions?.includes(value),
            ) &&
            COURSE_MANAGEMENT_PERMISSIONS.some((value) =>
                owner.permissions?.includes(value),
            ),
        "Domain owner permissions are incomplete",
    );

    const primaryCourse = requireSingle(
        await db
            .collection("courses")
            .find({ domain: domain._id, courseId: PRIMARY_COURSE_ID })
            .limit(2)
            .toArray(),
        "Primary course preflight failed",
    );
    assert(
        primaryCourse.published === true && primaryCourse.privacy === "public",
        "Primary course is not public",
    );
    const primaryPlan = requireSingle(
        await db
            .collection("paymentplans")
            .find({ domain: domain._id, planId: PRIMARY_PLAN_ID })
            .limit(2)
            .toArray(),
        "Primary free plan preflight failed",
    );
    assert(
        primaryPlan.type === "free" && primaryPlan.internal === false,
        "Primary free plan is invalid",
    );

    const courseMatches = await db
        .collection("courses")
        .find({
            $or: [
                { courseId: COURSE_ID },
                { domain: domain._id, slug: COURSE_SLUG },
                { domain: domain._id, title: course.title },
            ],
        })
        .limit(2)
        .toArray();
    assert(courseMatches.length <= 1, "Managed course identity is duplicated");
    const existingCourse = courseMatches[0];
    if (existingCourse) {
        assert(
            sameId(existingCourse.domain, domain._id) &&
                existingCourse.courseId === COURSE_ID &&
                existingCourse.slug === COURSE_SLUG,
            "Managed course identity is invalid",
        );
    }
    const desired = buildDesiredState({
        course,
        lessons,
        domain,
        owner,
        existingCourse,
    });
    assertKnownManagedRecord(
        existingCourse,
        desired.stagedCourse,
        desired.course,
        "Managed course has owner edits",
    );
    const seenGroups = new Set();
    for (const group of existingCourse?.groups ?? []) {
        assert(
            groupIds.includes(group._id) && !seenGroups.has(group._id),
            "Managed group identity is invalid",
        );
        seenGroups.add(group._id);
    }

    const productPage = await findAtMostOne(
        db.collection("pages"),
        {
            domain: domain._id,
            $or: [{ pageId: COURSE_SLUG }, { entityId: COURSE_ID }],
        },
        "Managed product page identity is duplicated",
    );
    assertKnownManagedRecord(
        productPage,
        desired.productPage,
        desired.productPage,
        "Managed product page has owner edits",
    );
    const productWidgetIds = PRODUCT_WIDGETS.map(({ widgetId }) => widgetId);
    const productWidgetCollision = await db.collection("pages").findOne({
        ...(productPage ? { _id: { $ne: productPage._id } } : {}),
        $or: [
            { "layout.widgetId": { $in: productWidgetIds } },
            { "draftLayout.widgetId": { $in: productWidgetIds } },
        ],
    });
    assert(
        !productWidgetCollision,
        "Product widget identity is already in use",
    );
    const plan = await findAtMostOne(
        db.collection("paymentplans"),
        {
            $or: [
                { planId: PLAN_ID },
                {
                    domain: domain._id,
                    entityId: COURSE_ID,
                    entityType: "course",
                },
            ],
        },
        "Managed free plan identity is duplicated",
    );
    assertKnownManagedRecord(
        plan,
        desired.plan,
        desired.plan,
        "Managed free plan has owner edits",
    );

    const existingLessons = await db
        .collection("lessons")
        .find({
            $or: [{ lessonId: { $in: lessonIds } }, { courseId: COURSE_ID }],
        })
        .toArray();
    const byLessonId = new Map();
    for (const lesson of existingLessons) {
        assert(
            sameId(lesson.domain, domain._id) &&
                lesson.courseId === COURSE_ID &&
                lessonIds.includes(lesson.lessonId) &&
                !byLessonId.has(lesson.lessonId),
            "Managed lesson identity is invalid",
        );
        byLessonId.set(lesson.lessonId, lesson);
    }
    for (let index = 0; index < lessonIds.length; index += 1) {
        assertKnownManagedRecord(
            byLessonId.get(lessonIds[index]),
            desired.stagedLessons[index],
            desired.lessons[index],
            "Managed lesson has owner edits",
        );
    }

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
    const homepageState =
        isDeepStrictEqual(homepage.layout, desiredSite.page.layout) &&
        isDeepStrictEqual(homepage.draftLayout, desiredSite.page.layout)
            ? "final"
            : isDeepStrictEqual(homepage.layout, baselineSite.page.layout) &&
                isDeepStrictEqual(
                    homepage.draftLayout,
                    baselineSite.page.layout,
                )
              ? "baseline"
              : "owner-edit";
    assert(homepageState !== "owner-edit", "Managed homepage has owner edits");
    const addedWidgetIds = desiredSite.page.layout
        .map(({ widgetId }) => widgetId)
        .filter(
            (widgetId) =>
                !baselineSite.page.layout.some(
                    (widget) => widget.widgetId === widgetId,
                ),
        );
    assert(
        addedWidgetIds.length === 1 &&
            addedWidgetIds[0] === "widget_ai_work_school_courses_v1",
        "Homepage course catalogue widget is invalid",
    );
    const collision = await db.collection("pages").findOne({
        _id: { $ne: homepage._id },
        $or: [
            { "layout.widgetId": { $in: addedWidgetIds } },
            { "draftLayout.widgetId": { $in: addedWidgetIds } },
        ],
    });
    assert(!collision, "Homepage widget identity is already in use");

    const aggregateFinal =
        managedFieldsMatch(existingCourse, desired.course) &&
        managedFieldsMatch(productPage, desired.productPage) &&
        managedFieldsMatch(plan, desired.plan) &&
        desired.lessons.every((lesson, index) =>
            managedFieldsMatch(byLessonId.get(lessonIds[index]), lesson),
        );
    assert(
        homepageState !== "final" || aggregateFinal,
        "Homepage is final before the course aggregate",
    );
    const changes = [
        ...(!aggregateFinal ? ["course-aggregate"] : []),
        ...(homepageState !== "final" ? ["homepage"] : []),
    ];
    return {
        changes,
        desired,
        domain,
        homepage,
        lessonIds,
        primaryCourse,
        primaryPlan,
    };
}

async function reconcileRecord(db, collectionName, filter, desired) {
    const collection = db.collection(collectionName);
    const existing = await collection.findOne(filter);
    if (managedFieldsMatch(existing, desired)) return;
    const now = new Date();
    if (existing) {
        const result = await collection.updateOne(
            { _id: existing._id },
            {
                $set: {
                    ...desired,
                    ...(TIMESTAMPED_COLLECTIONS.has(collectionName)
                        ? { updatedAt: now }
                        : {}),
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
        ...(TIMESTAMPED_COLLECTIONS.has(collectionName)
            ? { createdAt: now, updatedAt: now }
            : {}),
    });
}

async function verifyCourseAggregate(db, plan, published) {
    const expectedCourse = published
        ? plan.desired.course
        : plan.desired.stagedCourse;
    const expectedLessons = published
        ? plan.desired.lessons
        : plan.desired.stagedLessons;
    const course = await db
        .collection("courses")
        .findOne({ courseId: COURSE_ID });
    const productPage = await db
        .collection("pages")
        .findOne({ domain: plan.domain._id, pageId: COURSE_SLUG });
    const paymentPlan = await db
        .collection("paymentplans")
        .findOne({ planId: PLAN_ID });
    assert(
        managedFieldsMatch(course, expectedCourse) &&
            managedFieldsMatch(productPage, plan.desired.productPage) &&
            managedFieldsMatch(paymentPlan, plan.desired.plan),
        "Course aggregate verification failed",
    );
    await assertExactLessonIds(db, plan.domain._id, plan.lessonIds);
    const lessons = await db
        .collection("lessons")
        .find({ domain: plan.domain._id, courseId: COURSE_ID })
        .toArray();
    const byId = new Map(lessons.map((lesson) => [lesson.lessonId, lesson]));
    assert(
        expectedLessons.every((lesson) =>
            managedFieldsMatch(byId.get(lesson.lessonId), lesson),
        ),
        "Lesson aggregate verification failed",
    );
    const primaryCourse = await db
        .collection("courses")
        .findOne({ _id: plan.primaryCourse._id });
    const primaryPlan = await db
        .collection("paymentplans")
        .findOne({ _id: plan.primaryPlan._id });
    assert(
        isDeepStrictEqual(primaryCourse, plan.primaryCourse) &&
            isDeepStrictEqual(primaryPlan, plan.primaryPlan),
        "Primary course changed during migration",
    );
}

async function applyCourseAggregate(db, plan) {
    if (!plan.changes.includes("course-aggregate")) {
        await verifyCourseAggregate(db, plan, true);
        return;
    }
    await reconcileRecord(
        db,
        "courses",
        { courseId: COURSE_ID },
        plan.desired.stagedCourse,
    );
    await reconcileRecord(
        db,
        "pages",
        { domain: plan.domain._id, pageId: COURSE_SLUG },
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
        { planId: PLAN_ID },
        plan.desired.plan,
    );
    await verifyCourseAggregate(db, plan, false);
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
        { courseId: COURSE_ID },
        plan.desired.course,
    );
    await verifyCourseAggregate(db, plan, true);
}

async function applyHomepage(db, plan, desiredSite) {
    await verifyCourseAggregate(db, plan, true);
    if (!plan.changes.includes("homepage")) return;
    if (process.env.NOTES_COURSE_MIGRATION_TEST_FAIL_AT === "before-homepage") {
        throw new SafeMigrationError("Injected failure before homepage");
    }
    const result = await db.collection("pages").updateOne(
        {
            _id: plan.homepage._id,
            layout: plan.homepage.layout,
            draftLayout: plan.homepage.draftLayout,
        },
        {
            $set: {
                layout: desiredSite.page.layout,
                draftLayout: desiredSite.page.layout,
                updatedAt: new Date(),
            },
        },
    );
    assert(result.matchedCount === 1, "Homepage changed during apply");
    const homepage = await db
        .collection("pages")
        .findOne({ _id: plan.homepage._id });
    assert(
        isDeepStrictEqual(homepage.layout, desiredSite.page.layout) &&
            isDeepStrictEqual(homepage.draftLayout, desiredSite.page.layout),
        "Homepage verification failed",
    );
}

async function run() {
    const mode = parseMode(process.argv.slice(2));
    const { connectionString } = readEnvironment();
    const inputs = await readFrozenInputs();
    const frozen = validateFrozenInputs(inputs);
    try {
        await mongoose.connect(connectionString, {
            serverSelectionTimeoutMS: 5_000,
        });
    } catch {
        throw new SafeMigrationError("Database connection failed");
    }
    try {
        const db = mongoose.connection.db;
        assert(db, "Database connection failed");
        const plan = await preflight(db, frozen);
        if (mode === "apply") {
            await applyCourseAggregate(db, plan);
            await applyHomepage(db, plan, frozen.desiredSite);
        }
        console.log(
            `notes-course-migration mode=${mode} planned=${plan.changes.length} applied=${mode === "apply" ? plan.changes.length : 0}`,
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
    console.error("Notes course migration failed unexpectedly");
    process.exitCode = 1;
});
