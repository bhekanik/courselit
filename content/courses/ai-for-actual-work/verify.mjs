import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const courseDirectory = dirname(fileURLToPath(import.meta.url));
const manifestPath = join(courseDirectory, "course.json");
const sourceMapPath = join(courseDirectory, "source-map.md");
const editorialNotesPath = join(courseDirectory, "editorial-notes.md");
const errors = [];

const expectedSections = [
    {
        key: "start-with-real-work",
        title: "Start with real work",
        lessonKeys: [
            "stop-asking-isolated-questions",
            "test-behaviour-not-brand-loyalty",
        ],
    },
    {
        key: "build-context-that-survives-the-session",
        title: "Build context that survives the session",
        lessonKeys: [
            "turn-answers-into-reusable-rules",
            "route-context-and-give-it-an-update-trigger",
        ],
    },
    {
        key: "choose-the-mechanism-before-the-prompt",
        title: "Choose the mechanism before the prompt",
        lessonKeys: [
            "use-policy-workflow-or-agent-on-purpose",
            "audit-the-substrate-before-adding-ai",
        ],
    },
    {
        key: "build-checks-that-can-prove-you-wrong",
        title: "Build checks that can prove you wrong",
        lessonKeys: [
            "derive-expectations-from-the-requirement",
            "fail-cheaply-before-you-mutate",
        ],
    },
    {
        key: "make-consequential-work-inspectable",
        title: "Make consequential work inspectable",
        lessonKeys: [
            "stop-the-system-from-guessing",
            "leave-a-replayable-decision-trace",
        ],
    },
    {
        key: "close-delegated-work-properly",
        title: "Close delegated work properly",
        lessonKeys: [
            "treat-done-as-a-claim",
            "design-for-automation-failure",
        ],
    },
    {
        key: "keep-the-understanding-and-improve-the-setup",
        title: "Keep the understanding and improve the setup",
        lessonKeys: [
            "pay-back-some-of-the-speed",
            "turn-misses-into-system-improvements",
        ],
    },
];

const expectedSources = new Map([
    [
        "stop-asking-isolated-questions",
        [
            "Using AI to do actual work.md",
            "Workflow for building with AI.md",
            "You Don’t Need to Be an AI Expert to Build with Generative AI.md",
        ],
    ],
    [
        "test-behaviour-not-brand-loyalty",
        [
            "A Miss Is a Bug Report Against Your Setup.md",
            "AI Workflow Talk - Overview.md",
            "AI Workflow Talk - Script.md",
            "Using AI to do actual work.md",
        ],
    ],
    [
        "turn-answers-into-reusable-rules",
        [
            "AI Workflow Talk - Overview.md",
            "Knowledge Bank as Agent Working Memory.md",
            "Knowledge Work Should Accrete.md",
        ],
    ],
    [
        "route-context-and-give-it-an-update-trigger",
        [
            "Agent Harnesses Need Update Loops.md",
            "Agentic Memory as Lifecycle.md",
            "Always-On Agent Context Is a Router.md",
            "CoALA Memory Taxonomy.md",
            "Conventions AGENTS.md vs Skills.md",
            "Generated Docs as Drift Defense.md",
            "Golden Context as Context Substrate.md",
        ],
    ],
    [
        "use-policy-workflow-or-agent-on-purpose",
        [
            "AI-Native Product Development Working Model.md",
            "Governed Agent Architecture.md",
            "Policy vs Workflow vs Agent.md",
        ],
    ],
    [
        "audit-the-substrate-before-adding-ai",
        [
            "Deterministic Before LLM.md",
            "Governed Agent Architecture.md",
            "Substrate Audits Before AI Features.md",
        ],
    ],
    [
        "derive-expectations-from-the-requirement",
        [
            "AI-Era Learning.md",
            "Teaching Senior Engineers.md",
            "Tests Fail on Realistic Bugs.md",
        ],
    ],
    [
        "fail-cheaply-before-you-mutate",
        [
            "AI-Native Product Development Working Model.md",
            "Front-Load the Checks That Can Fail.md",
            "Scenario-Driven Development.md",
            "The Type System Is the Recovery Oracle for a Dead Agent.md",
        ],
    ],
    [
        "stop-the-system-from-guessing",
        [
            "Citations Required, Validator Enforces.md",
            "Guardrails Are the Product.md",
            "Substrate Audits Before AI Features.md",
        ],
    ],
    [
        "leave-a-replayable-decision-trace",
        [
            "Decision Trace Is the Explanation.md",
            "Governed Agent Architecture.md",
            "Guardrails Are the Product.md",
            "Review maps for agent-written PRs.md",
        ],
    ],
    [
        "treat-done-as-a-claim",
        [
            "AI Workflow Talk - Script.md",
            "Parallel Agent Work Needs a Closing Ledger.md",
            "Review maps for agent-written PRs.md",
        ],
    ],
    [
        "design-for-automation-failure",
        [
            "AI Workflow Talk - Overview.md",
            "Automation Outruns the Prompt.md",
            "Front-Load the Checks That Can Fail.md",
            "Rules for AI in cursor.md",
        ],
    ],
    [
        "pay-back-some-of-the-speed",
        [
            "AI-Era Learning.md",
            "Outsource the work, not the understanding.md",
            "Teaching Senior Engineers.md",
        ],
    ],
    [
        "turn-misses-into-system-improvements",
        [
            "A Miss Is a Bug Report Against Your Setup.md",
            "Agent Harnesses Need Update Loops.md",
            "Craft Relocates, It Doesn't Die.md",
            "Knowledge Bank as Agent Working Memory.md",
            "Knowledge Work Should Accrete.md",
            "LLMs Unbundled the Two Rewards of Programming.md",
            "Which Reward Were You Chasing.md",
        ],
    ],
]);

const allowedNodeTypes = new Set([
    "doc",
    "paragraph",
    "heading",
    "text",
    "bulletList",
    "orderedList",
    "listItem",
    "blockquote",
    "codeBlock",
]);
const allowedMarkTypes = new Set(["bold", "italic", "code", "strike"]);
const requiredLessonHeadings = new Set([
    "Try it on your work",
    "What you will make",
    "Check your work",
]);

function check(condition, message) {
    if (!condition) errors.push(message);
}

function readRequiredFile(path, label) {
    if (!existsSync(path)) {
        errors.push(`${label} is missing`);
        return "";
    }
    return readFileSync(path, "utf8");
}

function parseManifest() {
    const source = readRequiredFile(manifestPath, "course.json");
    if (!source) return null;

    try {
        return JSON.parse(source);
    } catch (error) {
        errors.push(`course.json is invalid JSON: ${error.message}`);
        return null;
    }
}

function plainText(node) {
    if (!node || typeof node !== "object") return "";
    if (node.type === "text") return typeof node.text === "string" ? node.text : "";
    return Array.isArray(node.content) ? node.content.map(plainText).join("\n") : "";
}

function collectHeadings(node, headings = []) {
    if (!node || typeof node !== "object") return headings;
    if (node.type === "heading") headings.push(plainText(node).trim());
    if (Array.isArray(node.content)) {
        for (const child of node.content) collectHeadings(child, headings);
    }
    return headings;
}

function validateTipTap(document, label, { allowCodeBlocks }) {
    check(document?.type === "doc", `${label} must be a TipTap doc`);
    check(Array.isArray(document?.content), `${label} must have a content array`);

    function visit(node, path) {
        if (!node || typeof node !== "object") {
            errors.push(`${label} has a non-object node at ${path}`);
            return;
        }

        check(allowedNodeTypes.has(node.type), `${label} uses unsupported node ${node.type} at ${path}`);
        if (!allowCodeBlocks) {
            check(node.type !== "codeBlock", `${label} puts engineering/code content in the core lesson`);
        }
        if (node.type === "heading") {
            check([2, 3].includes(node.attrs?.level), `${label} heading at ${path} must use level 2 or 3`);
        }
        if (node.type === "text") {
            check(typeof node.text === "string" && node.text.length > 0, `${label} has an empty text node at ${path}`);
            check(!Object.hasOwn(node, "content"), `${label} text node at ${path} cannot have children`);
        }
        if (Array.isArray(node.marks)) {
            for (const mark of node.marks) {
                check(allowedMarkTypes.has(mark?.type), `${label} uses unsupported mark ${mark?.type} at ${path}`);
            }
        }
        if (Array.isArray(node.content)) {
            node.content.forEach((child, index) => visit(child, `${path}.content[${index}]`));
        }
    }

    if (Array.isArray(document?.content)) {
        document.content.forEach((node, index) => visit(node, `content[${index}]`));
    }
}

function validateSources(lesson, label) {
    const expected = expectedSources.get(lesson.key) ?? [];
    const actual = Array.isArray(lesson.sourceNotes) ? lesson.sourceNotes : [];
    check(
        JSON.stringify(actual) === JSON.stringify(expected),
        `${label} sourceNotes must match the locked source map`,
    );
    for (const filename of actual) {
        check(typeof filename === "string" && filename.endsWith(".md"), `${label} has an invalid source filename`);
        check(!filename.includes("/") && !filename.includes("\\"), `${label} exposes a source path instead of a filename`);
    }
}

function validateLesson(lesson, sectionIndex, lessonIndex) {
    const number = sectionIndex * 2 + lessonIndex + 1;
    const expected = expectedSections[sectionIndex].lessonKeys[lessonIndex];
    const label = `lesson ${number}`;

    check(lesson?.key === expected, `${label} key must be ${expected}`);
    check(
        lesson?.lessonId === `lesson_ai_for_actual_work_${String(number).padStart(2, "0")}`,
        `${label} has the wrong stable lessonId`,
    );
    check(typeof lesson?.title === "string" && lesson.title.length >= 8, `${label} needs a title`);
    check(typeof lesson?.outcome === "string" && lesson.outcome.length >= 40 && lesson.outcome.length <= 240, `${label} needs a concise outcome`);
    check(lesson?.type === "text", `${label} type must be text`);
    check(lesson?.published === true, `${label} intended state must be published`);
    check(lesson?.requiresEnrollment === (number !== 1), `${label} has the wrong enrolment setting`);
    check(typeof lesson?.exercise === "string" && lesson.exercise.length >= 100, `${label} needs a real-work exercise`);
    check(typeof lesson?.artifact?.filename === "string" && lesson.artifact.filename.endsWith(".md"), `${label} needs a Markdown artefact filename`);
    check(typeof lesson?.artifact?.description === "string" && lesson.artifact.description.length >= 60, `${label} needs an artefact description`);
    check(Array.isArray(lesson?.verification) && lesson.verification.length >= 4, `${label} needs at least four verification checks`);
    check(lesson?.verification?.every((item) => typeof item === "string" && item.length >= 25), `${label} has a weak verification check`);

    validateTipTap(lesson?.content, `${label} content`, { allowCodeBlocks: false });
    const text = plainText(lesson?.content);
    check(text.length >= 2500, `${label} content is too short (${text.length}/2500 characters)`);
    const headings = new Set(collectHeadings(lesson?.content));
    for (const heading of requiredLessonHeadings) {
        check(headings.has(heading), `${label} is missing the heading ${heading}`);
    }
    if (number === 14) {
        check(headings.has("Capstone: run your workflow"), `${label} must contain the capstone`);
    }
    validateSources(lesson, label);
    return text;
}

function validateExtension(extension, sectionNumber) {
    if (!extension) return "";
    const label = `section ${sectionNumber} technical extension`;
    check(extension.optional === true, `${label} must be optional`);
    check(extension.requiredForNextSection === false, `${label} cannot be a prerequisite`);
    check(extension.audience === "technical practitioners", `${label} must name its audience`);
    check(typeof extension.title === "string" && extension.title.length >= 8, `${label} needs a title`);
    check(typeof extension.outcome === "string" && extension.outcome.length >= 40, `${label} needs an outcome`);
    check(Array.isArray(extension.sourceNotes) && extension.sourceNotes.length > 0, `${label} needs source notes`);
    extension.sourceNotes?.forEach((filename) => {
        check(typeof filename === "string" && filename.endsWith(".md"), `${label} has an invalid source filename`);
        check(!filename.includes("/") && !filename.includes("\\"), `${label} exposes a source path`);
    });
    validateTipTap(extension.content, `${label} content`, { allowCodeBlocks: true });
    const text = plainText(extension.content);
    check(text.length >= 500, `${label} content is too short (${text.length}/500 characters)`);
    return text;
}

function collectLearnerMetadata(course) {
    const values = [course.description, course.audience, course.outcome];
    for (const section of course.sections ?? []) {
        values.push(section.title, section.outcome);
        for (const lesson of section.lessons ?? []) {
            values.push(
                lesson.title,
                lesson.outcome,
                lesson.exercise,
                lesson.artifact?.filename,
                lesson.artifact?.description,
                ...(lesson.verification ?? []),
            );
        }
        if (section.technicalExtension) {
            values.push(section.technicalExtension.title, section.technicalExtension.outcome);
        }
    }
    values.push(
        course.capstone?.title,
        course.capstone?.outcome,
        course.capstone?.exercise,
        ...(course.capstone?.artifacts ?? []),
        ...(course.capstone?.verification ?? []),
    );
    return values.filter((value) => typeof value === "string").join("\n");
}

function validateEditorialText(text) {
    const bannedPatterns = [
        [/[—–]/u, "em or en dash"],
        [/[“”]/u, "curly quotation mark"],
        [/[\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/u, "invisible Unicode mark"],
        [/\b(?:twelve|12)[ -]month\b/i, "unsupported twelve-month advantage"],
        [/\bjob security\b/i, "unsupported job-security claim"],
        [/\b\d+(?:\.\d+)?\s*%/, "percentage claim"],
        [/\b\d+\s+(?:minutes?|hours?)\s+(?:saved|faster)\b/i, "fixed time-saving claim"],
        [/\b(?:ChatGPT|Claude|Gemini|OpenAI|Anthropic|Cursor)\b/i, "vendor-specific comparison"],
        [/\b(?:Contentful|Notto|Life Coach OS)\b/i, "private or internal project detail"],
        [/(?:\/Users\/|iCloud|Obsidian)/i, "private source path"],
        [/https?:\/\//i, "learner-facing URL"],
        [/\b(?:behavior|organization|organize|analyze|authorization|centered)\b/i, "American spelling"],
        [/\b(?:delve|pivotal|showcase|tapestry|testament|vibrant)\b/i, "stock AI vocabulary"],
        [/\b(?:let's dive in|here's what you need to know|in this lesson, we will)\b/i, "AI signposting"],
    ];

    for (const [pattern, description] of bannedPatterns) {
        const match = text.match(pattern);
        check(!match, `learner-facing text contains ${description}${match ? `: ${match[0]}` : ""}`);
    }
}

const manifest = parseManifest();
const sourceMap = readRequiredFile(sourceMapPath, "source-map.md");
const editorialNotes = readRequiredFile(editorialNotesPath, "editorial-notes.md");

if (manifest) {
    check(manifest.schemaVersion === 1, "schemaVersion must be 1");
    const course = manifest.course;
    check(course?.key === "ai-for-actual-work", "course key must be ai-for-actual-work");
    check(course?.courseId === "course_ai_for_actual_work_v1", "courseId must be stable");
    check(course?.slug === "ai-for-actual-work", "course slug must be ai-for-actual-work");
    check(course?.title === "AI for actual work", "course title must be AI for actual work");
    check(course?.access === "free", "course access must be free");
    check(course?.privacy === "public", "course privacy must be public");
    check(course?.published === true, "course intended state must be published");
    check(Array.isArray(course?.sections) && course.sections.length === 7, "course must have seven sections");

    const lessonKeys = [];
    const lessonIds = [];
    const allLearnerText = [];
    let extensionCount = 0;

    for (let sectionIndex = 0; sectionIndex < expectedSections.length; sectionIndex += 1) {
        const section = course?.sections?.[sectionIndex];
        const expected = expectedSections[sectionIndex];
        const sectionNumber = sectionIndex + 1;
        check(section?.key === expected.key, `section ${sectionNumber} key must be ${expected.key}`);
        check(section?.groupId === `group_ai_for_actual_work_${String(sectionNumber).padStart(2, "0")}`, `section ${sectionNumber} has the wrong stable groupId`);
        check(section?.title === expected.title, `section ${sectionNumber} title must be ${expected.title}`);
        check(section?.rank === sectionNumber * 1000, `section ${sectionNumber} rank must be ${sectionNumber * 1000}`);
        check(typeof section?.outcome === "string" && section.outcome.length >= 40, `section ${sectionNumber} needs an outcome`);
        check(Array.isArray(section?.lessons) && section.lessons.length === 2, `section ${sectionNumber} must have two lessons`);

        section?.lessons?.forEach((lesson, lessonIndex) => {
            lessonKeys.push(lesson.key);
            lessonIds.push(lesson.lessonId);
            allLearnerText.push(validateLesson(lesson, sectionIndex, lessonIndex));
        });

        if (section?.technicalExtension) {
            extensionCount += 1;
            allLearnerText.push(validateExtension(section.technicalExtension, sectionNumber));
        }
    }

    check(lessonKeys.length === 14, "course must have fourteen lessons");
    check(new Set(lessonKeys).size === 14, "lesson keys must be unique");
    check(new Set(lessonIds).size === 14, "lesson IDs must be unique");
    check(extensionCount >= 4, "course needs explicit technical extensions in at least four sections");

    const capstone = course?.capstone;
    check(capstone?.key === "run-your-ai-assisted-workflow", "capstone key is wrong");
    check(capstone?.capstoneId === "capstone_ai_for_actual_work_v1", "capstone ID must be stable");
    check(capstone?.embeddedInLessonKey === "turn-misses-into-system-improvements", "capstone must be embedded in lesson 14");
    check(typeof capstone?.title === "string" && capstone.title.length >= 8, "capstone needs a title");
    check(typeof capstone?.outcome === "string" && capstone.outcome.length >= 50, "capstone needs an outcome");
    check(typeof capstone?.exercise === "string" && capstone.exercise.length >= 120, "capstone needs a real-work exercise");
    check(Array.isArray(capstone?.artifacts) && capstone.artifacts.length === 10, "capstone must collect ten artefacts");
    check(
        capstone?.artifacts?.every((artifact) => /^[a-z0-9-]+\.md$/.test(artifact)),
        "capstone artefacts must be bare Markdown filenames",
    );
    check(Array.isArray(capstone?.verification) && capstone.verification.length >= 7, "capstone needs at least seven checks");

    const learnerText = [collectLearnerMetadata(course), ...allLearnerText].join("\n");
    validateEditorialText(learnerText);
    for (const phrase of [
        "research brief",
        "operational handover",
        "stakeholder update",
        "confidential",
        "approved tool",
        "not enough evidence",
    ]) {
        check(learnerText.toLowerCase().includes(phrase), `course must teach or demonstrate: ${phrase}`);
    }

    for (const lessonKey of lessonKeys) {
        check(sourceMap.includes(`\`${lessonKey}\``), `source-map.md is missing ${lessonKey}`);
    }
    check(sourceMap.includes("Original course example"), "source-map.md must label original course examples");
    check(editorialNotes.includes("## Claim boundaries"), "editorial-notes.md needs claim boundaries");
    check(editorialNotes.includes("## Reviewer-skill record"), "editorial-notes.md needs the reviewer-skill record");
}

if (errors.length > 0) {
    console.error(`Curriculum verification failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
}

console.log("Curriculum verification passed: 7 sections, 14 lessons, 1 capstone, stable IDs, traced sources, and clean learner copy.");
