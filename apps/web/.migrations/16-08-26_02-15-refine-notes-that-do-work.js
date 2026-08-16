/**
 * Adds the reviewed AI-assisted lessons and practical media to Notes that do work.
 *
 * Usage: node 16-08-26_02-15-refine-notes-that-do-work.js --dry-run|--apply
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import mongoose from "mongoose";

const TARGET_DOMAIN = "main";
const MIGRATION_ID = "16-08-26_02-15-refine-notes-that-do-work";
const BASELINE_ID = "16-08-26_00-40-add-notes-that-do-work";
const COURSE_ID = "course_notes_that_do_work_v1";
const COURSE_SLUG = "notes-that-do-work";
const PLAN_ID = "plan_notes_that_do_work_free_v1";
const NEW_LESSON_IDS = [
    "lesson_notes_that_do_work_11",
    "lesson_notes_that_do_work_12",
];
const UPDATED_LESSON_IDS = [
    "lesson_notes_that_do_work_01",
    "lesson_notes_that_do_work_05",
    "lesson_notes_that_do_work_10",
];
const EXPECTED_ADDED_MEDIA = {
    "obsidian-note-surface": {
        mediaId: "ur6cY_uoVi6MamfWCHfQ3d5I_7o3G_9QcV4_7-ZY",
        sourcePath:
            "content/courses/notes-that-do-work/assets/screenshot-obsidian-note-surface.webp",
        sha256: "845e2be9b34bbd0371427a1e063acbf434395698d1ee92c2abc8e64138d2730f",
        bytes: 45740,
        lessonId: "lesson_notes_that_do_work_01",
        provenance: {
            sourceUrl: "https://obsidian.md/",
            capture: "Official homepage hero captured at 1440 by 1000",
        },
    },
    "onenote-link-command": {
        mediaId: "S6uGLmVooml8BzH41vazeIH4JKQeEJYrose7Kldw",
        sourcePath:
            "content/courses/notes-that-do-work/assets/screenshot-onenote-link-command.webp",
        sha256: "46dccce69cd2de16ef460cc96f5ee472ee86a95de042ac9b233d3de18d920512",
        bytes: 26696,
        lessonId: "lesson_notes_that_do_work_05",
        provenance: {
            sourceUrl:
                "https://support.microsoft.com/en-US/OneNote/media/basic-tasks-screenshot-twelve-png.png",
            capture: "Direct official image captured at 1252 by 276",
        },
    },
    "ai-source-pack": {
        mediaId: "tWTY3oXFnAPjVrGMn1TwTCukywazlYIVsleoV_eR",
        sourcePath:
            "content/courses/notes-that-do-work/assets/diagram-ai-source-pack.webp",
        sha256: "d40bc394eea972843a883d975ba75f40e2eec5e028a1d1d14d93132cfbf62476",
        bytes: 64892,
        lessonId: "lesson_notes_that_do_work_11",
        provenance: {
            sourcePath:
                "content/courses/notes-that-do-work/assets/diagram-ai-source-pack.svg",
        },
    },
    "ai-reviewed-reentry": {
        mediaId: "rUGceNXTvIDpu4YZNYObDfPsW0p47hNYuekgOP0v",
        sourcePath:
            "content/courses/notes-that-do-work/assets/diagram-ai-reviewed-reentry.webp",
        sha256: "88f94d8ba561664e82ba4b8714161cbc97cbfad11f4e6e3f58ea513041183d04",
        bytes: 66170,
        lessonId: "lesson_notes_that_do_work_12",
        provenance: {
            sourcePath:
                "content/courses/notes-that-do-work/assets/diagram-ai-reviewed-reentry.svg",
        },
    },
};
const EXPECTED_HASHES = {
    baselineCourse:
        "4835a2b0bcba46bde66f47d81e338bc4ceabb7f980b561b381ec052fa803d637",
    finalCourse:
        "4becdb8799d9bbae6e8e22ab8848949f3aa74f08aa0d369449c451f83be90179",
    baselineMedia:
        "5435797ff68a44c8639d7da4670e70580e08b388a309339a6e1c0d12cabeadcb",
    finalMedia:
        "1e45833e77e132bc9f75e869b7b8be2e82da3574016231a0b1de57eaa4d6f7c3",
    baselineSite:
        "ef71d8f2f12b51c488770edaf47046980bf9dae3849816f8bbefde3037d2b50f",
    finalSite:
        "523d29b2d6954eb4f5bf599ee51cad62a229c52b7468ecbbaebd1bb99b514d05",
};
const SNAPSHOT_URLS = {
    baselineCourse: new URL(`./${BASELINE_ID}.course.json`, import.meta.url),
    finalCourse: new URL(`./${MIGRATION_ID}.course.json`, import.meta.url),
    baselineMedia: new URL(`./${BASELINE_ID}.media.json`, import.meta.url),
    finalMedia: new URL(`./${MIGRATION_ID}.media.json`, import.meta.url),
    baselineSite: new URL(`./${BASELINE_ID}.site.json`, import.meta.url),
    finalSite: new URL(`./${MIGRATION_ID}.site.json`, import.meta.url),
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
            "Usage: refine-notes-that-do-work.js --dry-run|--apply",
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

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sameId = (left, right) => String(left) === String(right);
const nonEmptyString = (value) =>
    typeof value === "string" && value.trim().length > 0;

function requireSingle(documents, message) {
    assert(documents.length === 1, message);
    return documents[0];
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
            "Notes refinement snapshots could not be read",
        );
    }
}

function flattenLessons(snapshot) {
    return snapshot.course.sections.flatMap((section) =>
        section.lessons.map((lesson) => ({
            ...lesson,
            groupId: section.groupId,
        })),
    );
}

function courseManagedState(snapshot, includeMetadata = true) {
    const course = snapshot.course;
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
        audience: includeMetadata ? course.audience : undefined,
        outcome: includeMetadata ? course.outcome : undefined,
        lessons: flattenLessons(snapshot).map(({ lessonId }) => lessonId),
        groups: course.sections.map((section) => ({
            _id: section.groupId,
            name: section.title,
            rank: section.rank,
            collapsed: false,
            lessonsOrder: section.lessons.map(({ lessonId }) => lessonId),
        })),
    };
}

function validateFrozenInputs(inputs) {
    assert(
        Object.entries(EXPECTED_HASHES).every(
            ([key, expected]) => sha256(inputs[key].bytes) === expected,
        ),
        "Frozen source hash is invalid",
    );
    const baselineCourse = inputs.baselineCourse.value;
    const finalCourse = inputs.finalCourse.value;
    assert(
        baselineCourse?.course?.courseId === COURSE_ID &&
            finalCourse?.course?.courseId === COURSE_ID &&
            baselineCourse.course.slug === COURSE_SLUG &&
            finalCourse.course.slug === COURSE_SLUG &&
            baselineCourse.course.sections.length === 5 &&
            finalCourse.course.sections.length === 6,
        "Course snapshot identity is invalid",
    );
    const baselineLessons = flattenLessons(baselineCourse);
    const finalLessons = flattenLessons(finalCourse);
    const baselineIds = baselineLessons.map(({ lessonId }) => lessonId);
    const finalIds = finalLessons.map(({ lessonId }) => lessonId);
    assert(
        baselineLessons.length === 10 &&
            finalLessons.length === 12 &&
            new Set(finalIds).size === 12 &&
            baselineIds.every((lessonId) => finalIds.includes(lessonId)) &&
            NEW_LESSON_IDS.every(
                (lessonId) => !baselineIds.includes(lessonId),
            ) &&
            NEW_LESSON_IDS.every((lessonId) => finalIds.includes(lessonId)) &&
            finalLessons.every(
                (lesson) =>
                    lesson.type === "text" &&
                    lesson.published === true &&
                    lesson.content?.type === "doc",
            ),
        "Course lesson topology is invalid",
    );
    const changedExisting = baselineLessons
        .filter((baseline) => {
            const final = finalLessons.find(
                ({ lessonId }) => lessonId === baseline.lessonId,
            );
            return !isDeepStrictEqual(baseline.content, final?.content);
        })
        .map(({ lessonId }) => lessonId)
        .sort();
    assert(
        isDeepStrictEqual(changedExisting, [...UPDATED_LESSON_IDS].sort()),
        "Existing lesson change set is invalid",
    );

    const baselineMedia = inputs.baselineMedia.value;
    const finalMedia = inputs.finalMedia.value;
    assert(
        baselineMedia?.group === "notes-that-do-work-v1" &&
            finalMedia?.group === "notes-that-do-work-v2" &&
            baselineMedia.entries.length === 11 &&
            finalMedia.entries.length === 15 &&
            finalMedia.cdnHost === "media.bhekani.com",
        "Media snapshot identity is invalid",
    );
    const baselineMediaIds = new Set(
        baselineMedia.entries.map(({ media }) => media.mediaId),
    );
    const finalMediaIds = finalMedia.entries.map(({ media }) => media.mediaId);
    const addedMediaIds = finalMediaIds.filter(
        (mediaId) => !baselineMediaIds.has(mediaId),
    );
    const finalMediaByKey = new Map(
        finalMedia.entries.map((entry) => [entry.key, entry]),
    );
    assert(
        new Set(finalMediaIds).size === 15 &&
            addedMediaIds.length === 4 &&
            finalMedia.entries.every(
                ({ sourcePath, sha256: sourceHash, bytes, mimeType, media }) =>
                    nonEmptyString(sourcePath) &&
                    /^[a-f0-9]{64}$/.test(sourceHash) &&
                    mimeType === "image/webp" &&
                    nonEmptyString(media.mediaId) &&
                    media.access === "public" &&
                    media.mimeType === "image/webp" &&
                    media.size === bytes &&
                    media.file ===
                        `https://media.bhekani.com/p/${media.mediaId}/main.webp` &&
                    media.thumbnail ===
                        `https://media.bhekani.com/p/${media.mediaId}/thumb.webp`,
            ),
        "Media records are invalid",
    );
    for (const [key, expected] of Object.entries(EXPECTED_ADDED_MEDIA)) {
        const entry = finalMediaByKey.get(key);
        const lesson = finalLessons.find(
            ({ lessonId }) => lessonId === expected.lessonId,
        );
        assert(
            entry?.media.mediaId === expected.mediaId &&
                entry.sourcePath === expected.sourcePath &&
                entry.sha256 === expected.sha256 &&
                entry.bytes === expected.bytes &&
                JSON.stringify(lesson?.content).includes(expected.mediaId) &&
                Object.values(expected.provenance).every(nonEmptyString),
            "Added media provenance is invalid",
        );
    }
    const finalMediaFiles = new Set(
        finalMedia.entries.map(({ media }) => media.file),
    );
    const lessonImages = finalLessons.flatMap(({ content }) =>
        collectImages(content),
    );
    const referencedMediaFiles = new Set([
        finalCourse.course.featuredImage.file,
        ...lessonImages.map(({ src }) => src),
    ]);
    assert(
        lessonImages.length === 14 &&
            lessonImages.every(
                ({ src, alt, title }) =>
                    finalMediaFiles.has(src) &&
                    nonEmptyString(alt) &&
                    nonEmptyString(title),
            ) &&
            referencedMediaFiles.size === 15 &&
            finalMedia.entries.every(({ media }) =>
                referencedMediaFiles.has(media.file),
            ),
        "Lesson media references are invalid",
    );

    const baselineSite = inputs.baselineSite.value;
    const finalSite = inputs.finalSite.value;
    assert(
        baselineSite?.siteKey === "ai-work-school" &&
            finalSite?.siteKey === "ai-work-school" &&
            baselineSite.page?.pageId === "homepage" &&
            finalSite.page?.pageId === "homepage" &&
            isDeepStrictEqual(
                baselineSite.page.layout.map(({ widgetId }) => widgetId),
                finalSite.page.layout.map(({ widgetId }) => widgetId),
            ) &&
            JSON.stringify(finalSite.page.layout).includes(
                "Choose what AI may read, check what it writes",
            ),
        "Site snapshot identity is invalid",
    );
    return {
        baselineCourse,
        finalCourse,
        baselineLessons,
        finalLessons,
        baselineSite,
        finalSite,
        addedMediaIds,
    };
}

function desiredNewLesson(lesson, domain, owner, published) {
    return {
        domain: domain._id,
        lessonId: lesson.lessonId,
        title: lesson.title,
        type: lesson.type,
        content: lesson.content,
        downloadable: false,
        creatorId: owner.userId,
        courseId: COURSE_ID,
        requiresEnrollment: lesson.requiresEnrollment,
        published,
        groupId: lesson.groupId,
    };
}

function lessonIdentityIsSafe(lesson, expected, domainId, ownerId) {
    return (
        sameId(lesson.domain, domainId) &&
        lesson.courseId === COURSE_ID &&
        lesson.creatorId === ownerId &&
        lesson.title === expected.title &&
        lesson.type === expected.type &&
        lesson.groupId === expected.groupId &&
        lesson.requiresEnrollment === expected.requiresEnrollment &&
        lesson.downloadable === false &&
        lesson.published === true
    );
}

function classify(value, baseline, final, message) {
    if (isDeepStrictEqual(value, final)) return "final";
    if (isDeepStrictEqual(value, baseline)) return "baseline";
    throw new SafeMigrationError(message);
}

async function preflight(db, frozen) {
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
        nonEmptyString(owner.name) &&
            nonEmptyString(owner.userId) &&
            owner.permissions?.includes("course:publish") &&
            owner.permissions?.includes("site:manage") &&
            ["course:manage", "course:manage_any"].some((permission) =>
                owner.permissions?.includes(permission),
            ),
        "Domain owner permissions are incomplete",
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
        "Managed course preflight failed",
    );
    assert(
        sameId(course.domain, domain._id) &&
            course.courseId === COURSE_ID &&
            course.slug === COURSE_SLUG &&
            course.pageId === COURSE_SLUG &&
            course.creatorId === owner.userId &&
            course.type === "course" &&
            course.published === true &&
            course.privacy === "public" &&
            course.defaultPaymentPlan === PLAN_ID,
        "Managed course identity is invalid",
    );
    const plan = requireSingle(
        await db
            .collection("paymentplans")
            .find({ domain: domain._id, planId: PLAN_ID })
            .limit(2)
            .toArray(),
        "Managed free plan preflight failed",
    );
    assert(
        plan.planId === PLAN_ID &&
            plan.type === "free" &&
            plan.internal === false &&
            plan.archived === false &&
            plan.userId === owner.userId &&
            plan.entityId === COURSE_ID &&
            plan.entityType === "course",
        "Managed free plan is invalid",
    );

    const baselineCourseState = courseManagedState(
        frozen.baselineCourse,
        false,
    );
    const finalCourseState = courseManagedState(frozen.finalCourse);
    const courseState = classify(
        {
            description: course.description,
            audience: course.audience,
            outcome: course.outcome,
            lessons: course.lessons,
            groups: course.groups,
        },
        baselineCourseState,
        finalCourseState,
        "Managed course has owner edits",
    );

    const allowedLessonIds = frozen.finalLessons.map(
        ({ lessonId }) => lessonId,
    );
    const lessons = await db
        .collection("lessons")
        .find({
            $or: [
                { domain: domain._id, courseId: COURSE_ID },
                { lessonId: { $in: allowedLessonIds } },
            ],
        })
        .toArray();
    const byId = new Map();
    for (const lesson of lessons) {
        assert(
            allowedLessonIds.includes(lesson.lessonId) &&
                sameId(lesson.domain, domain._id) &&
                lesson.courseId === COURSE_ID &&
                !byId.has(lesson.lessonId),
            "Managed lesson identity is invalid",
        );
        byId.set(lesson.lessonId, lesson);
    }
    assert(
        [10, 11, 12].includes(byId.size),
        "Managed lesson identity set is invalid",
    );
    for (const baseline of frozen.baselineLessons) {
        const existing = byId.get(baseline.lessonId);
        const final = frozen.finalLessons.find(
            ({ lessonId }) => lessonId === baseline.lessonId,
        );
        assert(
            existing &&
                lessonIdentityIsSafe(
                    existing,
                    baseline,
                    domain._id,
                    owner.userId,
                ),
            "Existing lesson identity is invalid",
        );
        if (UPDATED_LESSON_IDS.includes(baseline.lessonId)) {
            classify(
                existing.content,
                baseline.content,
                final.content,
                "Managed lesson has owner edits",
            );
        } else {
            assert(
                isDeepStrictEqual(existing.content, baseline.content),
                "Unmanaged lesson content changed",
            );
        }
    }

    const newLessonStates = new Map();
    for (const lessonId of NEW_LESSON_IDS) {
        const final = frozen.finalLessons.find(
            (lesson) => lesson.lessonId === lessonId,
        );
        const existing = byId.get(lessonId);
        const staged = desiredNewLesson(final, domain, owner, false);
        const published = desiredNewLesson(final, domain, owner, true);
        const state = !existing
            ? "absent"
            : managedFieldsMatch(existing, published)
              ? "final"
              : managedFieldsMatch(existing, staged)
                ? "staged"
                : "owner-edit";
        assert(state !== "owner-edit", "Managed new lesson has owner edits");
        newLessonStates.set(lessonId, {
            state,
            existing,
            staged,
            published,
        });
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
    const homepageState = classify(
        { layout: homepage.layout, draftLayout: homepage.draftLayout },
        {
            layout: frozen.baselineSite.page.layout,
            draftLayout: frozen.baselineSite.page.layout,
        },
        {
            layout: frozen.finalSite.page.layout,
            draftLayout: frozen.finalSite.page.layout,
        },
        "Managed homepage has owner edits",
    );
    assert(
        homepage.type === "site" &&
            homepage.entityId === TARGET_DOMAIN &&
            homepage.creatorId === owner.userId,
        "Homepage identity is invalid",
    );

    const addedMediaSet = new Set(frozen.addedMediaIds);
    for (const otherLesson of await db
        .collection("lessons")
        .find({
            lessonId: { $nin: allowedLessonIds },
        })
        .toArray()) {
        const content = JSON.stringify(otherLesson.content ?? {});
        assert(
            ![...addedMediaSet].some((mediaId) => content.includes(mediaId)),
            "New media identity is already in use",
        );
    }
    const mediaIsReused = (value) => {
        const content = JSON.stringify(value ?? {});
        return [...addedMediaSet].some((mediaId) => content.includes(mediaId));
    };
    for (const page of await db
        .collection("pages")
        .find({})
        .project({ layout: 1, draftLayout: 1 })
        .toArray()) {
        assert(
            !mediaIsReused({
                layout: page.layout,
                draftLayout: page.draftLayout,
            }),
            "New media identity is already in use",
        );
    }
    for (const otherCourse of await db
        .collection("courses")
        .find({ _id: { $ne: course._id } })
        .project({ featuredImage: 1 })
        .toArray()) {
        assert(
            !mediaIsReused(otherCourse.featuredImage),
            "New media identity is already in use",
        );
    }

    const changedExistingStates = new Map(
        UPDATED_LESSON_IDS.map((lessonId) => {
            const baseline = frozen.baselineLessons.find(
                (lesson) => lesson.lessonId === lessonId,
            );
            const final = frozen.finalLessons.find(
                (lesson) => lesson.lessonId === lessonId,
            );
            const existing = byId.get(lessonId);
            return [
                lessonId,
                {
                    state: isDeepStrictEqual(existing.content, final.content)
                        ? "final"
                        : "baseline",
                    existing,
                    baseline,
                    final,
                },
            ];
        }),
    );
    const lessonsFinal =
        [...changedExistingStates.values()].every(
            ({ state }) => state === "final",
        ) &&
        [...newLessonStates.values()].every(({ state }) => state === "final");
    assert(
        courseState !== "final" || lessonsFinal,
        "Course is final before its lessons",
    );
    assert(
        homepageState !== "final" || (courseState === "final" && lessonsFinal),
        "Homepage is final before the course",
    );
    const changes = [
        ...[...changedExistingStates].flatMap(([lessonId, { state }]) =>
            state === "final" ? [] : [`content:${lessonId}`],
        ),
        ...[...newLessonStates].flatMap(([lessonId, { state }]) =>
            state === "final" ? [] : [`lesson:${lessonId}`],
        ),
        ...(courseState === "final" ? [] : ["course"]),
        ...(homepageState === "final" ? [] : ["homepage"]),
    ];
    return {
        changes,
        domain,
        owner,
        course,
        courseState,
        homepage,
        homepageState,
        plan,
        changedExistingStates,
        newLessonStates,
        finalCourseState,
    };
}

async function verifyLessons(db, plan, frozen, expectedPublication) {
    const lessons = await db
        .collection("lessons")
        .find({ domain: plan.domain._id, courseId: COURSE_ID })
        .toArray();
    const actualIds = lessons.map(({ lessonId }) => lessonId).sort();
    const expectedIds = frozen.finalLessons
        .map(({ lessonId }) => lessonId)
        .sort();
    assert(
        lessons.length === 12 &&
            new Set(actualIds).size === 12 &&
            isDeepStrictEqual(actualIds, expectedIds),
        "Managed lesson identity set is invalid",
    );
    const byId = new Map(lessons.map((lesson) => [lesson.lessonId, lesson]));
    for (const final of frozen.finalLessons) {
        const existing = byId.get(final.lessonId);
        assert(existing, "Managed lesson is missing");
        if (NEW_LESSON_IDS.includes(final.lessonId)) {
            const published =
                expectedPublication === "planned"
                    ? plan.newLessonStates.get(final.lessonId)?.state ===
                      "final"
                    : expectedPublication;
            const expected = desiredNewLesson(
                final,
                plan.domain,
                plan.owner,
                published,
            );
            assert(
                managedFieldsMatch(existing, expected),
                "Managed new lesson verification failed",
            );
        } else {
            assert(
                lessonIdentityIsSafe(
                    existing,
                    final,
                    plan.domain._id,
                    plan.owner.userId,
                ) && isDeepStrictEqual(existing.content, final.content),
                "Existing lesson verification failed",
            );
        }
    }
}

async function applyLessonContent(db, plan) {
    for (const {
        state,
        existing,
        baseline,
        final,
    } of plan.changedExistingStates.values()) {
        if (state === "final") continue;
        const result = await db.collection("lessons").updateOne(
            {
                _id: existing._id,
                content: baseline.content,
                published: true,
            },
            { $set: { content: final.content, updatedAt: new Date() } },
        );
        assert(
            result.matchedCount === 1,
            "Existing lesson changed during apply",
        );
    }
}

async function stageNewLessons(db, plan) {
    for (const { state, existing, staged } of plan.newLessonStates.values()) {
        if (state !== "absent") continue;
        const collision = await db.collection("lessons").findOne({
            lessonId: staged.lessonId,
        });
        assert(!collision, "New lesson identity changed during apply");
        const now = new Date();
        await db.collection("lessons").insertOne({
            ...staged,
            createdAt: now,
            updatedAt: now,
        });
        assert(!existing, "New lesson plan is inconsistent");
        if (
            staged.lessonId === NEW_LESSON_IDS[0] &&
            process.env.NOTES_REFINEMENT_MIGRATION_TEST_FAIL_AT ===
                "after-stage"
        ) {
            throw new SafeMigrationError("Injected failure after lesson stage");
        }
    }
    if (
        process.env.NODE_ENV === "test" &&
        process.env.NOTES_REFINEMENT_MIGRATION_TEST_FAIL_AT ===
            "corrupt-staged-title"
    ) {
        const result = await db.collection("lessons").updateOne(
            {
                lessonId: NEW_LESSON_IDS[0],
                published: false,
            },
            { $set: { title: "Injected corrupt staged title" } },
        );
        assert(result.matchedCount === 1, "Test lesson corruption failed");
    }
}

async function publishNewLessons(db, plan) {
    for (const { state, published } of plan.newLessonStates.values()) {
        if (state === "final") continue;
        const result = await db.collection("lessons").updateOne(
            {
                ...published,
                published: false,
            },
            { $set: { published: true, updatedAt: new Date() } },
        );
        assert(result.matchedCount === 1, "New lesson changed during publish");
    }
}

async function updateCourse(db, plan) {
    if (plan.courseState === "final") return;
    const baseline = {
        description: plan.course.description,
        audience: plan.course.audience,
        outcome: plan.course.outcome,
        lessons: plan.course.lessons,
        groups: plan.course.groups,
    };
    const result = await db.collection("courses").updateOne(
        {
            _id: plan.course._id,
            description: baseline.description,
            audience:
                baseline.audience === undefined
                    ? { $exists: false }
                    : baseline.audience,
            outcome:
                baseline.outcome === undefined
                    ? { $exists: false }
                    : baseline.outcome,
            lessons: baseline.lessons,
            groups: baseline.groups,
            published: true,
            privacy: "public",
        },
        { $set: { ...plan.finalCourseState, updatedAt: new Date() } },
    );
    assert(result.matchedCount === 1, "Managed course changed during apply");
}

async function verifyCourse(db, plan) {
    const course = await db.collection("courses").findOne({
        _id: plan.course._id,
    });
    assert(
        managedFieldsMatch(course, plan.finalCourseState) &&
            course.published === true &&
            course.privacy === "public",
        "Managed course verification failed",
    );
    const planAfter = await db.collection("paymentplans").findOne({
        _id: plan.plan._id,
    });
    assert(
        isDeepStrictEqual(planAfter, plan.plan),
        "Managed free plan changed during migration",
    );
}

async function updateHomepage(db, plan, finalSite) {
    if (plan.homepageState === "final") return;
    if (
        process.env.NOTES_REFINEMENT_MIGRATION_TEST_FAIL_AT ===
        "before-homepage"
    ) {
        throw new SafeMigrationError("Injected failure before homepage");
    }
    await verifyCourse(db, plan);
    const result = await db.collection("pages").updateOne(
        {
            _id: plan.homepage._id,
            layout: plan.homepage.layout,
            draftLayout: plan.homepage.draftLayout,
        },
        {
            $set: {
                layout: finalSite.page.layout,
                draftLayout: finalSite.page.layout,
                updatedAt: new Date(),
            },
        },
    );
    assert(result.matchedCount === 1, "Homepage changed during apply");
    const homepage = await db.collection("pages").findOne({
        _id: plan.homepage._id,
    });
    assert(
        isDeepStrictEqual(homepage.layout, finalSite.page.layout) &&
            isDeepStrictEqual(homepage.draftLayout, finalSite.page.layout),
        "Homepage verification failed",
    );
}

async function apply(db, plan, frozen) {
    await applyLessonContent(db, plan);
    await stageNewLessons(db, plan);
    await verifyLessons(db, plan, frozen, "planned");
    await publishNewLessons(db, plan);
    await verifyLessons(db, plan, frozen, true);
    await updateCourse(db, plan);
    await verifyCourse(db, plan);
    await updateHomepage(db, plan, frozen.finalSite);
}

async function run() {
    const mode = parseMode(process.argv.slice(2));
    const { connectionString } = readEnvironment();
    const frozen = validateFrozenInputs(await readFrozenInputs());
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
        if (mode === "apply") await apply(db, plan, frozen);
        console.log(
            `notes-refinement-migration mode=${mode} planned=${plan.changes.length} applied=${mode === "apply" ? plan.changes.length : 0}`,
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
    console.error("Notes refinement migration failed unexpectedly");
    process.exitCode = 1;
});
