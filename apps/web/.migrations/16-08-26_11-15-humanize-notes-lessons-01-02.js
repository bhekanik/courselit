/**
 * Rewrites the reviewed humanised prose of Notes that do work lessons 01 and 02.
 *
 * Usage: node 16-08-26_11-15-humanize-notes-lessons-01-02.js --dry-run|--apply
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import mongoose from "mongoose";

const TARGET_DOMAIN = "main";
const MIGRATION_ID = "16-08-26_11-15-humanize-notes-lessons-01-02";
const BASELINE_ID = "16-08-26_02-15-refine-notes-that-do-work";
const COURSE_ID = "course_notes_that_do_work_v1";
const COURSE_SLUG = "notes-that-do-work";
const PLAN_ID = "plan_notes_that_do_work_free_v1";
const SOURCE_COURSE_PATH = "content/courses/notes-that-do-work/course.json";
const SOURCE_REVIEW_COMMIT = "560e256a1df54d0f2037ae5c773a3bf2d2acb503";
const FINAL_CANONICAL_COURSE_SHA256 =
    "19d5d11042afe3070e80022ad8f0b03095acf5f370ff2233ccdb2eb1c7d69981";
const TARGET_LESSON_IDS = [
    "lesson_notes_that_do_work_01",
    "lesson_notes_that_do_work_02",
];
// Canonical section order: pair 11/12 ships before pair 09/10.
const EXPECTED_LESSON_IDS = [
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
const EXPECTED_HASHES = {
    baselineCourse:
        "4becdb8799d9bbae6e8e22ab8848949f3aa74f08aa0d369449c451f83be90179",
    transition:
        "9ed25656644718ca324b6f39c0feeed5542b6f646539ba93af60f83f07b4ae8d",
};
const SNAPSHOT_URLS = {
    baselineCourse: new URL(`./${BASELINE_ID}.course.json`, import.meta.url),
    transition: new URL(`./${MIGRATION_ID}.lessons.json`, import.meta.url),
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
            "Usage: humanize-notes-lessons-01-02.js --dry-run|--apply",
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

function classify(value, baseline, final, message) {
    if (isDeepStrictEqual(value, final)) return "final";
    if (isDeepStrictEqual(value, baseline)) return "baseline";
    throw new SafeMigrationError(message);
}

function lessonIdentityIsSafe(lesson, identity, domainId, ownerId) {
    return (
        Boolean(lesson?._id) &&
        sameId(lesson.domain, domainId) &&
        lesson.courseId === COURSE_ID &&
        lesson.creatorId === ownerId &&
        lesson.title === identity.title &&
        lesson.type === identity.type &&
        lesson.groupId === identity.groupId &&
        lesson.requiresEnrollment === identity.requiresEnrollment &&
        lesson.downloadable === identity.downloadable &&
        lesson.published === identity.published
    );
}

function collectNodes(node, type, found = []) {
    if (Array.isArray(node)) {
        for (const child of node) collectNodes(child, type, found);
    } else if (node && typeof node === "object") {
        if (node.type === type) found.push(node);
        for (const value of Object.values(node))
            collectNodes(value, type, found);
    }
    return found;
}

function collectLinkMarks(node, found = []) {
    if (Array.isArray(node)) {
        for (const child of node) collectLinkMarks(child, found);
    } else if (node && typeof node === "object") {
        for (const mark of Array.isArray(node.marks) ? node.marks : []) {
            if (mark?.type === "link") found.push(mark);
        }
        for (const value of Object.values(node)) collectLinkMarks(value, found);
    }
    return found;
}

function flattenLessons(snapshot) {
    return snapshot.course.sections.flatMap((section) =>
        section.lessons.map((lesson) => ({
            ...lesson,
            groupId: section.groupId,
        })),
    );
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
            "Notes humanisation snapshots could not be read",
        );
    }
}

function validateFrozenInputs(inputs) {
    assert(
        Object.entries(EXPECTED_HASHES).every(
            ([key, expected]) => sha256(inputs[key].bytes) === expected,
        ),
        "Frozen source hash is invalid",
    );
    const transition = inputs.transition.value;
    assert(
        transition?.schemaVersion === 1 &&
            transition.migrationId === MIGRATION_ID &&
            transition.sourceReviewCommit === SOURCE_REVIEW_COMMIT &&
            transition.sourceCoursePath === SOURCE_COURSE_PATH &&
            transition.finalCanonicalCourseSha256 ===
                FINAL_CANONICAL_COURSE_SHA256 &&
            transition.baselineCourseSnapshot?.migrationId === BASELINE_ID &&
            transition.baselineCourseSnapshot.sha256 ===
                EXPECTED_HASHES.baselineCourse &&
            transition.course?.courseId === COURSE_ID &&
            transition.course.slug === COURSE_SLUG &&
            isDeepStrictEqual(
                transition.course.expectedLessonIds,
                EXPECTED_LESSON_IDS,
            ) &&
            isDeepStrictEqual(
                transition.lessons?.map(({ lessonId }) => lessonId),
                TARGET_LESSON_IDS,
            ),
        "Transition snapshot identity is invalid",
    );

    const baselineCourse = inputs.baselineCourse.value;
    const baselineLessons = flattenLessons(baselineCourse);
    assert(
        baselineCourse?.course?.courseId === COURSE_ID &&
            baselineCourse.course.slug === COURSE_SLUG &&
            baselineCourse.course.sections.length === 6 &&
            baselineLessons.length === EXPECTED_LESSON_IDS.length &&
            isDeepStrictEqual(
                baselineLessons.map(({ lessonId }) => lessonId),
                EXPECTED_LESSON_IDS,
            ),
        "Baseline course snapshot is invalid",
    );

    for (const target of transition.lessons) {
        const baseline = baselineLessons.find(
            ({ lessonId }) => lessonId === target.lessonId,
        );
        assert(
            baseline &&
                isDeepStrictEqual(target.baselineContent, baseline.content) &&
                isDeepStrictEqual(target.identity, {
                    title: baseline.title,
                    type: baseline.type,
                    groupId: baseline.groupId,
                    requiresEnrollment: baseline.requiresEnrollment,
                    downloadable: false,
                    published: baseline.published,
                }),
            "Transition baseline linkage is invalid",
        );
        assert(
            sha256(JSON.stringify(target.baselineContent)) ===
                target.baselineContentSha256 &&
                sha256(JSON.stringify(target.finalContent)) ===
                    target.finalContentSha256 &&
                target.baselineContent?.type === "doc" &&
                target.finalContent?.type === "doc" &&
                !isDeepStrictEqual(target.baselineContent, target.finalContent),
            "Transition content hashes are invalid",
        );
        assert(
            isDeepStrictEqual(
                collectNodes(target.baselineContent, "image"),
                collectNodes(target.finalContent, "image"),
            ) &&
                isDeepStrictEqual(
                    collectLinkMarks(target.baselineContent),
                    collectLinkMarks(target.finalContent),
                ),
            "Transition media and link contract changed",
        );
    }
    return {
        lessons: transition.lessons,
        baselineLessons,
        expectedCourseGroups: baselineCourse.course.sections.map((section) => ({
            _id: section.groupId,
            name: section.title,
            rank: section.rank,
            collapsed: false,
            lessonsOrder: section.lessons.map(({ lessonId }) => lessonId),
        })),
    };
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
            course.defaultPaymentPlan === PLAN_ID &&
            isDeepStrictEqual(course.lessons, EXPECTED_LESSON_IDS) &&
            isDeepStrictEqual(course.groups, frozen.expectedCourseGroups),
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

    // Union of the course's own lessons and every managed ID anywhere, so a
    // duplicate or a cross-course/cross-domain steal cannot hide behind a
    // correct count.
    const lessons = await db
        .collection("lessons")
        .find({
            $or: [
                { domain: domain._id, courseId: COURSE_ID },
                { lessonId: { $in: EXPECTED_LESSON_IDS } },
            ],
        })
        .toArray();
    const byId = new Map();
    for (const lesson of lessons) {
        const expected = frozen.baselineLessons.find(
            ({ lessonId }) => lessonId === lesson.lessonId,
        );
        assert(
            EXPECTED_LESSON_IDS.includes(lesson.lessonId) &&
                sameId(lesson.domain, domain._id) &&
                lesson.courseId === COURSE_ID &&
                lesson.groupId === expected?.groupId &&
                !byId.has(lesson.lessonId),
            "Managed lesson identity is invalid",
        );
        byId.set(lesson.lessonId, lesson);
    }
    assert(
        byId.size === EXPECTED_LESSON_IDS.length,
        "Managed lesson identity set is invalid",
    );

    const targets = frozen.lessons.map((target) => {
        const existing = byId.get(target.lessonId);
        assert(
            lessonIdentityIsSafe(
                existing,
                target.identity,
                domain._id,
                owner.userId,
            ),
            "Target lesson identity is invalid",
        );
        return {
            ...target,
            existing,
            state: classify(
                existing.content,
                target.baselineContent,
                target.finalContent,
                "Managed lesson has owner edits",
            ),
        };
    });
    return {
        domain,
        owner,
        course,
        plan,
        targets,
        changes: targets.flatMap(({ lessonId, state }) =>
            state === "final" ? [] : [lessonId],
        ),
    };
}

function omit(document, fields) {
    const excluded = new Set(fields);
    return Object.fromEntries(
        Object.entries(document).filter(([key]) => !excluded.has(key)),
    );
}

/**
 * Everything this migration must leave byte-identical. Scoped to the records a
 * `lessons.updateOne` could plausibly reach; a full production scan would add
 * load without adding safety.
 */
async function captureProtectedState(db, plan) {
    const lessons = await db
        .collection("lessons")
        .find({ domain: plan.domain._id, courseId: COURSE_ID })
        .sort({ lessonId: 1 })
        .toArray();
    return {
        domain: await db
            .collection("domains")
            .findOne({ _id: plan.domain._id }),
        owner: await db.collection("users").findOne({ _id: plan.owner._id }),
        course: await db
            .collection("courses")
            .findOne({ _id: plan.course._id }),
        plan: await db
            .collection("paymentplans")
            .findOne({ _id: plan.plan._id }),
        otherLessons: lessons.filter(
            ({ lessonId }) => !TARGET_LESSON_IDS.includes(lessonId),
        ),
        targetIdentities: lessons
            .filter(({ lessonId }) => TARGET_LESSON_IDS.includes(lessonId))
            .map((lesson) => omit(lesson, ["content", "updatedAt"])),
    };
}

async function verifyLessons(db, plan) {
    const lessons = await db
        .collection("lessons")
        .find({ domain: plan.domain._id, courseId: COURSE_ID })
        .toArray();
    assert(
        lessons.length === EXPECTED_LESSON_IDS.length &&
            isDeepStrictEqual(
                lessons.map(({ lessonId }) => lessonId).sort(),
                [...EXPECTED_LESSON_IDS].sort(),
            ),
        "Managed lesson identity set is invalid",
    );
    const byId = new Map(lessons.map((lesson) => [lesson.lessonId, lesson]));
    for (const target of plan.targets) {
        const existing = byId.get(target.lessonId);
        assert(
            lessonIdentityIsSafe(
                existing,
                target.identity,
                plan.domain._id,
                plan.owner.userId,
            ) && isDeepStrictEqual(existing.content, target.finalContent),
            "Managed lesson verification failed",
        );
    }
}

async function apply(db, plan) {
    const before = await captureProtectedState(db, plan);
    let applied = 0;
    for (const target of plan.targets) {
        if (target.state === "final") continue;
        const { identity } = target;
        const result = await db.collection("lessons").updateOne(
            {
                _id: target.existing._id,
                domain: plan.domain._id,
                courseId: COURSE_ID,
                lessonId: target.lessonId,
                creatorId: plan.owner.userId,
                title: identity.title,
                type: identity.type,
                groupId: identity.groupId,
                requiresEnrollment: identity.requiresEnrollment,
                downloadable: identity.downloadable,
                published: identity.published,
                content: target.baselineContent,
            },
            { $set: { content: target.finalContent, updatedAt: new Date() } },
        );
        assert(
            result.matchedCount === 1 && result.modifiedCount === 1,
            "Managed lesson changed during apply",
        );
        const readBack = await db
            .collection("lessons")
            .findOne({ _id: target.existing._id });
        assert(
            lessonIdentityIsSafe(
                readBack,
                identity,
                plan.domain._id,
                plan.owner.userId,
            ) && isDeepStrictEqual(readBack.content, target.finalContent),
            "Managed lesson verification failed",
        );
        applied += 1;
    }
    await verifyLessons(db, plan);
    assert(
        isDeepStrictEqual(await captureProtectedState(db, plan), before),
        "Protected state changed during apply",
    );
    return applied;
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
        const applied = mode === "apply" ? await apply(db, plan) : 0;
        console.log(
            `notes-humanization-01-02-migration mode=${mode} planned=${plan.changes.length} applied=${applied}`,
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
    console.error("Notes humanisation migration failed unexpectedly");
    process.exitCode = 1;
});
