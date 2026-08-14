/**
 * Expands the managed AI Work School course without rewriting learner or
 * commercial state.
 *
 * Usage: node 14-08-26_20-00-expand-ai-work-school.js --dry-run|--apply
 */
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import mongoose from "mongoose";

const TARGET_DOMAIN = "main";
const COURSE_ID = "course_ai_for_actual_work_v1";
const PLAN_ID = "plan_ai_for_actual_work_free_v1";
const REQUIRED_PERMISSIONS = [
    "course:publish",
    "site:manage",
    "setting:manage",
];
const COURSE_MANAGEMENT_PERMISSIONS = ["course:manage", "course:manage_any"];
const EXPECTED_IMAGE_ROLES = [
    "skill-lesson",
    "skill-package-lesson",
    "mcp-lesson",
    "mcp-connection-lesson",
    "editorial-partnership-lesson",
    "checked-work-lesson",
    "checked-workflow-lesson",
];
const MIGRATION_ID = "14-08-26_20-00-expand-ai-work-school";
const FOLLOWUP_COURSE_URL = new URL(
    `./${MIGRATION_ID}.course.json`,
    import.meta.url,
);
const FOLLOWUP_SITE_URL = new URL(
    `./${MIGRATION_ID}.site.json`,
    import.meta.url,
);
const MEDIA_SITE_LOCK_URL = new URL(
    `./${MIGRATION_ID}.media-site.json`,
    import.meta.url,
);
const LAUNCH_COURSE_URL = new URL(
    "./14-08-26_17-30-seed-ai-work-school.course.json",
    import.meta.url,
);
const LAUNCH_SITE_URL = new URL(
    "./14-08-26_17-30-seed-ai-work-school.site.json",
    import.meta.url,
);

class SafeMigrationError extends Error {
    constructor(message, exitCode = 1) {
        super(message);
        this.exitCode = exitCode;
    }
}

function parseMode(args) {
    if (args.length !== 1 || !["--dry-run", "--apply"].includes(args[0])) {
        throw new SafeMigrationError(
            "Usage: expand-ai-work-school.js --dry-run|--apply",
            64,
        );
    }

    return args[0] === "--apply" ? "apply" : "dry-run";
}

function assert(condition, message) {
    if (!condition) {
        throw new SafeMigrationError(message);
    }
}

function readEnvironment() {
    const connectionString = process.env.DB_CONNECTION_STRING;
    const targetDomain = process.env.TARGET_DOMAIN;

    assert(connectionString, "Database connection is required");
    assert(targetDomain === TARGET_DOMAIN, "Target domain is not allowlisted");

    return { connectionString };
}

async function readFrozenInputs() {
    try {
        const [
            courseBytes,
            siteBytes,
            lockBytes,
            launchCourseBytes,
            launchSiteBytes,
        ] = await Promise.all(
            [
                FOLLOWUP_COURSE_URL,
                FOLLOWUP_SITE_URL,
                MEDIA_SITE_LOCK_URL,
                LAUNCH_COURSE_URL,
                LAUNCH_SITE_URL,
            ].map((url) => readFile(url)),
        );
        return {
            course: JSON.parse(courseBytes.toString("utf8")),
            site: JSON.parse(siteBytes.toString("utf8")),
            lock: JSON.parse(lockBytes.toString("utf8")),
            launchCourse: JSON.parse(launchCourseBytes.toString("utf8")),
            launchSite: JSON.parse(launchSiteBytes.toString("utf8")),
            sourceBytes: {
                course: courseBytes,
                site: siteBytes,
                launchCourse: launchCourseBytes,
                launchSite: launchSiteBytes,
            },
        };
    } catch {
        throw new SafeMigrationError("Follow-up snapshots could not be read");
    }
}

function validateLockIdentity(lock) {
    assert(
        lock?.schemaVersion === 1 &&
            lock.siteKey === "ai-work-school" &&
            lock.courseId === "course_ai_for_actual_work_v1",
        "Media/site lock identity is invalid",
    );
    assert(
        lock.targetDomain === TARGET_DOMAIN,
        "Media/site lock target is invalid",
    );
}

function nonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function sha256(value) {
    return createHash("sha256").update(value).digest("hex");
}

function flattenCourse(snapshot) {
    assert(snapshot?.schemaVersion === 1, "Course snapshot schema is invalid");
    const course = snapshot.course;
    assert(
        course &&
            nonEmptyString(course.courseId) &&
            nonEmptyString(course.title) &&
            nonEmptyString(course.slug) &&
            nonEmptyString(course.description) &&
            Array.isArray(course.sections),
        "Course snapshot is invalid",
    );
    const groups = new Set();
    const lessons = [];
    for (const section of course.sections) {
        assert(
            nonEmptyString(section.groupId) &&
                nonEmptyString(section.title) &&
                Number.isSafeInteger(section.rank) &&
                Array.isArray(section.lessons),
            "Course section is invalid",
        );
        assert(!groups.has(section.groupId), "Course group IDs are duplicated");
        groups.add(section.groupId);
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
                !lessons.some(({ lessonId }) => lessonId === lesson.lessonId),
                "Course lesson IDs are duplicated",
            );
            lessons.push({ ...lesson, groupId: section.groupId });
        }
    }
    return { course, lessons };
}

function managedFieldsMatch(existing, desired) {
    return (
        existing &&
        Object.entries(desired).every(([key, value]) =>
            isDeepStrictEqual(existing[key], value),
        )
    );
}

function sameObjectId(left, right) {
    return String(left) === String(right);
}

function validateMediaUrl(value, lock, mediaId, fileName) {
    assert(nonEmptyString(value), "Media URL is invalid");
    let url;
    try {
        url = new URL(value);
    } catch {
        throw new SafeMigrationError("Media URL is invalid");
    }
    assert(
        url.protocol === "https:" &&
            !value.startsWith("data:") &&
            lock.allowedMediaHosts.includes(url.hostname),
        "Media URL is not reviewed",
    );
    assert(
        url.pathname === `/p/${mediaId}/${fileName}` &&
            url.search === "" &&
            url.hash === "",
        "Media URL does not match its ID",
    );
}

function captionNode(caption) {
    return {
        type: "paragraph",
        content: [{ type: "text", text: caption }],
    };
}

function validateFrozenInputs(inputs) {
    const { lock, sourceBytes } = inputs;
    validateLockIdentity(lock);
    assert(
        lock.sourceHashes?.expandedCourse === sha256(sourceBytes.course) &&
            lock.sourceHashes?.desiredSite === sha256(sourceBytes.site) &&
            lock.sourceHashes?.launchCourseSnapshot ===
                sha256(sourceBytes.launchCourse) &&
            lock.sourceHashes?.launchSiteSnapshot ===
                sha256(sourceBytes.launchSite),
        "Frozen source hash is invalid",
    );

    const launch = flattenCourse(inputs.launchCourse);
    const desired = flattenCourse(inputs.course);
    assert(
        launch.course.courseId === COURSE_ID &&
            launch.course.sections.length === 7 &&
            launch.lessons.length === 14,
        "Launch course relationship is invalid",
    );
    assert(
        desired.course.courseId === COURSE_ID &&
            desired.course.sections.length === 11 &&
            desired.lessons.length === 22,
        "Expanded course relationship is invalid",
    );
    assert(
        desired.lessons.map(({ lessonId }) => lessonId).join(",") ===
            [
                ...Array.from({ length: 12 }, (_, index) => index + 1),
                ...Array.from({ length: 8 }, (_, index) => index + 15),
                13,
                14,
            ]
                .map(
                    (serial) =>
                        `lesson_ai_for_actual_work_${String(serial).padStart(2, "0")}`,
                )
                .join(","),
        "Expanded lesson order is invalid",
    );
    assert(
        desired.course.sections.map(({ groupId }) => groupId).join(",") ===
            "group_ai_for_actual_work_01,group_ai_for_actual_work_02,group_ai_for_actual_work_03,group_ai_for_actual_work_04,group_ai_for_actual_work_05,group_ai_for_actual_work_06,group_ai_for_actual_work_08,group_ai_for_actual_work_09,group_ai_for_actual_work_10,group_ai_for_actual_work_11,group_ai_for_actual_work_07" &&
            desired.course.sections.every(
                ({ rank }, index) => rank === (index + 1) * 1000,
            ),
        "Expanded group order is invalid",
    );
    for (const oldLesson of launch.lessons) {
        const nextLesson = desired.lessons.find(
            ({ lessonId }) => lessonId === oldLesson.lessonId,
        );
        assert(nextLesson, "Existing lesson identity changed");
        const oldPersisted = {
            title: oldLesson.title,
            type: oldLesson.type,
            requiresEnrollment: oldLesson.requiresEnrollment,
            published: oldLesson.published,
            groupId: oldLesson.groupId,
            ...(oldLesson.lessonId === "lesson_ai_for_actual_work_14"
                ? {}
                : { content: oldLesson.content }),
        };
        assert(
            managedFieldsMatch(nextLesson, oldPersisted),
            "Existing lesson relationship changed",
        );
    }

    const featuredKeys = [
        "mediaId",
        "originalFileName",
        "mimeType",
        "size",
        "access",
        "file",
        "thumbnail",
        "caption",
    ];
    assert(
        isDeepStrictEqual(lock.allowedMimeTypes, ["image/webp"]),
        "Media MIME allowlist is invalid",
    );
    assert(
        isDeepStrictEqual(lock.allowedMediaHosts, ["media.bhekani.com"]),
        "Media host allowlist is invalid",
    );
    assert(
        featuredKeys.every((key) => lock.featuredImage?.[key] !== undefined) &&
            nonEmptyString(lock.featuredImage.mediaId) &&
            nonEmptyString(lock.featuredImage.originalFileName) &&
            nonEmptyString(lock.featuredImage.caption) &&
            Number.isSafeInteger(lock.featuredImage.size) &&
            lock.featuredImage.size > 0 &&
            lock.featuredImage.access === "public" &&
            lock.allowedMimeTypes.includes(lock.featuredImage.mimeType),
        "Featured image is invalid",
    );
    assert(
        isDeepStrictEqual(lock.featuredImage, desired.course.featuredImage),
        "Featured image differs from reviewed course",
    );
    validateMediaUrl(
        lock.featuredImage.file,
        lock,
        lock.featuredImage.mediaId,
        "main.webp",
    );
    validateMediaUrl(
        lock.featuredImage.thumbnail,
        lock,
        lock.featuredImage.mediaId,
        "thumb.webp",
    );
    assert(
        Array.isArray(lock.lessonImages) && lock.lessonImages.length === 7,
        "Lesson image role set is invalid",
    );
    assert(
        isDeepStrictEqual(
            [...lock.lessonImages.map(({ role }) => role)].sort(),
            [...EXPECTED_IMAGE_ROLES].sort(),
        ),
        "Lesson image role set is invalid",
    );
    const expectedTargets = {
        "skill-lesson": "lesson_ai_for_actual_work_17",
        "skill-package-lesson": "lesson_ai_for_actual_work_17",
        "mcp-lesson": "lesson_ai_for_actual_work_18",
        "mcp-connection-lesson": "lesson_ai_for_actual_work_18",
        "editorial-partnership-lesson": "lesson_ai_for_actual_work_20",
        "checked-work-lesson": "lesson_ai_for_actual_work_21",
        "checked-workflow-lesson": "lesson_ai_for_actual_work_21",
    };
    const mediaIds = new Set([lock.featuredImage.mediaId]);
    const urls = new Set([
        lock.featuredImage.file,
        lock.featuredImage.thumbnail,
    ]);
    for (const image of lock.lessonImages) {
        assert(
            image.lessonId === expectedTargets[image.role],
            "Lesson image target is invalid",
        );
        assert(
            nonEmptyString(image.mediaId) && !mediaIds.has(image.mediaId),
            "Media identity is duplicated",
        );
        mediaIds.add(image.mediaId);
        validateMediaUrl(
            image.node?.attrs?.src,
            lock,
            image.mediaId,
            "main.webp",
        );
        assert(!urls.has(image.node.attrs.src), "Media URL is duplicated");
        urls.add(image.node.attrs.src);
        assert(
            image.node.type === "image" &&
                nonEmptyString(image.node.attrs.alt) &&
                nonEmptyString(image.node.attrs.title) &&
                nonEmptyString(image.caption),
            "Lesson image accessibility data is invalid",
        );
        const lesson = desired.lessons.find(
            ({ lessonId }) => lessonId === image.lessonId,
        );
        const nodes = lesson?.content?.content ?? [];
        assert(
            Number.isSafeInteger(image.imageIndex) &&
                isDeepStrictEqual(nodes[image.imageIndex], image.node) &&
                sha256(JSON.stringify(nodes[image.imageIndex - 1])) ===
                    image.anchorNodeSha256 &&
                isDeepStrictEqual(
                    nodes[image.imageIndex + 1],
                    captionNode(image.caption),
                ),
            "Lesson image placement is invalid",
        );
    }
    assert(
        desired.lessons.reduce(
            (count, lesson) =>
                count +
                lesson.content.content.filter(({ type }) => type === "image")
                    .length,
            0,
        ) === 7,
        "Unexpected lesson image is present",
    );

    const desiredSite = inputs.site;
    const launchSite = inputs.launchSite;
    assert(
        desiredSite?.schemaVersion === 1 &&
            desiredSite.siteKey === "ai-work-school" &&
            desiredSite.managedMarker?.preflight === "launch-baseline-or-v2" &&
            desiredSite.managedMarker.widgetId ===
                lock.siteProjection?.managedMarkerWidgetId,
        "Desired site contract is invalid",
    );
    assert(
        isDeepStrictEqual(lock.siteProjection.homepageFields, [
            "title",
            "description",
            "robotsAllowed",
            "draftTitle",
            "draftDescription",
            "draftRobotsAllowed",
            "layout",
            "draftLayout",
        ]) &&
            isDeepStrictEqual(lock.siteProjection.sharedWidgetNames, [
                "header",
                "footer",
            ]),
        "Site projection is invalid",
    );
    assert(
        desiredSite.page?.pageId === "homepage" &&
            desiredSite.page.layout?.some(
                ({ widgetId }) =>
                    widgetId === lock.siteProjection.managedMarkerWidgetId,
            ) &&
            !/(7 sections|14 lessons)/i.test(JSON.stringify(desiredSite.page)),
        "Desired homepage is invalid",
    );
    assert(
        launchSite?.page?.pageId === "homepage" &&
            launchSite.page.layout?.some(
                ({ widgetId }) =>
                    widgetId === lock.siteProjection.managedMarkerWidgetId,
            ),
        "Launch homepage baseline is invalid",
    );
    for (const site of [launchSite, desiredSite]) {
        assert(
            Array.isArray(site.sharedWidgets) &&
                ["header", "footer"].every(
                    (name) =>
                        site.sharedWidgets.filter(
                            (widget) => widget.name === name,
                        ).length === 1,
                ),
            "Shared widget contract is invalid",
        );
    }
    return { launch, desired };
}

function buildCourseManaged(course, lessons, featuredImage) {
    return {
        description: JSON.stringify({
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [{ type: "text", text: course.description }],
                },
            ],
        }),
        lessons: lessons.map(({ lessonId }) => lessonId),
        groups: course.sections.map((section) => ({
            _id: section.groupId,
            name: section.title,
            rank: section.rank,
            collapsed: false,
            lessonsOrder: section.lessons.map(({ lessonId }) => lessonId),
        })),
        ...(featuredImage ? { featuredImage } : {}),
    };
}

function buildHomepageManaged(page) {
    return {
        title: page.title,
        description: page.description,
        robotsAllowed: page.robotsAllowed,
        draftTitle: page.title,
        draftDescription: page.description,
        draftRobotsAllowed: page.robotsAllowed,
        layout: page.layout,
        draftLayout: page.layout,
    };
}

function widgetsByName(site) {
    return Object.fromEntries(
        site.sharedWidgets.map((widget) => [widget.name, widget]),
    );
}

function requireSingle(documents, message) {
    assert(documents.length === 1, message);
    return documents[0];
}

async function preflight(db, inputs, validated) {
    const domains = await db
        .collection("domains")
        .find({ name: TARGET_DOMAIN, deleted: false })
        .limit(2)
        .toArray();
    const domain = requireSingle(domains, "Target domain preflight failed");
    const owners = await db
        .collection("users")
        .find({ domain: domain._id, email: domain.email, active: true })
        .limit(2)
        .toArray();
    const owner = requireSingle(owners, "Domain owner preflight failed");
    assert(
        nonEmptyString(owner.name) && nonEmptyString(owner.userId),
        "Domain owner identity is invalid",
    );
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

    const courseSource = validated.desired.course;
    const courses = await db
        .collection("courses")
        .find({
            $or: [
                { courseId: COURSE_ID },
                { domain: domain._id, title: courseSource.title },
                { domain: domain._id, slug: courseSource.slug },
            ],
        })
        .limit(2)
        .toArray();
    const course = requireSingle(courses, "Managed course preflight failed");
    assert(
        course.courseId === COURSE_ID &&
            sameObjectId(course.domain, domain._id) &&
            course.title === courseSource.title &&
            course.slug === courseSource.slug &&
            course.creatorId === owner.userId &&
            course.type === "course" &&
            course.pageId === courseSource.slug &&
            course.defaultPaymentPlan === PLAN_ID,
        "Managed course identity is invalid",
    );
    const plans = await db
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
        .toArray();
    const plan = requireSingle(plans, "External free plan preflight failed");
    assert(
        sameObjectId(plan.domain, domain._id) &&
            plan.entityId === COURSE_ID &&
            plan.entityType === "course" &&
            plan.type === "free" &&
            plan.internal === false &&
            plan.archived === false &&
            plan.userId === owner.userId,
        "External free plan is invalid",
    );

    const pages = await db
        .collection("pages")
        .find({
            domain: domain._id,
            pageId: "homepage",
            deleted: { $ne: true },
        })
        .limit(2)
        .toArray();
    const homepage = requireSingle(pages, "Homepage preflight failed");
    assert(
        homepage.type === "site" &&
            homepage.entityId === TARGET_DOMAIN &&
            homepage.creatorId === owner.userId,
        "Homepage identity is invalid",
    );
    const productPages = await db
        .collection("pages")
        .find({
            domain: domain._id,
            pageId: courseSource.slug,
            entityId: COURSE_ID,
            type: "product",
            deleted: { $ne: true },
        })
        .limit(2)
        .toArray();
    requireSingle(productPages, "Product page preflight failed");
    assert(
        productPages[0].creatorId === owner.userId,
        "Product page identity is invalid",
    );

    const expectedIds = validated.desired.lessons.map(
        ({ lessonId }) => lessonId,
    );
    const lessonMatches = await db
        .collection("lessons")
        .find({
            $or: [
                { lessonId: { $in: expectedIds } },
                { domain: domain._id, courseId: COURSE_ID },
            ],
        })
        .toArray();
    const lessonsById = new Map();
    for (const lesson of lessonMatches) {
        assert(
            expectedIds.includes(lesson.lessonId) &&
                sameObjectId(lesson.domain, domain._id) &&
                lesson.courseId === COURSE_ID,
            "Managed lesson identity collides with existing data",
        );
        assert(
            !lessonsById.has(lesson.lessonId),
            "Managed lesson identity is duplicated",
        );
        lessonsById.set(lesson.lessonId, lesson);
    }
    for (const lesson of validated.launch.lessons) {
        const existing = lessonsById.get(lesson.lessonId);
        assert(
            existing &&
                existing.groupId === lesson.groupId &&
                existing.type === lesson.type &&
                existing.creatorId === owner.userId,
            "Existing lesson identity is invalid",
        );
    }
    const newGroupIds = validated.desired.course.sections
        .map(({ groupId }) => groupId)
        .filter(
            (groupId) =>
                !validated.launch.course.sections.some(
                    (section) => section.groupId === groupId,
                ),
        );
    const groupCollisions = await db
        .collection("courses")
        .find({ "groups._id": { $in: newGroupIds } })
        .project({ domain: 1, courseId: 1 })
        .toArray();
    assert(
        groupCollisions.every(
            (match) =>
                sameObjectId(match.domain, domain._id) &&
                match.courseId === COURSE_ID,
        ),
        "Managed group identity collides with existing data",
    );

    const baselineCourse = buildCourseManaged(
        validated.launch.course,
        validated.launch.lessons,
    );
    const desiredCourse = buildCourseManaged(
        validated.desired.course,
        validated.desired.lessons,
        inputs.lock.featuredImage,
    );
    const courseIsBaseline =
        managedFieldsMatch(course, baselineCourse) &&
        course.featuredImage === undefined;
    const courseIsFinal = managedFieldsMatch(course, desiredCourse);
    assert(courseIsBaseline || courseIsFinal, "Managed course has owner edits");

    const oldLesson14 = validated.launch.lessons.find(
        ({ lessonId }) => lessonId === "lesson_ai_for_actual_work_14",
    );
    const desiredLesson14 = validated.desired.lessons.find(
        ({ lessonId }) => lessonId === "lesson_ai_for_actual_work_14",
    );
    const lesson14 = lessonsById.get("lesson_ai_for_actual_work_14");
    const lesson14IsBaseline = isDeepStrictEqual(
        lesson14.content,
        oldLesson14.content,
    );
    const lesson14IsFinal = isDeepStrictEqual(
        lesson14.content,
        desiredLesson14.content,
    );
    assert(
        lesson14IsBaseline || lesson14IsFinal,
        "Managed capstone lesson has owner edits",
    );

    const desiredNewLessons = validated.desired.lessons
        .filter(({ lessonId }) => Number(lessonId.slice(-2)) >= 15)
        .map((lesson) => ({
            domain: domain._id,
            lessonId: lesson.lessonId,
            title: lesson.title,
            type: lesson.type,
            content: lesson.content,
            creatorId: owner.userId,
            courseId: COURSE_ID,
            requiresEnrollment: lesson.requiresEnrollment,
            groupId: lesson.groupId,
            published: true,
        }));
    const newLessonStates = desiredNewLessons.map((desiredLesson) => {
        const existing = lessonsById.get(desiredLesson.lessonId);
        if (!existing) return "missing";
        if (managedFieldsMatch(existing, desiredLesson)) return "final";
        if (
            managedFieldsMatch(existing, {
                ...desiredLesson,
                published: false,
            })
        ) {
            return "staged";
        }
        throw new SafeMigrationError("Managed new lesson has owner edits");
    });
    const allNewLessonsFinal = newLessonStates.every(
        (state) => state === "final",
    );

    const baselineHomepage = buildHomepageManaged(inputs.launchSite.page);
    const desiredHomepage = buildHomepageManaged(inputs.site.page);
    const homepageIsBaseline = managedFieldsMatch(homepage, baselineHomepage);
    const homepageIsFinal = managedFieldsMatch(homepage, desiredHomepage);
    assert(
        homepageIsBaseline || homepageIsFinal,
        "Managed homepage has owner edits",
    );
    const baselineWidgets = widgetsByName(inputs.launchSite);
    const desiredWidgets = widgetsByName(inputs.site);
    const widgetsAreBaseline =
        managedFieldsMatch(domain.sharedWidgets, baselineWidgets) &&
        managedFieldsMatch(domain.draftSharedWidgets, baselineWidgets);
    const widgetsAreFinal =
        managedFieldsMatch(domain.sharedWidgets, desiredWidgets) &&
        managedFieldsMatch(domain.draftSharedWidgets, desiredWidgets);
    assert(
        widgetsAreBaseline || widgetsAreFinal,
        "Managed shared widgets have owner edits",
    );
    assert(
        !courseIsFinal || (lesson14IsFinal && allNewLessonsFinal),
        "Final course has incomplete lessons",
    );
    assert(
        !homepageIsFinal || (courseIsFinal && widgetsAreFinal),
        "Final homepage has incomplete dependencies",
    );
    assert(
        !widgetsAreFinal || courseIsFinal,
        "Final shared widgets have an incomplete Course dependency",
    );
    assert(
        !homepageIsFinal || !widgetsAreBaseline,
        "Final homepage has baseline shared widgets",
    );

    const changes = [
        ...desiredNewLessons
            .map((lesson, index) => ({
                kind: "new-lesson",
                desired: lesson,
                state: newLessonStates[index],
                existing: lessonsById.get(lesson.lessonId),
            }))
            .filter(({ state }) => state !== "final"),
        ...(lesson14IsFinal
            ? []
            : [
                  {
                      kind: "lesson-14",
                      existing: lesson14,
                      baselineContent: oldLesson14.content,
                      desiredContent: desiredLesson14.content,
                  },
              ]),
        ...(courseIsFinal
            ? []
            : [
                  {
                      kind: "course",
                      existing: course,
                      baseline: baselineCourse,
                      desired: desiredCourse,
                  },
              ]),
        ...(widgetsAreFinal
            ? []
            : [
                  {
                      kind: "shared-widgets",
                      baselineWidgets,
                      desiredWidgets,
                  },
              ]),
        ...(homepageIsFinal
            ? []
            : [
                  {
                      kind: "homepage",
                      homepage,
                      baselineHomepage,
                      desiredHomepage,
                  },
              ]),
    ];
    return {
        changes,
        domain,
        owner,
        course,
        homepage,
        plan,
        desiredCourse,
        desiredHomepage,
        desiredWidgets,
        desiredNewLessons,
        lesson14,
        oldLesson14,
        desiredLesson14,
        baselineCourse,
        baselineHomepage,
        baselineWidgets,
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
    const oldLessonIds = plan.oldLesson14
        ? Array.from(
              { length: 14 },
              (_, index) =>
                  `lesson_ai_for_actual_work_${String(index + 1).padStart(2, "0")}`,
          )
        : [];
    const existingLessons = await readWithCursor(db.collection("lessons"), {
        lessonId: { $in: oldLessonIds },
    });
    const memberships = await readWithCursor(db.collection("memberships"), {
        domain: plan.domain._id,
        entityId: COURSE_ID,
        entityType: "course",
    });
    const membershipIds = memberships.map(({ membershipId }) => membershipId);
    return {
        course: omitFields(plan.course, [
            "description",
            "lessons",
            "groups",
            "featuredImage",
            "updatedAt",
        ]),
        lessons: existingLessons.map((lesson) =>
            lesson.lessonId === "lesson_ai_for_actual_work_14"
                ? omitFields(lesson, ["content"])
                : lesson,
        ),
        domain: {
            document: omitFields(plan.domain, [
                "sharedWidgets",
                "draftSharedWidgets",
                "updatedAt",
            ]),
            otherSharedWidgets: omitFields(plan.domain.sharedWidgets ?? {}, [
                "header",
                "footer",
            ]),
            otherDraftSharedWidgets: omitFields(
                plan.domain.draftSharedWidgets ?? {},
                ["header", "footer"],
            ),
        },
        homepage: omitFields(plan.homepage, [
            ...Object.keys(plan.desiredHomepage),
            "updatedAt",
        ]),
        users: await readWithCursor(db.collection("users"), {
            domain: plan.domain._id,
            "purchases.courseId": COURSE_ID,
        }),
        memberships,
        invoices: await readWithCursor(db.collection("invoices"), {
            domain: plan.domain._id,
            membershipId: { $in: membershipIds },
        }),
        certificates: await readWithCursor(db.collection("certificates"), {
            domain: plan.domain._id,
            courseId: COURSE_ID,
        }),
        activities: await readWithCursor(db.collection("activities"), {
            domain: plan.domain._id,
            $or: [{ entityId: COURSE_ID }, { "metadata.courseId": COURSE_ID }],
        }),
        lessonEvaluations: await readWithCursor(
            db.collection("lessonevaluations"),
            {
                domain: plan.domain._id,
                lessonId: { $in: oldLessonIds },
            },
        ),
        plan: await readWithCursor(db.collection("paymentplans"), {
            planId: PLAN_ID,
        }),
    };
}

async function verifyProtectedState(db, plan, expected) {
    const currentCourse = await db
        .collection("courses")
        .findOne({ _id: plan.course._id });
    const currentDomain = await db
        .collection("domains")
        .findOne({ _id: plan.domain._id });
    const currentHomepage = await db
        .collection("pages")
        .findOne({ _id: plan.homepage._id });
    const current = await captureProtectedState(db, {
        ...plan,
        course: currentCourse,
        domain: currentDomain,
        homepage: currentHomepage,
    });
    assert(
        isDeepStrictEqual(current, expected),
        "Protected state changed during apply",
    );
}

function exactManagedFilter(id, fields) {
    return {
        _id: id,
        ...Object.fromEntries(Object.entries(fields)),
    };
}

function failForTest(point) {
    if (
        process.env.NODE_ENV === "test" &&
        process.env.FOLLOWUP_MIGRATION_TEST_FAIL_AT === point
    ) {
        throw new Error(`Injected migration failure at ${point}`);
    }
}

async function findManagedLesson(db, desired) {
    const matches = await db
        .collection("lessons")
        .find({ lessonId: desired.lessonId })
        .limit(2)
        .toArray();
    assert(
        matches.length <= 1,
        "Managed lesson identity is duplicated during apply",
    );
    const existing = matches[0];
    if (existing) {
        assert(
            sameObjectId(existing.domain, desired.domain) &&
                existing.courseId === COURSE_ID,
            "Managed lesson identity collides during apply",
        );
    }
    return existing;
}

async function stageNewLessons(db, plan) {
    for (const desired of plan.desiredNewLessons) {
        if (desired.lessonId === "lesson_ai_for_actual_work_19") {
            failForTest("before-lesson-19");
        }
        const existing = await findManagedLesson(db, desired);
        const staged = { ...desired, published: false };
        if (
            managedFieldsMatch(existing, desired) ||
            managedFieldsMatch(existing, staged)
        ) {
            continue;
        }
        assert(!existing, "Managed new lesson changed during apply");
        const now = new Date();
        await db.collection("lessons").insertOne({
            ...staged,
            createdAt: now,
            updatedAt: now,
        });
    }
}

async function verifyNewLessons(db, plan, allowStaged) {
    for (const desired of plan.desiredNewLessons) {
        const existing = await findManagedLesson(db, desired);
        const staged = { ...desired, published: false };
        assert(
            managedFieldsMatch(existing, desired) ||
                (allowStaged && managedFieldsMatch(existing, staged)),
            "Managed new lesson verification failed",
        );
    }
}

async function updateLesson14(db, plan) {
    if (
        isDeepStrictEqual(plan.lesson14.content, plan.desiredLesson14.content)
    ) {
        return;
    }
    const result = await db.collection("lessons").updateOne(
        {
            _id: plan.lesson14._id,
            content: plan.oldLesson14.content,
        },
        { $set: { content: plan.desiredLesson14.content } },
    );
    assert(result.matchedCount === 1, "Capstone lesson changed during apply");
}

async function publishNewLessons(db, plan) {
    for (const desired of plan.desiredNewLessons) {
        const existing = await findManagedLesson(db, desired);
        if (managedFieldsMatch(existing, desired)) {
            continue;
        }
        const staged = { ...desired, published: false };
        assert(
            managedFieldsMatch(existing, staged),
            "Managed new lesson changed before publication",
        );
        const result = await db
            .collection("lessons")
            .updateOne(exactManagedFilter(existing._id, staged), {
                $set: { published: true },
            });
        assert(
            result.matchedCount === 1,
            "Managed new lesson changed during publication",
        );
    }
}

async function updateCourse(db, plan) {
    const current = await db
        .collection("courses")
        .findOne({ _id: plan.course._id });
    if (managedFieldsMatch(current, plan.desiredCourse)) {
        return;
    }
    assert(
        managedFieldsMatch(current, plan.baselineCourse) &&
            current.featuredImage === undefined,
        "Managed course changed during apply",
    );
    const result = await db.collection("courses").updateOne(
        {
            ...exactManagedFilter(current._id, plan.baselineCourse),
            featuredImage: { $exists: false },
        },
        {
            $set: {
                ...plan.desiredCourse,
                updatedAt: new Date(),
            },
        },
    );
    assert(result.matchedCount === 1, "Managed course changed during update");
}

async function verifyCourse(db, plan) {
    const course = await db
        .collection("courses")
        .findOne({ _id: plan.course._id });
    assert(
        managedFieldsMatch(course, plan.desiredCourse),
        "Course verification failed",
    );
    const lesson14 = await db
        .collection("lessons")
        .findOne({ _id: plan.lesson14._id });
    assert(
        isDeepStrictEqual(lesson14?.content, plan.desiredLesson14.content),
        "Capstone verification failed",
    );
    await verifyNewLessons(db, plan, false);
}

async function updateSharedWidgets(db, plan) {
    const current = await db
        .collection("domains")
        .findOne({ _id: plan.domain._id });
    const final =
        managedFieldsMatch(current.sharedWidgets, plan.desiredWidgets) &&
        managedFieldsMatch(current.draftSharedWidgets, plan.desiredWidgets);
    if (final) return;
    assert(
        managedFieldsMatch(current.sharedWidgets, plan.baselineWidgets) &&
            managedFieldsMatch(
                current.draftSharedWidgets,
                plan.baselineWidgets,
            ),
        "Managed shared widgets changed during apply",
    );
    const result = await db.collection("domains").updateOne(
        {
            _id: current._id,
            "sharedWidgets.header": plan.baselineWidgets.header,
            "sharedWidgets.footer": plan.baselineWidgets.footer,
            "draftSharedWidgets.header": plan.baselineWidgets.header,
            "draftSharedWidgets.footer": plan.baselineWidgets.footer,
        },
        {
            $set: {
                "sharedWidgets.header": plan.desiredWidgets.header,
                "sharedWidgets.footer": plan.desiredWidgets.footer,
                "draftSharedWidgets.header": plan.desiredWidgets.header,
                "draftSharedWidgets.footer": plan.desiredWidgets.footer,
                updatedAt: new Date(),
            },
        },
    );
    assert(
        result.matchedCount === 1,
        "Managed shared widgets changed during update",
    );
}

async function updateHomepage(db, plan) {
    const current = await db
        .collection("pages")
        .findOne({ _id: plan.homepage._id });
    if (managedFieldsMatch(current, plan.desiredHomepage)) return;
    assert(
        managedFieldsMatch(current, plan.baselineHomepage),
        "Managed homepage changed during apply",
    );
    const result = await db
        .collection("pages")
        .updateOne(exactManagedFilter(current._id, plan.baselineHomepage), {
            $set: {
                ...plan.desiredHomepage,
                updatedAt: new Date(),
            },
        });
    assert(result.matchedCount === 1, "Managed homepage changed during update");
}

async function verifySite(db, plan) {
    const domain = await db
        .collection("domains")
        .findOne({ _id: plan.domain._id });
    const homepage = await db
        .collection("pages")
        .findOne({ _id: plan.homepage._id });
    assert(
        managedFieldsMatch(domain?.sharedWidgets, plan.desiredWidgets) &&
            managedFieldsMatch(domain?.draftSharedWidgets, plan.desiredWidgets),
        "Shared widget verification failed",
    );
    assert(
        managedFieldsMatch(homepage, plan.desiredHomepage),
        "Homepage verification failed",
    );
}

async function corruptSiteForTest(db, plan) {
    if (
        process.env.NODE_ENV === "test" &&
        process.env.FOLLOWUP_MIGRATION_TEST_CORRUPT_AFTER_SITE === "homepage"
    ) {
        await db
            .collection("pages")
            .updateOne(
                { _id: plan.homepage._id },
                { $set: { title: "Injected post-write corruption" } },
            );
    }
}

async function applyPlan(db, plan) {
    const protectedState = await captureProtectedState(db, plan);
    await stageNewLessons(db, plan);
    await verifyNewLessons(db, plan, true);
    await updateLesson14(db, plan);
    await publishNewLessons(db, plan);
    await verifyNewLessons(db, plan, false);
    failForTest("before-course-update");
    await updateCourse(db, plan);
    await verifyCourse(db, plan);
    await verifyProtectedState(db, plan, protectedState);
    await updateSharedWidgets(db, plan);
    failForTest("before-homepage-update");
    await updateHomepage(db, plan);
    await corruptSiteForTest(db, plan);
    await verifyCourse(db, plan);
    await verifySite(db, plan);
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
        const plan = await preflight(db, inputs, validated);
        const applied = mode === "apply" ? await applyPlan(db, plan) : 0;
        console.log(
            `followup-migration mode=${mode} planned=${plan.changes.length} applied=${applied}`,
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

    console.error("Follow-up migration failed unexpectedly");
    process.exitCode = 1;
});
