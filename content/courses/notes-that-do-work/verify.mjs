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
    {
        prediction: "one question you need to answer in the next fortnight",
        guidance: "Draw five columns: source, current location",
        teachBack: "collecting more notes is not the same as repairing",
        changedCase: "inherits a matter with a clean folder structure",
    },
    {
        prediction:
            "Without reopening the source, write what you think it means",
        guidance: "Start with the locator",
        teachBack:
            "difference between a capture, a source extract and a source note",
        changedCase: "database link requires a licence",
    },
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

const humanizationContracts = new Map([
    [
        "lesson_notes_that_do_work_01",
        {
            required: [
                "the question you will keep working on through the course",
                "Use that question to decide which context you keep and which you leave.",
                "Explain to a colleague why collecting more notes is not the same as repairing a knowledge leak.",
            ],
            forbidden:
                /Close the lesson|deserves to survive|weekend goes into naming folders|will carry through the rest of the course/i,
        },
    ],
    [
        "lesson_notes_that_do_work_02",
        {
            required: [
                "treat that as a signal to rework it until you can say what the sentence means for your question",
                "Without looking back at the lesson, explain the difference between a capture, a source extract and a source note",
                "it is hard for a reader to tell which part to check",
                "tells a future reader what the note is about and whether it matters to the job in front of them",
            ],
            forbidden:
                /Close the lesson|not understood yet|whether it bears on the job|Incident review notes names the source and nothing else|without pretending that copying/i,
        },
    ],
]);

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
    for (const [field, heading] of [
        ["prediction", "Before you continue"],
        ["guidance", "Try it with guidance"],
        ["teachBack", "Teach it back"],
        ["changedCase", "Try a changed case"],
    ]) {
        assert.ok(
            textAfterHeading(lesson.content, heading).includes(contract[field]),
            `${key} preserves its ${field} teaching contract`,
        );
    }
    const learnerText = textOf(lesson.content);
    assert.ok(
        learnerText.length >= 2500,
        `${key} has enough teaching material`,
    );
    assert.match(learnerText, /Teach it back/i);
    const humanization = humanizationContracts.get(lesson.lessonId);
    if (humanization) {
        for (const fragment of humanization.required) {
            assert.ok(
                learnerText.includes(fragment),
                `${key} preserves reviewed humanized prose: ${fragment}`,
            );
        }
        assert.doesNotMatch(
            learnerText,
            humanization.forbidden,
            `${key} excludes superseded generated prose`,
        );
    }
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
