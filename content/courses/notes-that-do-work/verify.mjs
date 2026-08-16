import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const courseDir = dirname(fileURLToPath(import.meta.url));
const coursePath = resolve(courseDir, "course.json");
const sourceMap = readFileSync(resolve(courseDir, "source-map.md"), "utf8");
const manifest = JSON.parse(readFileSync(coursePath, "utf8"));

const expectedSections = [
    {
        key: "capture-with-a-purpose",
        groupId: "group_notes_that_do_work_01",
        title: "Capture with a purpose",
        lessons: [
            [
                "find-where-useful-thinking-disappears",
                "lesson_notes_that_do_work_01",
                "Find where useful thinking disappears",
                "knowledge-leak-map",
                [],
                "work-leak-map.md",
            ],
            [
                "turn-a-capture-into-a-source-note",
                "lesson_notes_that_do_work_02",
                "Turn a capture into a source note",
                "source-note-in-own-words",
                ["knowledge-leak-map"],
                "source-note.md",
            ],
        ],
    },
    {
        key: "make-notes-reusable",
        groupId: "group_notes_that_do_work_02",
        title: "Make notes reusable",
        lessons: [
            [
                "give-each-note-one-job",
                "lesson_notes_that_do_work_03",
                "Give each note one job",
                "note-job-selection",
                ["source-note-in-own-words"],
                "note-job-decision.md",
            ],
            [
                "write-one-idea-so-it-can-stand-alone",
                "lesson_notes_that_do_work_04",
                "Write one idea so it can stand alone",
                "reusable-concept-note",
                ["note-job-selection"],
                "concept-note.md",
            ],
        ],
    },
    {
        key: "connect-as-the-work-demands",
        groupId: "group_notes_that_do_work_03",
        title: "Connect as the work demands",
        lessons: [
            [
                "use-tags-properties-and-links-for-different-jobs",
                "lesson_notes_that_do_work_05",
                "Use tags, properties and links for different jobs",
                "relationship-semantics",
                ["reusable-concept-note"],
                "relationship-map.md",
            ],
            [
                "search-before-creating",
                "lesson_notes_that_do_work_06",
                "Search before creating",
                "search-before-create",
                ["relationship-semantics"],
                "existing-note-decision.md",
            ],
        ],
    },
    {
        key: "think-on-the-page",
        groupId: "group_notes_that_do_work_04",
        title: "Think on the page",
        lessons: [
            [
                "write-to-discover-what-you-think",
                "lesson_notes_that_do_work_07",
                "Write to discover what you think",
                "discovery-writing",
                ["search-before-create"],
                "thinking-draft.md",
            ],
            [
                "build-a-synthesis-note-around-a-live-question",
                "lesson_notes_that_do_work_08",
                "Build a synthesis note around a live question",
                "question-led-synthesis",
                ["discovery-writing"],
                "synthesis-hub.md",
            ],
        ],
    },
    {
        key: "work-with-ai-from-checked-notes",
        groupId: "group_notes_that_do_work_06",
        title: "Work with AI from checked notes",
        lessons: [
            [
                "give-ai-a-source-pack-not-your-whole-archive",
                "lesson_notes_that_do_work_11",
                "Give AI a source pack, not your whole archive",
                "bounded-ai-source-pack",
                ["question-led-synthesis"],
                "ai-source-brief.md",
            ],
            [
                "review-the-answer-before-it-joins-your-notes",
                "lesson_notes_that_do_work_12",
                "Review the answer before it joins your notes",
                "reviewed-ai-reentry",
                ["bounded-ai-source-pack"],
                "change-review.md",
            ],
        ],
    },
    {
        key: "ship-from-the-system",
        groupId: "group_notes_that_do_work_05",
        title: "Ship from the system",
        lessons: [
            [
                "move-from-notes-to-an-outline-and-a-decision",
                "lesson_notes_that_do_work_09",
                "Move from notes to an outline and a decision",
                "notes-to-output",
                ["reviewed-ai-reentry"],
                "working-brief.md",
            ],
            [
                "close-the-loop-so-the-next-job-starts-ahead",
                "lesson_notes_that_do_work_10",
                "Close the loop so the next job starts ahead",
                "accretion-loop",
                ["notes-to-output"],
                "handover.md",
            ],
        ],
    },
];

const requiredHeadings = [
    "Outcome",
    "Before you continue",
    "See it",
    "Try it with guidance",
    "What you will make",
    "Try it on your work",
    "Teach it back",
    "Try a changed case",
    "Check your work",
    "If you get stuck",
];

const teachingContracts = [
    { review: assertLessonOneReviewContract },
    { review: assertLessonTwoReviewContract },
    {
        prediction: "write the next action it should make easier",
        guidance: "Write four possible next uses beside it",
        teachBack: "note jobs are better chosen by next use",
        changedCase: "decision log that includes exact policy extracts",
    },
    {
        prediction:
            "what a reader would have to know from the original project",
        guidance: "Rewrite the title as a complete claim",
        teachBack: "one idea is not the same as one sentence",
        changedCase: "applies only during a particular supplier contract",
    },
    {
        prediction: "predict whether you would use a tag, a property or a link",
        guidance: "Write the question each must answer",
        teachBack: "why a backlink is not the same as a narrated relationship",
        changedCase: "shared spreadsheet that has columns and filters",
    },
    {
        prediction: "List three other words a colleague might use",
        guidance: "Put the first five plausible candidates into a small table",
        teachBack: "search-before-create is not a rule against new notes",
        changedCase: "same issue for different jurisdictions",
    },
    {
        prediction: "Underline the sentence you trust least",
        guidance: "Add a reason after every major claim",
        teachBack:
            "different jobs of discovery writing and presentation writing",
        changedCase: "senior lawyer already knows the likely answer",
    },
    {
        prediction: "the change each one should make to the answer",
        guidance: "Remove any note that cannot finish the sentence",
        teachBack: "differs from a folder, index and summary",
        changedCase: "whether a variance needs escalation",
    },
    {
        prediction: "which notes you would give the AI and which you would keep out",
        guidance: "Write the job before you choose the notes",
        teachBack: "why a smaller checked source pack is better than a whole archive",
        changedCase: "approved AI tool cannot open internal links",
    },
    {
        prediction: "which sentences you would allow back into your notes",
        guidance: "Compare each material claim with the source pack",
        teachBack: "why a fluent answer is still only a proposed change",
        changedCase: "draft correctly combines two sources but drops an exception",
    },
    {
        prediction:
            "which of those serves your memory rather than their decision",
        guidance: "Turn each reasoning group in your synthesis into a question",
        teachBack: "why the brief should not preserve the order",
        changedCase: "advice outline whose formal structure is prescribed",
    },
    {
        prediction: "which existing note will save you the most work",
        guidance: "Start with search-before-create",
        teachBack:
            "a checked AI source pack and claim review feed the brief and handover when AI use is approved",
        changedCase: "after a policy, contract or reporting rule has changed",
    },
];

function textOf(node) {
    if (!node || typeof node !== "object") return "";
    return [node.text ?? "", ...(node.content ?? []).map(textOf)]
        .join(" ")
        .replaceAll(/\s+/g, " ")
        .trim();
}

function walk(node, visit) {
    if (!node || typeof node !== "object") return;
    visit(node);
    for (const child of node.content ?? []) walk(child, visit);
}

function headingsOf(content) {
    return content.content
        .filter((node) => node.type === "heading")
        .map(textOf);
}

function textAfterHeading(content, heading) {
    const index = content.content.findIndex(
        (node) => node.type === "heading" && textOf(node) === heading,
    );
    return textOf(content.content[index + 1]);
}

function linksOf(content) {
    const links = [];
    walk(content, (node) => {
        if (node.type !== "text") return;
        for (const mark of node.marks ?? []) {
            if (mark.type === "link") {
                links.push({ text: node.text, href: mark.attrs?.href });
            }
        }
    });
    return links;
}

function imagesOf(content) {
    const images = [];
    walk(content, (node) => {
        if (node.type === "image") images.push(node);
    });
    return images;
}

function assertTeachingSequence(lesson) {
    const headings = headingsOf(lesson.content);
    let cursor = -1;
    for (const required of requiredHeadings) {
        const index = headings.indexOf(required);
        assert.ok(index > cursor, `${lesson.key} heading order: ${required}`);
        assert.equal(
            headings.filter((heading) => heading === required).length,
            1,
            `${lesson.key} has one ${required} heading`,
        );
        cursor = index;
    }

    const beforeIndex = lesson.content.content.findIndex(
        (node) =>
            node.type === "heading" && textOf(node) === "Before you continue",
    );
    const seeIndex = lesson.content.content.findIndex(
        (node) => node.type === "heading" && textOf(node) === "See it",
    );
    assert.equal(
        lesson.content.content[beforeIndex + 1]?.type,
        "blockquote",
        `${lesson.key} requires a written prediction blockquote`,
    );
    assert.ok(
        beforeIndex + 1 < seeIndex,
        `${lesson.key} predicts before explanation`,
    );

    const guidance = lesson.content.content.findIndex(
        (node) =>
            node.type === "heading" && textOf(node) === "Try it with guidance",
    );
    const make = lesson.content.content.findIndex(
        (node) =>
            node.type === "heading" && textOf(node) === "What you will make",
    );
    const guidanceText = lesson.content.content
        .slice(guidance + 1, make)
        .map(textOf)
        .join(" ");
    assert.match(
        guidanceText,
        /Stop and record:/,
        `${lesson.key} needs a stop-and-record checkpoint`,
    );

    const hintIndex = lesson.content.content.findIndex(
        (node) =>
            node.type === "heading" && textOf(node) === "If you get stuck",
    );
    const hintList = lesson.content.content[hintIndex + 1];
    assert.equal(
        hintList?.type,
        "orderedList",
        `${lesson.key} hints are ordered`,
    );
    assert.equal(
        hintList.content?.length,
        3,
        `${lesson.key} has exactly three hints`,
    );
}

function hintTextsOf(lesson) {
    const hintIndex = lesson.content.content.findIndex(
        (node) =>
            node.type === "heading" && textOf(node) === "If you get stuck",
    );
    assert.notEqual(
        hintIndex,
        -1,
        `${lesson.key} keeps the If you get stuck heading`,
    );
    const hintList = lesson.content.content[hintIndex + 1];
    assert.equal(
        hintList?.type,
        "orderedList",
        `${lesson.key} follows the hint heading with an ordered list`,
    );
    return hintList.content.map(textOf);
}

function assertNoUnsafeSensitiveDataInstruction(lesson) {
    const lessonSegments = [
        lesson.outcome,
        lesson.exercise,
        lesson.artifact.description,
        ...lesson.verification,
        ...lesson.content.content.flatMap((node) =>
            ["bulletList", "orderedList"].includes(node.type)
                ? node.content.map(textOf)
                : [textOf(node)],
        ),
    ].flatMap((text) =>
        text.split(
            /(?<=[.!?;])\s+|,\s+(?=(?:then|but|however|instead)\b)|\s+(?:and|while)\s+(?=(?:never|do not|don't|does not|must not|cannot|can't|without)\b)/u,
        ),
    );
    const sensitiveMaterial =
        /\b(?:confidential|personal|client|employee|financial|sensitive)\b/i;
    const unapprovedDestination =
        /\b(?:new|unapproved|public|personal|external|third-party|cloud|shared|AI)\b.{0,24}\b(?:tool|service|surface|app|location|system|drive|workspace|chatbot)\b/i;
    const riskyAction =
        /\b(?:copy(?:ing)?|upload(?:ing)?|mov(?:e|ing)|past(?:e|ing)|send(?:ing)?|stor(?:e|ing)|sync(?:ing)?|export(?:ing)?|shar(?:e|ing)|email(?:ing)?|publish(?:ing)?|attach(?:ing)?|dump(?:ing)?)\b/i;
    const safetyBeforeAction =
        /\b(?:do not|don't|does not|must not|never|cannot|can't|without)\b[^.!?;:]{0,18}$/i;

    for (const sentence of lessonSegments) {
        if (
            !sensitiveMaterial.test(sentence) ||
            !unapprovedDestination.test(sentence) ||
            !riskyAction.test(sentence)
        ) {
            continue;
        }

        for (const match of sentence.matchAll(
            new RegExp(riskyAction.source, "gi"),
        )) {
            assert.match(
                sentence.slice(0, match.index),
                safetyBeforeAction,
                `${lesson.key} rejects unsafe instructions for sensitive material: ${sentence}`,
            );
        }
    }
}

function assertNoTeachingDecisionNegation(lesson) {
    const lessonText = [
        lesson.outcome,
        lesson.exercise,
        lesson.artifact.description,
        ...lesson.verification,
        textOf(lesson.content),
    ]
        .join(" ")
        .replaceAll(/\s+/g, " ");
    assert.doesNotMatch(
        lessonText,
        /\b(?:ignore|disregard|invent|discard)\b.{0,60}\b(?:work|question|source|context|evidence)\b/i,
        `${lesson.key} does not negate its learner decision`,
    );
    assert.doesNotMatch(
        lessonText,
        /\b(?:work|questions?|details|sources?|evidence|context)\b.{0,24}\b(?:do(?:es)? not|don't|doesn't|need not|needn't)\b.{0,16}\bmatter\b/i,
        `${lesson.key} keeps evidence and context material to the decision`,
    );
    assert.doesNotMatch(
        lessonText,
        /\b(?:question|source note|prediction|check|context|evidence)\b.{0,40}\b(?:optional|irrelevant|unnecessary|(?:may|can|should) be (?:skipped|ignored|invented|discarded))\b|\byou (?:may|can|should) (?:skip|ignore|invent|discard)\b.{0,40}\b(?:question|source|check|context|evidence)\b|\beither (?:way|approach) works\b/i,
        `${lesson.key} does not weaken its learner decision`,
    );
}

function assertLessonOneReviewContract(lesson) {
    assert.match(
        lesson.outcome,
        /\bquestion\b/i,
        "lesson 01 keeps a work question",
    );
    assert.match(
        lesson.outcome,
        /\b(?:context|thinking|reasoning)\b/i,
        "lesson 01 traces useful context",
    );
    assert.match(
        lesson.outcome,
        /\b(?:disappear|lost|leak|hard to (?:find|interpret|reuse))\b/i,
        "lesson 01 locates where context becomes unavailable",
    );

    const prediction = textAfterHeading(lesson.content, "Before you continue");
    assert.match(
        prediction,
        /\b(?:write|record|note)\b/i,
        "lesson 01 prediction is written",
    );
    assert.match(
        prediction,
        /\bquestion\b/i,
        "lesson 01 prediction starts from a question",
    );
    assert.match(
        prediction,
        /\b(?:without searching|before (?:searching|looking|opening)|from memory)\b/i,
        "lesson 01 surfaces the learner's prior model before inspection",
    );
    assert.match(
        prediction,
        /\b(?:place|location|source)s?\b/i,
        "lesson 01 prediction maps where context lives",
    );

    const guidance = textAfterHeading(
        lesson.content,
        "Try it with guidance",
    );
    assert.match(guidance, /\bsource\b/i, "lesson 01 guidance starts from sources");
    assert.match(
        guidance,
        /\blocation\b/i,
        "lesson 01 guidance records where context lives",
    );
    assert.match(
        guidance,
        /\bcontribut\w*\b/i,
        "lesson 01 guidance records what each source contributes",
    );

    const teachBack = textAfterHeading(lesson.content, "Teach it back");
    assert.match(teachBack, /\bnotes\b/i, "lesson 01 teach-back starts from notes");
    assert.match(
        teachBack,
        /\brepair\w*\b/i,
        "lesson 01 teach-back explains repair rather than collection",
    );
    assert.match(
        teachBack,
        /\bleak\b/i,
        "lesson 01 teach-back explains the knowledge leak",
    );

    const changedCase = textAfterHeading(
        lesson.content,
        "Try a changed case",
    );
    assert.match(changedCase, /\blawyer\b/i, "lesson 01 transfer changes profession");
    assert.match(
        changedCase,
        /\binherit\w*\b/i,
        "lesson 01 transfer tests inherited work",
    );
    assert.match(
        changedCase,
        /\b(?:why|reason)\b/i,
        "lesson 01 transfer keeps missing reasoning as the leak",
    );

    const hints = hintTextsOf(lesson);
    assert.match(
        hints[0],
        /\b(?:last|recent|previous|earlier)\b/i,
        "lesson 01 hint 1 starts from recent work",
    );
    assert.match(
        hints[0],
        /\b(?:search|look|hunt|find)\w*\b/i,
        "lesson 01 hint 1 nudges recall of repeated search",
    );
    assert.match(
        hints[1],
        /\b(?:colleague|person|inheritor|teammate|successor|whoever)\b/i,
        "lesson 01 hint 2 supplies an inheritance frame",
    );
    assert.match(
        hints[1],
        /\b(?:ask|need|request|require)\w*\b/i,
        "lesson 01 hint 2 identifies missing context",
    );
    assert.match(
        hints[2],
        /\b(?:pick|choose|narrow|focus|settle|limit)\b/i,
        "lesson 01 hint 3 narrows the task",
    );
    assert.match(
        hints[2],
        /\b(?:reason|decision|leak|problem)\b/i,
        "lesson 01 hint 3 names a repair target",
    );

    const lessonText = textOf(lesson.content);
    assert.doesNotMatch(
        lessonText,
        /Close the lesson|deserves to survive|weekend goes into naming folders|will carry through the rest of the course/i,
        "lesson 01 excludes known generated residue",
    );
    assertNoTeachingDecisionNegation(lesson);
    assertNoUnsafeSensitiveDataInstruction(lesson);
}

function assertLessonTwoReviewContract(lesson) {
    assert.match(
        lesson.outcome,
        /\b(?:capture|highlight|extract|meeting note)\b/i,
        "lesson 02 starts from captured source material",
    );
    assert.match(
        lesson.outcome,
        /\bsource note\b/i,
        "lesson 02 produces a source note",
    );
    assert.match(
        lesson.outcome,
        /\b(?:interpretation|your words|your reading)\b/i,
        "lesson 02 separates the learner's interpretation",
    );
    assert.match(
        lesson.outcome,
        /\b(?:question|check|uncertainty)\b/i,
        "lesson 02 keeps the live use or remaining check visible",
    );

    const prediction = textAfterHeading(lesson.content, "Before you continue");
    assert.match(
        prediction,
        /\b(?:capture|highlight|extract|meeting bullet)\b/i,
        "lesson 02 prediction uses one real capture",
    );
    assert.match(
        prediction,
        /\b(?:without reopening|before (?:reopening|opening)|from memory)\b/i,
        "lesson 02 predicts before source inspection",
    );
    assert.match(
        prediction,
        /\b(?:write|record|note)\b/i,
        "lesson 02 prediction is written",
    );
    assert.match(
        prediction,
        /\b(?:question mark|cannot verify|uncertain|unsure)\b/i,
        "lesson 02 records uncertainty",
    );

    const guidance = textAfterHeading(
        lesson.content,
        "Try it with guidance",
    );
    assert.match(
        guidance,
        /\blocator\b/i,
        "lesson 02 guidance starts from a precise locator",
    );
    assert.match(
        guidance,
        /\b(?:reopen|open)\w*\b/i,
        "lesson 02 guidance leads back to inspectable evidence",
    );
    assert.match(guidance, /\bsource\b/i, "lesson 02 guidance keeps the source visible");

    const teachBack = textAfterHeading(lesson.content, "Teach it back");
    assert.match(teachBack, /\bcapture\b/i, "lesson 02 teach-back explains a capture");
    assert.match(
        teachBack,
        /\bsource extract\b/i,
        "lesson 02 teach-back explains a source extract",
    );
    assert.match(
        teachBack,
        /\bsource note\b/i,
        "lesson 02 teach-back explains a source note",
    );
    assert.match(
        teachBack,
        /\btrust\w*\b/i,
        "lesson 02 teach-back tests trust rather than length",
    );

    const changedCase = textAfterHeading(
        lesson.content,
        "Try a changed case",
    );
    assert.match(
        changedCase,
        /\blicen[cs]e\b/i,
        "lesson 02 transfer introduces an access limit",
    );
    assert.match(
        changedCase,
        /\b(?:copy|retain)\w*\b/i,
        "lesson 02 transfer requires a retention decision",
    );
    assert.match(
        changedCase,
        /\b(?:boundar|must not)\w*\b/i,
        "lesson 02 transfer records the safety boundary",
    );

    const hints = hintTextsOf(lesson);
    assert.match(
        hints[0],
        /\b(?:shrink|narrow|smaller|one|single|cut|reduce)\b/i,
        "lesson 02 hint 1 reduces the source",
    );
    assert.match(
        hints[0],
        /\b(?:source|paragraph|decision|row|document)\b/i,
        "lesson 02 hint 1 gives a small source unit",
    );
    assert.match(
        hints[1],
        /\bsource\b/i,
        "lesson 02 hint 2 identifies source material",
    );
    assert.match(
        hints[1],
        /\b(?:think|interpret|your words|reading|meaning)\b/i,
        "lesson 02 hint 2 separates interpretation",
    );
    assert.match(
        hints[1],
        /\b(?:check|verify|question|uncertain)\b/i,
        "lesson 02 hint 2 exposes the open check",
    );
    assert.match(
        hints[2],
        /\b(?:wrong|incorrect|unsupported|false|mistaken)\b/i,
        "lesson 02 hint 3 tests the source",
    );
    assert.match(
        hints[2],
        /\b(?:decision|action|answer)\b/i,
        "lesson 02 hint 3 connects the source to work",
    );

    const lessonText = textOf(lesson.content);
    assert.doesNotMatch(
        lessonText,
        /Close the lesson|not understood yet|whether it bears on the job|Incident review notes names the source and nothing else|without pretending that copying/i,
        "lesson 02 excludes known generated residue",
    );
    assertNoTeachingDecisionNegation(lesson);
    assertNoUnsafeSensitiveDataInstruction(lesson);
}

assert.deepEqual(Object.keys(manifest), ["schemaVersion", "course"]);
assert.equal(manifest.schemaVersion, 1);
const { course } = manifest;
assert.equal(course.key, "notes-that-do-work");
assert.equal(course.courseId, "course_notes_that_do_work_v1");
assert.equal(course.slug, "notes-that-do-work");
assert.equal(course.title, "Notes that do work");
assert.equal(course.access, "free");
assert.equal(course.privacy, "public");
assert.equal(course.published, true);
assert.equal(course.sections.length, 6);

assert.deepEqual(
    course.sections.map(({ key, groupId, title }) => ({ key, groupId, title })),
    expectedSections.map(({ key, groupId, title }) => ({
        key,
        groupId,
        title,
    })),
);

const lessons = course.sections.flatMap((section) => section.lessons);
const expectedLessons = expectedSections.flatMap((section) => section.lessons);
assert.equal(lessons.length, 12);
assert.equal(new Set(lessons.map(({ key }) => key)).size, 12);
assert.equal(new Set(lessons.map(({ lessonId }) => lessonId)).size, 12);

for (const [index, lesson] of lessons.entries()) {
    const [key, lessonId, title, teaches, requires, filename] =
        expectedLessons[index];
    assert.equal(lesson.key, key);
    assert.equal(lesson.lessonId, lessonId);
    assert.equal(lesson.title, title);
    assert.equal(lesson.teaches, teaches);
    assert.deepEqual(lesson.requires, requires);
    assert.equal(lesson.type, "text");
    assert.equal(lesson.published, true);
    assert.equal(lesson.requiresEnrollment, index !== 0);
    assert.equal(lesson.artifact.filename, filename);
    assert.ok(
        lesson.artifact.description.length >= 80,
        `${key} artifact is usable`,
    );
    assert.ok(lesson.exercise.length >= 120, `${key} exercise is concrete`);
    assert.ok(lesson.outcome.length >= 80, `${key} outcome is concrete`);
    assert.ok(lesson.verification.length >= 4, `${key} has four checks`);
    assert.ok(lesson.sourceNotes.length >= 1, `${key} traces its sources`);
    for (const note of lesson.sourceNotes) {
        assert.ok(
            sourceMap.includes(`\`${note}\``),
            `${key} source is mapped: ${note}`,
        );
    }
    assert.equal(lesson.content.type, "doc");
    assertTeachingSequence(lesson);
    const contract = teachingContracts[index];
    if (contract.review) {
        contract.review(lesson);
    } else {
        for (const [field, heading] of [
            ["prediction", "Before you continue"],
            ["guidance", "Try it with guidance"],
            ["teachBack", "Teach it back"],
            ["changedCase", "Try a changed case"],
        ]) {
            assert.ok(
                textAfterHeading(lesson.content, heading).includes(
                    contract[field],
                ),
                `${key} preserves its ${field} teaching contract`,
            );
        }
    }
    const learnerText = textOf(lesson.content);
    assert.ok(
        learnerText.length >= 2500,
        `${key} has enough teaching material`,
    );
    assert.match(learnerText, /Teach it back/i);
}

assert.deepEqual(course.capstone, {
    key: "turn-notes-into-useful-work",
    capstoneId: "capstone_notes_that_do_work_v1",
    embeddedInLessonKey: "close-the-loop-so-the-next-job-starts-ahead",
    title: "Capstone: turn notes into useful work",
    outcome:
        "Answer one real work question with a source-backed brief, then leave a compact handover that makes the next related job easier to start.",
    exercise:
        "Choose a fresh, low-risk question you already need to answer. Use the course method to gather and check the relevant sources, make the important ideas reusable, connect only the relationships the question needs, write the brief, and record what should be updated or reused next time. Submit source-pack.md, concept-map.md, working-brief.md and handover.md as evidence from the run.",
    artifacts: [
        "source-pack.md",
        "concept-map.md",
        "working-brief.md",
        "handover.md",
    ],
    verification: [
        "The question was real, bounded and safe to use for practice.",
        "Every material claim in the working brief points to a source in source-pack.md or is clearly marked as judgement.",
        "The concept map includes only relationships that changed the analysis, decision or handover.",
        "The working brief answers the question for a named reader and ends with a decision, recommendation or next action.",
        "The handover records what changed during the run, what remains uncertain, and the trigger for checking or updating the notes.",
        "You can explain the path from source to decision with the four files closed.",
    ],
});

const expectedLinks = [
    { text: "Obsidian Help", href: "https://obsidian.md/help/" },
    {
        text: "OneNote for Windows: basic tasks",
        href: "https://support.microsoft.com/en-US/OneNote/onenote-help-and-learning/basic-tasks-in-onenote-on-windows",
    },
    {
        text: "Notion: links and backlinks",
        href: "https://www.notion.com/help/create-links-and-backlinks",
    },
    {
        text: "Apple Notes: add links",
        href: "https://support.apple.com/guide/notes/add-links-apde615d29c2/mac",
    },
];
assert.deepEqual(linksOf(lessons[0].content), expectedLinks);

const courseText = JSON.stringify(manifest);
assert.doesNotMatch(courseText, /[\u2013\u2014\u2018\u2019\u201c\u201d]/u);
assert.doesNotMatch(courseText, /[\u200B-\u200D\u2060\uFEFF]/u);
assert.doesNotMatch(courseText, /\b\d+(?:\.\d+)?\s*%/);
assert.doesNotMatch(
    courseText,
    /second brain|game[- ]changer|unlock your|revolutioni[sz]e|seamless|robust|leverage/iu,
);

const lesson10Text = textOf(
    lessons.find(({ lessonId }) => lessonId === "lesson_notes_that_do_work_10")
        ?.content,
);
assert.match(lesson10Text, /The twelve lesson artefacts are your working records/);
assert.match(lesson10Text, /ai-source-brief\.md/);
assert.match(lesson10Text, /change-review\.md/);

const lesson11Text = textOf(
    lessons.find(({ lessonId }) => lessonId === "lesson_notes_that_do_work_11")
        ?.content,
);
assert.match(
    lesson11Text,
    /Use only a tool and storage location your organisation permits/,
);
assert.match(
    lesson11Text,
    /A source pack is not permission to move client, employee, financial or confidential material into a new service/,
);
assert.match(
    lesson11Text,
    /If the approved tool cannot receive the needed sources, do the exercise with public or synthetic material and record the boundary/,
);
assert.doesNotMatch(
    lesson11Text,
    /ignore (your )?organi[sz]ation(?:al|'s) approval|upload (?:all )?(?:client|employee|financial|confidential)/i,
);

const lesson12Text = textOf(
    lessons.find(({ lessonId }) => lessonId === "lesson_notes_that_do_work_12")
        ?.content,
);
assert.match(
    lesson12Text,
    /If checking the draft against a current source shows that a concept note is stale/,
);
assert.match(
    lesson12Text,
    /The checked discrepancy shows where the setup needs repair/,
);
assert.doesNotMatch(lesson12Text, /the (AI )?answer is evidence/i);
assert.doesNotMatch(lesson12Text, /if the AI exposed a stale/i);

const images = lessons.flatMap((lesson) =>
    imagesOf(lesson.content).map((image) => ({ lesson, image })),
);
assert.equal(
    images.length,
    14,
    "course includes twelve teaching diagrams and two official screenshots",
);
assert.deepEqual(
    images
        .map(({ image }) => image.attrs?.src)
        .filter((src) =>
            [
                "https://media.bhekani.com/p/ur6cY_uoVi6MamfWCHfQ3d5I_7o3G_9QcV4_7-ZY/main.webp",
                "https://media.bhekani.com/p/S6uGLmVooml8BzH41vazeIH4JKQeEJYrose7Kldw/main.webp",
            ].includes(src),
        )
        .sort(),
    [
        "https://media.bhekani.com/p/S6uGLmVooml8BzH41vazeIH4JKQeEJYrose7Kldw/main.webp",
        "https://media.bhekani.com/p/ur6cY_uoVi6MamfWCHfQ3d5I_7o3G_9QcV4_7-ZY/main.webp",
    ],
);
for (const { lesson, image } of images) {
    const attrs = image.attrs ?? {};
    assert.match(
        attrs.src ?? "",
        /^https:\/\/media\.bhekani\.com\/p\/[^/]+\/main\.webp$/,
    );
    assert.ok(
        (attrs.alt ?? "").length >= 60,
        `${lesson.key} image has useful alt text`,
    );
    assert.ok(
        (attrs.title ?? "").length >= 20,
        `${lesson.key} image has a title`,
    );
    const index = lesson.content.content.indexOf(image);
    assert.equal(
        lesson.content.content[index + 1]?.type,
        "paragraph",
        `${lesson.key} image has an adjacent caption`,
    );
}

process.stdout.write(
    `Notes that do work checks passed: ${course.sections.length} sections, ${lessons.length} lessons, ${images.length} images, 1 capstone\n`,
);
