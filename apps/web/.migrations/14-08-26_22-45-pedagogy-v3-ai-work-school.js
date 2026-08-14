/**
 * Applies the reviewed pedagogy-v3 lesson content and homepage without
 * rewriting learner, commercial, publication, or owner-managed state.
 *
 * Usage: node 14-08-26_22-45-pedagogy-v3-ai-work-school.js --dry-run|--apply
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import mongoose from "mongoose";

const TARGET_DOMAIN = "main";
const COURSE_ID = "course_ai_for_actual_work_v1";
const PLAN_ID = "plan_ai_for_actual_work_free_v1";
const MIGRATION_ID = "14-08-26_22-45-pedagogy-v3-ai-work-school";
const BASELINE_ID = "14-08-26_20-00-expand-ai-work-school";
const EXPECTED_HASHES = {
    course: "d7ba05db036b170cd9513c5daa3de725701c45b8bea65ceff7ddb89ebc86651f",
    site: "1325b78a4d6d42d9112e30971a6c174cf9d24037683f84528daf7d370c9b7131",
    media: "7d06f50792dfb09ce4b58272398a5c6c82e03c5c62bf57f9c9ac4ab34912b2cb",
    baselineCourse:
        "79e4ee924ff05e969cb0a5ed9de541c814343e55ad711786316972b9aabd1caf",
    baselineSite:
        "b7b2b8bf40b01ef7d47ffec2da7e30e0f4d85e49442420c56ef7c9ad953fb399",
    baselineMedia:
        "77546d8802303b32fb30e075ce11cf687043ac0133b25564e13d08c215180e88",
};
const SNAPSHOT_URLS = {
    course: new URL(`./${MIGRATION_ID}.course.json`, import.meta.url),
    site: new URL(`./${MIGRATION_ID}.site.json`, import.meta.url),
    media: new URL(`./${MIGRATION_ID}.media.json`, import.meta.url),
    baselineCourse: new URL(`./${BASELINE_ID}.course.json`, import.meta.url),
    baselineSite: new URL(`./${BASELINE_ID}.site.json`, import.meta.url),
    baselineMedia: new URL(`./${BASELINE_ID}.media-site.json`, import.meta.url),
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
            "Usage: pedagogy-v3-ai-work-school.js --dry-run|--apply",
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
            Object.entries(SNAPSHOT_URLS).map(async ([key, url]) => [
                key,
                await readFile(url),
            ]),
        );
        const sourceBytes = Object.fromEntries(entries);
        return {
            sourceBytes,
            ...Object.fromEntries(
                entries.map(([key, bytes]) => [
                    key,
                    JSON.parse(bytes.toString("utf8")),
                ]),
            ),
        };
    } catch {
        throw new SafeMigrationError("Pedagogy-v3 snapshots could not be read");
    }
}

function nonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function flattenCourse(snapshot) {
    assert(snapshot?.schemaVersion === 1, "Course snapshot schema is invalid");
    const course = snapshot.course;
    assert(
        course?.courseId === COURSE_ID &&
            nonEmptyString(course.title) &&
            nonEmptyString(course.slug) &&
            Array.isArray(course.sections),
        "Course snapshot identity is invalid",
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
                !groupIds.has(section.groupId),
            "Course group snapshot is invalid",
        );
        groupIds.add(section.groupId);
        for (const lesson of section.lessons) {
            assert(
                nonEmptyString(lesson.lessonId) &&
                    nonEmptyString(lesson.title) &&
                    lesson.type === "text" &&
                    typeof lesson.requiresEnrollment === "boolean" &&
                    typeof lesson.published === "boolean" &&
                    lesson.content?.type === "doc" &&
                    Array.isArray(lesson.content.content) &&
                    !lessonIds.has(lesson.lessonId),
                "Course lesson snapshot is invalid",
            );
            lessonIds.add(lesson.lessonId);
            lessons.push({ ...lesson, groupId: section.groupId });
        }
    }
    return { course, lessons };
}

function buildCourseManaged(flattened) {
    return {
        lessons: flattened.lessons.map(({ lessonId }) => lessonId),
        groups: flattened.course.sections.map((section) => ({
            _id: section.groupId,
            name: section.title,
            rank: section.rank,
            collapsed: false,
            lessonsOrder: section.lessons.map(({ lessonId }) => lessonId),
        })),
    };
}

function imageNodes(flattened) {
    return flattened.lessons.flatMap((lesson) =>
        lesson.content.content
            .filter(({ type }) => type === "image")
            .map((node) => ({ lessonId: lesson.lessonId, node })),
    );
}

function mediaIdFromUrl(value) {
    assert(nonEmptyString(value), "Media URL is invalid");
    let url;
    try {
        url = new URL(value);
    } catch {
        throw new SafeMigrationError("Media URL is invalid");
    }
    assert(
        url.protocol === "https:" &&
            url.hostname === "media.bhekani.com" &&
            url.search === "" &&
            url.hash === "",
        "Media URL is not reviewed",
    );
    const match = url.pathname.match(/^\/p\/([^/]+)\/main\.webp$/);
    assert(match, "Media URL path is invalid");
    return match[1];
}

function validateMediaObject(media) {
    assert(
        media?.access === "public" &&
            media.mimeType === "image/webp" &&
            nonEmptyString(media.mediaId) &&
            nonEmptyString(media.originalFileName) &&
            nonEmptyString(media.caption) &&
            Number.isSafeInteger(media.size) &&
            media.size > 0,
        "MediaLit entry is invalid",
    );
    assert(
        mediaIdFromUrl(media.file) === media.mediaId,
        "MediaLit file identity is invalid",
    );
    let thumbnail;
    try {
        thumbnail = new URL(media.thumbnail);
    } catch {
        throw new SafeMigrationError("MediaLit thumbnail is invalid");
    }
    assert(
        thumbnail.protocol === "https:" &&
            thumbnail.hostname === "media.bhekani.com" &&
            thumbnail.pathname === `/p/${media.mediaId}/thumb.webp` &&
            thumbnail.search === "" &&
            thumbnail.hash === "",
        "MediaLit thumbnail is invalid",
    );
}

function collectNestedMediaIds(value, output = new Set()) {
    if (Array.isArray(value)) {
        for (const item of value) collectNestedMediaIds(item, output);
        return output;
    }
    if (!value || typeof value !== "object") return output;
    if (nonEmptyString(value.mediaId) && nonEmptyString(value.file)) {
        output.add(value.mediaId);
    }
    for (const child of Object.values(value)) {
        collectNestedMediaIds(child, output);
    }
    return output;
}

function validateFrozenInputs(inputs) {
    assert(
        Object.entries(EXPECTED_HASHES).every(
            ([key, expected]) => sha256(inputs.sourceBytes[key]) === expected,
        ),
        "Frozen source hash is invalid",
    );
    const baseline = flattenCourse(inputs.baselineCourse);
    const desired = flattenCourse(inputs.course);
    assert(
        baseline.lessons.length === 22 && desired.lessons.length === 22,
        "Pedagogy-v3 lesson count is invalid",
    );
    assert(
        baseline.course.title === desired.course.title &&
            baseline.course.slug === desired.course.slug &&
            baseline.course.courseId === desired.course.courseId &&
            baseline.course.sections.length === desired.course.sections.length,
        "Course identity changed in pedagogy-v3",
    );
    assert(
        new Set(baseline.course.sections.map(({ groupId }) => groupId)).size ===
            desired.course.sections.length &&
            desired.course.sections.every(({ groupId }) =>
                baseline.course.sections.some(
                    (section) => section.groupId === groupId,
                ),
            ),
        "Course group identity changed in pedagogy-v3",
    );
    for (const desiredLesson of desired.lessons) {
        const oldLesson = baseline.lessons.find(
            ({ lessonId }) => lessonId === desiredLesson.lessonId,
        );
        assert(oldLesson, "Lesson identity changed in pedagogy-v3");
        assert(
            oldLesson.title === desiredLesson.title &&
                oldLesson.type === desiredLesson.type &&
                oldLesson.groupId === desiredLesson.groupId &&
                oldLesson.requiresEnrollment ===
                    desiredLesson.requiresEnrollment &&
                oldLesson.published === desiredLesson.published &&
                !isDeepStrictEqual(oldLesson.content, desiredLesson.content),
            "Pedagogy-v3 changed an unowned lesson field",
        );
    }

    const oldImages = imageNodes(baseline);
    const desiredImages = imageNodes(desired);
    const oldImageIds = new Set(
        oldImages.map(({ node }) => mediaIdFromUrl(node.attrs?.src)),
    );
    const desiredImageIds = desiredImages.map(({ node }) =>
        mediaIdFromUrl(node.attrs?.src),
    );
    const newImageIds = desiredImageIds.filter((id) => !oldImageIds.has(id));
    assert(
        oldImages.length === 7 &&
            desiredImages.length === 17 &&
            newImageIds.length === 10 &&
            new Set(desiredImageIds).size === 17,
        "Lesson image relationship is invalid",
    );
    for (const { node } of desiredImages) {
        assert(
            nonEmptyString(node.attrs?.alt) &&
                nonEmptyString(node.attrs?.title),
            "Lesson image accessibility data is invalid",
        );
    }

    const media = inputs.media;
    assert(
        media?.schemaVersion === 1 &&
            media.group === "ai-work-school-v3" &&
            media.cdnHost === "media.bhekani.com" &&
            Array.isArray(media.entries) &&
            media.entries.length === 21,
        "MediaLit manifest identity is invalid",
    );
    const entriesById = new Map();
    const keys = new Set();
    for (const entry of media.entries) {
        assert(
            nonEmptyString(entry.key) &&
                !keys.has(entry.key) &&
                nonEmptyString(entry.sourcePath) &&
                /^[a-f0-9]{64}$/.test(entry.sha256) &&
                entry.bytes === entry.media?.size &&
                entry.mimeType === "image/webp",
            "MediaLit entry contract is invalid",
        );
        keys.add(entry.key);
        validateMediaObject(entry.media);
        assert(
            !entriesById.has(entry.media.mediaId),
            "MediaLit identity is duplicated",
        );
        entriesById.set(entry.media.mediaId, entry);
    }
    assert(
        newImageIds.every((id) => entriesById.has(id)) &&
            media.entries.filter(({ media: { mediaId } }) =>
                newImageIds.includes(mediaId),
            ).length === 10,
        "New MediaLit v3 entry set is invalid",
    );
    for (const { node } of desiredImages) {
        const entry = entriesById.get(mediaIdFromUrl(node.attrs.src));
        assert(
            entry?.media.file === node.attrs.src,
            "Lesson image differs from MediaLit manifest",
        );
    }

    const baselineSite = inputs.baselineSite;
    const desiredSite = inputs.site;
    assert(
        baselineSite?.schemaVersion === 1 &&
            desiredSite?.schemaVersion === 1 &&
            baselineSite.siteKey === "ai-work-school" &&
            desiredSite.siteKey === "ai-work-school" &&
            baselineSite.page?.pageId === "homepage" &&
            desiredSite.page?.pageId === "homepage" &&
            Array.isArray(baselineSite.page.layout) &&
            Array.isArray(desiredSite.page.layout) &&
            isDeepStrictEqual(
                baselineSite.sharedWidgets,
                desiredSite.sharedWidgets,
            ),
        "Homepage snapshot identity is invalid",
    );
    for (const mediaId of collectNestedMediaIds(desiredSite.page.layout)) {
        assert(entriesById.has(mediaId), "Homepage MediaLit entry is missing");
    }
    const referencedMediaIds = new Set([
        ...desiredImageIds,
        ...collectNestedMediaIds(desiredSite.page.layout),
        desired.course.featuredImage?.mediaId,
    ]);
    assert(
        referencedMediaIds.size === 21 &&
            media.entries.every(({ media: { mediaId } }) =>
                referencedMediaIds.has(mediaId),
            ),
        "MediaLit manifest has an unowned entry",
    );
    assert(
        !isDeepStrictEqual(baselineSite.page.layout, desiredSite.page.layout),
        "Homepage layout did not change",
    );
    return {
        baseline,
        desired,
        baselineCourse: buildCourseManaged(baseline),
        desiredCourse: buildCourseManaged(desired),
        baselineHomepage: {
            layout: baselineSite.page.layout,
            draftLayout: baselineSite.page.layout,
        },
        desiredHomepage: {
            layout: desiredSite.page.layout,
            draftLayout: desiredSite.page.layout,
        },
    };
}

function sameId(left, right) {
    return String(left) === String(right);
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
        nonEmptyString(owner.userId) && nonEmptyString(owner.name),
        "Domain owner identity is invalid",
    );

    const course = requireSingle(
        await db
            .collection("courses")
            .find({ courseId: COURSE_ID })
            .limit(2)
            .toArray(),
        "Managed Course preflight failed",
    );
    assert(
        sameId(course.domain, domain._id) &&
            course.creatorId === owner.userId &&
            course.type === "course" &&
            course.defaultPaymentPlan === PLAN_ID,
        "Managed Course identity is invalid",
    );
    const paymentPlan = requireSingle(
        await db
            .collection("paymentplans")
            .find({ planId: PLAN_ID })
            .limit(2)
            .toArray(),
        "External free plan preflight failed",
    );
    assert(
        sameId(paymentPlan.domain, domain._id) &&
            paymentPlan.entityId === COURSE_ID &&
            paymentPlan.entityType === "course" &&
            paymentPlan.type === "free" &&
            paymentPlan.internal === false &&
            paymentPlan.archived === false,
        "External free plan is invalid",
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
        .sort({ lessonId: 1 })
        .toArray();
    assert(
        lessonMatches.every(
            ({ domain: lessonDomain, courseId, lessonId }) =>
                sameId(lessonDomain, domain._id) &&
                courseId === COURSE_ID &&
                expectedIds.includes(lessonId),
        ),
        "Managed lesson identity collides with existing data",
    );
    const lessons = lessonMatches;
    assert(
        lessons.length === 22 &&
            lessons.every(({ lessonId }) => expectedIds.includes(lessonId)),
        "Managed lesson set is invalid",
    );
    const lessonPlans = lessons.map((existing) => {
        const baseline = validated.baseline.lessons.find(
            ({ lessonId }) => lessonId === existing.lessonId,
        );
        const desired = validated.desired.lessons.find(
            ({ lessonId }) => lessonId === existing.lessonId,
        );
        assert(
            baseline &&
                desired &&
                existing.creatorId === owner.userId &&
                existing.groupId === baseline.groupId &&
                existing.type === baseline.type,
            "Managed lesson identity is invalid",
        );
        return {
            existing,
            baselineContent: baseline.content,
            desiredContent: desired.content,
            state: classifyManaged(
                existing.content,
                baseline.content,
                desired.content,
                "Managed lesson has owner edits",
            ),
        };
    });

    const courseStates = {
        lessons: classifyManaged(
            course.lessons,
            validated.baselineCourse.lessons,
            validated.desiredCourse.lessons,
            "Managed Course has owner edits",
        ),
        groups: classifyManaged(
            course.groups,
            validated.baselineCourse.groups,
            validated.desiredCourse.groups,
            "Managed Course has owner edits",
        ),
    };
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
            homepage.creatorId === owner.userId,
        "Homepage identity is invalid",
    );
    const homepageStates = {
        layout: classifyManaged(
            homepage.layout,
            validated.baselineHomepage.layout,
            validated.desiredHomepage.layout,
            "Managed homepage has owner edits",
        ),
        draftLayout: classifyManaged(
            homepage.draftLayout,
            validated.baselineHomepage.draftLayout,
            validated.desiredHomepage.draftLayout,
            "Managed homepage has owner edits",
        ),
    };
    const lessonChanges = lessonPlans.filter(
        ({ state }) => state === "baseline",
    ).length;
    return {
        domain,
        owner,
        course,
        lessons,
        lessonPlans,
        courseStates,
        homepage,
        homepageStates,
        validated,
        changes:
            lessonChanges +
            (Object.values(courseStates).every((state) => state === "final")
                ? 0
                : 1) +
            (Object.values(homepageStates).every((state) => state === "final")
                ? 0
                : 1),
    };
}

function omitFields(document, fields) {
    const excluded = new Set(fields);
    return Object.fromEntries(
        Object.entries(document).filter(([key]) => !excluded.has(key)),
    );
}

function captureProtected(plan) {
    return {
        course: omitFields(plan.course, ["lessons", "groups"]),
        lessons: plan.lessons.map((lesson) => omitFields(lesson, ["content"])),
        homepage: omitFields(plan.homepage, ["layout", "draftLayout"]),
    };
}

async function verifyProtected(db, plan, expected) {
    const course = await db.collection("courses").findOne({
        _id: plan.course._id,
    });
    const lessons = await db
        .collection("lessons")
        .find({ domain: plan.domain._id, courseId: COURSE_ID })
        .sort({ lessonId: 1 })
        .toArray();
    const homepage = await db.collection("pages").findOne({
        _id: plan.homepage._id,
    });
    assert(
        isDeepStrictEqual(
            {
                course: omitFields(course, ["lessons", "groups"]),
                lessons: lessons.map((lesson) =>
                    omitFields(lesson, ["content"]),
                ),
                homepage: omitFields(homepage, ["layout", "draftLayout"]),
            },
            expected,
        ),
        "Protected state changed during apply",
    );
}

async function verifyCourseState(db, plan) {
    const lessons = await db
        .collection("lessons")
        .find({ domain: plan.domain._id, courseId: COURSE_ID })
        .toArray();
    assert(lessons.length === 22, "Lesson verification failed");
    for (const lesson of lessons) {
        const desired = plan.validated.desired.lessons.find(
            ({ lessonId }) => lessonId === lesson.lessonId,
        );
        assert(
            desired && isDeepStrictEqual(lesson.content, desired.content),
            "Lesson verification failed",
        );
    }
    const course = await db.collection("courses").findOne({
        _id: plan.course._id,
    });
    assert(
        isDeepStrictEqual(
            course?.lessons,
            plan.validated.desiredCourse.lessons,
        ) &&
            isDeepStrictEqual(
                course?.groups,
                plan.validated.desiredCourse.groups,
            ),
        "Course verification failed",
    );
}

async function updateLessons(db, plan) {
    const changes = plan.lessonPlans.filter(
        ({ state }) => state === "baseline",
    );
    if (changes.length === 0) return;
    const result = await db.collection("lessons").bulkWrite(
        changes.map(({ existing, baselineContent, desiredContent }) => ({
            updateOne: {
                filter: { _id: existing._id, content: baselineContent },
                update: { $set: { content: desiredContent } },
            },
        })),
        { ordered: true },
    );
    assert(
        result.matchedCount === changes.length,
        "Managed lesson changed during apply",
    );
}

async function updateCourse(db, plan) {
    if (Object.values(plan.courseStates).every((state) => state === "final")) {
        return;
    }
    const current = await db.collection("courses").findOne({
        _id: plan.course._id,
    });
    assert(current, "Managed Course disappeared during apply");
    classifyManaged(
        current.lessons,
        plan.validated.baselineCourse.lessons,
        plan.validated.desiredCourse.lessons,
        "Managed Course changed during apply",
    );
    classifyManaged(
        current.groups,
        plan.validated.baselineCourse.groups,
        plan.validated.desiredCourse.groups,
        "Managed Course changed during apply",
    );
    const result = await db.collection("courses").updateOne(
        {
            _id: current._id,
            lessons: current.lessons,
            groups: current.groups,
        },
        { $set: plan.validated.desiredCourse },
    );
    assert(result.matchedCount === 1, "Managed Course changed during update");
}

async function updateHomepage(db, plan) {
    if (
        Object.values(plan.homepageStates).every((state) => state === "final")
    ) {
        return;
    }
    const current = await db.collection("pages").findOne({
        _id: plan.homepage._id,
    });
    assert(current, "Managed homepage disappeared during apply");
    classifyManaged(
        current.layout,
        plan.validated.baselineHomepage.layout,
        plan.validated.desiredHomepage.layout,
        "Managed homepage changed during apply",
    );
    classifyManaged(
        current.draftLayout,
        plan.validated.baselineHomepage.draftLayout,
        plan.validated.desiredHomepage.draftLayout,
        "Managed homepage changed during apply",
    );
    const result = await db.collection("pages").updateOne(
        {
            _id: current._id,
            layout: current.layout,
            draftLayout: current.draftLayout,
        },
        { $set: plan.validated.desiredHomepage },
    );
    assert(result.matchedCount === 1, "Managed homepage changed during update");
}

async function applyPlan(db, plan) {
    const protectedState = captureProtected(plan);
    await updateLessons(db, plan);
    await updateCourse(db, plan);
    await verifyCourseState(db, plan);
    await verifyProtected(db, plan, protectedState);
    if (
        process.env.NODE_ENV === "test" &&
        process.env.PEDAGOGY_V3_TEST_FAIL_AT === "before-homepage"
    ) {
        throw new Error("Injected failure before homepage");
    }
    await updateHomepage(db, plan);
    await verifyCourseState(db, plan);
    const homepage = await db.collection("pages").findOne({
        _id: plan.homepage._id,
    });
    assert(
        isDeepStrictEqual(
            {
                layout: homepage?.layout,
                draftLayout: homepage?.draftLayout,
            },
            plan.validated.desiredHomepage,
        ),
        "Homepage verification failed",
    );
    await verifyProtected(db, plan, protectedState);
    return plan.changes;
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
            `pedagogy-v3-migration mode=${mode} planned=${plan.changes} applied=${applied}`,
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
    console.error("Pedagogy-v3 migration failed unexpectedly");
    process.exitCode = 1;
});
