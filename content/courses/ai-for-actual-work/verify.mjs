import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const courseDirectory = dirname(fileURLToPath(import.meta.url));
const manifestPath = join(courseDirectory, "course.json");
const sourceMapPath = join(courseDirectory, "source-map.md");
const editorialNotesPath = join(courseDirectory, "editorial-notes.md");
const siteDirectory = join(courseDirectory, "../../site/ai-work-school");
const mediaPath = join(siteDirectory, "media.json");
const assetContractsPath = join(siteDirectory, "asset-contracts.json");
const errors = [];

const expectedSections = [
    {
        key: "start-with-real-work",
        groupId: "group_ai_for_actual_work_01",
        title: "Start with real work",
        rank: 1000,
        lessons: [
            { key: "stop-asking-isolated-questions", lessonId: "lesson_ai_for_actual_work_01" },
            { key: "test-behaviour-not-brand-loyalty", lessonId: "lesson_ai_for_actual_work_02" },
        ],
    },
    {
        key: "build-context-that-survives-the-session",
        groupId: "group_ai_for_actual_work_02",
        title: "Build context that survives the session",
        rank: 2000,
        lessons: [
            { key: "turn-answers-into-reusable-rules", lessonId: "lesson_ai_for_actual_work_03" },
            { key: "route-context-and-give-it-an-update-trigger", lessonId: "lesson_ai_for_actual_work_04" },
        ],
    },
    {
        key: "choose-the-mechanism-before-the-prompt",
        groupId: "group_ai_for_actual_work_03",
        title: "Choose the mechanism before the prompt",
        rank: 3000,
        lessons: [
            { key: "use-policy-workflow-or-agent-on-purpose", lessonId: "lesson_ai_for_actual_work_05" },
            { key: "audit-the-substrate-before-adding-ai", lessonId: "lesson_ai_for_actual_work_06" },
        ],
    },
    {
        key: "build-checks-that-can-prove-you-wrong",
        groupId: "group_ai_for_actual_work_04",
        title: "Build checks that can prove you wrong",
        rank: 4000,
        lessons: [
            { key: "derive-expectations-from-the-requirement", lessonId: "lesson_ai_for_actual_work_07" },
            { key: "fail-cheaply-before-you-mutate", lessonId: "lesson_ai_for_actual_work_08" },
        ],
    },
    {
        key: "make-consequential-work-inspectable",
        groupId: "group_ai_for_actual_work_05",
        title: "Make consequential work inspectable",
        rank: 5000,
        lessons: [
            { key: "stop-the-system-from-guessing", lessonId: "lesson_ai_for_actual_work_09" },
            { key: "leave-a-replayable-decision-trace", lessonId: "lesson_ai_for_actual_work_10" },
        ],
    },
    {
        key: "close-delegated-work-properly",
        groupId: "group_ai_for_actual_work_06",
        title: "Close delegated work properly",
        rank: 6000,
        lessons: [
            { key: "treat-done-as-a-claim", lessonId: "lesson_ai_for_actual_work_11" },
            { key: "design-for-automation-failure", lessonId: "lesson_ai_for_actual_work_12" },
        ],
    },
    {
        key: "choose-the-work-surface",
        groupId: "group_ai_for_actual_work_08",
        title: "Choose the work surface",
        rank: 7000,
        lessons: [
            { key: "separate-chat-from-delegated-work", lessonId: "lesson_ai_for_actual_work_15" },
            { key: "map-current-work-surfaces", lessonId: "lesson_ai_for_actual_work_16" },
        ],
    },
    {
        key: "package-repeated-work",
        groupId: "group_ai_for_actual_work_09",
        title: "Package repeated work",
        rank: 8000,
        lessons: [
            { key: "write-and-test-a-skill", lessonId: "lesson_ai_for_actual_work_17" },
            { key: "separate-skills-from-mcp-connections", lessonId: "lesson_ai_for_actual_work_18" },
        ],
    },
    {
        key: "research-and-write-with-evidence",
        groupId: "group_ai_for_actual_work_10",
        title: "Research and write with evidence",
        rank: 9000,
        lessons: [
            { key: "research-before-you-draft", lessonId: "lesson_ai_for_actual_work_19" },
            { key: "edit-the-argument-and-repair-the-prose", lessonId: "lesson_ai_for_actual_work_20" },
        ],
    },
    {
        key: "produce-work-and-act-safely",
        groupId: "group_ai_for_actual_work_11",
        title: "Produce work and act safely",
        rank: 10000,
        lessons: [
            { key: "build-and-check-work-artifacts", lessonId: "lesson_ai_for_actual_work_21" },
            { key: "act-only-with-explicit-authority", lessonId: "lesson_ai_for_actual_work_22" },
        ],
    },
    {
        key: "keep-the-understanding-and-improve-the-setup",
        groupId: "group_ai_for_actual_work_07",
        title: "Keep the understanding and improve the setup",
        rank: 11000,
        lessons: [
            { key: "pay-back-some-of-the-speed", lessonId: "lesson_ai_for_actual_work_13" },
            { key: "turn-misses-into-system-improvements", lessonId: "lesson_ai_for_actual_work_14" },
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
    ["separate-chat-from-delegated-work", ["ai-work-school-public-research.md"]],
    ["map-current-work-surfaces", ["ai-work-school-public-research.md"]],
    ["write-and-test-a-skill", ["ai-work-school-skills-evidence.md"]],
    [
        "separate-skills-from-mcp-connections",
        ["ai-work-school-public-research.md", "ai-work-school-skills-evidence.md"],
    ],
    [
        "research-before-you-draft",
        ["ai-work-school-public-research.md", "ai-work-school-skills-evidence.md"],
    ],
    [
        "edit-the-argument-and-repair-the-prose",
        ["ai-work-school-public-research.md", "ai-work-school-skills-evidence.md"],
    ],
    ["build-and-check-work-artifacts", ["ai-work-school-skills-evidence.md"]],
    [
        "act-only-with-explicit-authority",
        ["ai-work-school-public-research.md", "ai-work-school-skills-evidence.md"],
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

const expectedLessonPhrases = new Map([
    ["separate-chat-from-delegated-work", ["chat surface", "delegated work surface"]],
    [
        "map-current-work-surfaces",
        [
            "As of 14 August 2026",
            "ChatGPT Work",
            "Codex",
            "Claude Cowork",
            "Microsoft 365 Copilot",
            "Copilot Cowork",
        ],
    ],
    ["write-and-test-a-skill", ["skill brief", "blind evaluation prompt"]],
    [
        "separate-skills-from-mcp-connections",
        ["Model Context Protocol", "A skill tells", "MCP connects"],
    ],
    ["research-before-you-draft", ["claim-status table", "strongest counterargument", "fact-check"]],
    [
        "edit-the-argument-and-repair-the-prose",
        ["idea map", "line edit", "fabrication check", "AI-writing repair"],
    ],
    [
        "build-and-check-work-artifacts",
        ["document", "spreadsheet", "meeting", "illustrative accountant exercise"],
    ],
    [
        "act-only-with-explicit-authority",
        ["safe action", "action ledger", "illustrative lawyer exercise", "illustrative operations exercise"],
    ],
]);

const requiredPrimarySources = [
    "https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex",
    "https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork",
    "https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-overview",
    "https://learn.microsoft.com/en-us/microsoft-365/copilot/cowork/",
    "https://modelcontextprotocol.io/docs/getting-started/intro",
];

const expectedLessonMedia = [
    {
        lessonId: "lesson_ai_for_actual_work_17",
        keys: ["skill-lesson", "skill-package-lesson"],
        precedingText: "Tighten the step that fails dangerously, not every sentence around it.",
        followingHeading: "Keep the core small and route the rest",
    },
    {
        lessonId: "lesson_ai_for_actual_work_18",
        keys: ["mcp-lesson", "mcp-connection-lesson"],
        precedingText: "Check the current client and approved server before relying on any connection.",
        followingHeading: "Choose among four honest answers",
    },
    {
        lessonId: "lesson_ai_for_actual_work_20",
        keys: ["editorial-partnership-lesson"],
        precedingText: "End each section with a consequence, decision or next action rather than a summary of itself.",
        followingHeading: "Repair AI writing without fabricating humanity",
    },
    {
        lessonId: "lesson_ai_for_actual_work_21",
        keys: ["checked-work-lesson", "checked-workflow-lesson"],
        precedingText: "Visual polish is a later proof, not a substitute for the first ones.",
        followingHeading: "Document lane",
    },
];

const expectedCapstoneArtifacts = [
    "working-brief.md",
    "source-contract.md",
    "checks-and-evidence.md",
    "decision-record.md",
    "handover.md",
];

const requiredDescriptionPhrases = [
    "work surface",
    "skill",
    "MCP",
    "research",
    "writing",
    "documents",
    "spreadsheets",
    "meeting briefs",
    "external action",
    "accounting",
    "legal",
    "operations",
];

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
    "image",
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

function parseRequiredJson(path, label) {
    const source = readRequiredFile(path, label);
    if (!source) return null;

    try {
        return JSON.parse(source);
    } catch (error) {
        errors.push(`${label} is invalid JSON: ${error.message}`);
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

function validateTipTap(document, label, { allowCodeBlocks, allowImages }) {
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
        if (!allowImages) {
            check(node.type !== "image", `${label} contains an image outside a reviewed core lesson target`);
        }
        if (node.type === "heading") {
            check([2, 3].includes(node.attrs?.level), `${label} heading at ${path} must use level 2 or 3`);
        }
        if (node.type === "text") {
            check(typeof node.text === "string" && node.text.length > 0, `${label} has an empty text node at ${path}`);
            check(!Object.hasOwn(node, "content"), `${label} text node at ${path} cannot have children`);
        }
        if (node.type === "image") {
            check(!Object.hasOwn(node, "content"), `${label} image at ${path} cannot have children`);
            check(/^https:\/\//.test(node.attrs?.src), `${label} image at ${path} needs an HTTPS src`);
            check(node.attrs?.alt?.trim().length >= 40, `${label} image at ${path} needs meaningful alt text`);
            check(node.attrs?.title?.trim().length >= 40, `${label} image at ${path} needs a meaningful title`);
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

function textWithoutVisuals(document) {
    const nodes = Array.isArray(document?.content) ? document.content : [];
    const captionIndexes = new Set();
    nodes.forEach((node, index) => {
        if (node?.type === "image") captionIndexes.add(index + 1);
    });
    return nodes
        .filter((node, index) => node?.type !== "image" && !captionIndexes.has(index))
        .map(plainText)
        .join("\n");
}

function assetByTargetKey(assetContracts, key) {
    return [...(assetContracts?.rasters ?? []), ...(assetContracts?.diagrams ?? [])].find((asset) =>
        asset.promotionTargets?.some((target) => target.key === key),
    );
}

function collectImages(node, images = []) {
    if (!node || typeof node !== "object") return images;
    if (node.type === "image") images.push(node);
    if (Array.isArray(node.content)) {
        for (const child of node.content) collectImages(child, images);
    }
    return images;
}

function validateLessonMedia(course, mediaLock, assetContracts) {
    const mediaByKey = new Map((mediaLock?.entries ?? []).map((entry) => [entry.key, entry]));
    const allLessons = (course?.sections ?? []).flatMap((section) => section.lessons ?? []);
    const actualImageSources = [];

    for (const expected of expectedLessonMedia) {
        const lesson = allLessons.find(({ lessonId }) => lessonId === expected.lessonId);
        const nodes = Array.isArray(lesson?.content?.content) ? lesson.content.content : [];
        const precedingIndex = nodes.findIndex(
            (node) => node.type === "paragraph" && plainText(node).trim().endsWith(expected.precedingText),
        );
        check(precedingIndex >= 0, `${expected.lessonId} is missing its reviewed media anchor`);

        expected.keys.forEach((key, keyIndex) => {
            const imageIndex = precedingIndex + 1 + keyIndex * 2;
            const image = nodes[imageIndex];
            const caption = nodes[imageIndex + 1];
            const media = mediaByKey.get(key)?.media;
            const asset = assetByTargetKey(assetContracts, key);
            const promotionTarget = asset?.promotionTargets?.find((target) => target.key === key);
            const expectedAttrs = {
                src: media?.file,
                alt: asset?.alt,
                title: media?.caption,
            };

            check(asset, `${key} has no reviewed asset contract`);
            check(media, `${key} has no sealed media entry`);
            check(
                promotionTarget?.owner === "course-lesson" &&
                    promotionTarget?.resolvedTargetId === expected.lessonId,
                `${key} must resolve to ${expected.lessonId} in the reviewed asset contract`,
            );
            check(image?.type === "image", `${expected.lessonId} must place ${key} at its reviewed anchor`);
            check(
                isDeepStrictEqual(image?.attrs, expectedAttrs),
                `${expected.lessonId} ${key} image attributes must match the sealed media and accessibility contracts`,
            );
            check(caption?.type === "paragraph", `${expected.lessonId} ${key} needs a visible caption paragraph`);
            check(
                plainText(caption).trim() === media?.caption,
                `${expected.lessonId} ${key} caption must match the sealed media contract`,
            );
        });

        const followingNode = nodes[precedingIndex + 1 + expected.keys.length * 2];
        check(
            followingNode?.type === "heading" && plainText(followingNode).trim() === expected.followingHeading,
            `${expected.lessonId} media must remain at the reviewed reading-order anchor`,
        );
    }

    for (const lesson of allLessons) {
        actualImageSources.push(...collectImages(lesson?.content).map((image) => image.attrs?.src));
    }
    const expectedImageSources = expectedLessonMedia.flatMap(({ keys }) =>
        keys.map((key) => mediaByKey.get(key)?.media?.file),
    );
    check(
        JSON.stringify(actualImageSources) === JSON.stringify(expectedImageSources),
        "course lessons must contain exactly the seven reviewed images in reading order",
    );
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

function validateLesson(lesson, expected) {
    const label = expected.lessonId;

    check(lesson?.key === expected.key, `${label} key must be ${expected.key}`);
    check(lesson?.lessonId === expected.lessonId, `${expected.key} has the wrong stable lessonId`);
    check(typeof lesson?.title === "string" && lesson.title.length >= 8, `${label} needs a title`);
    check(typeof lesson?.outcome === "string" && lesson.outcome.length >= 40 && lesson.outcome.length <= 240, `${label} needs a concise outcome`);
    check(lesson?.type === "text", `${label} type must be text`);
    check(lesson?.published === true, `${label} intended state must be published`);
    check(
        lesson?.requiresEnrollment === (expected.lessonId !== "lesson_ai_for_actual_work_01"),
        `${label} has the wrong enrolment setting`,
    );
    check(typeof lesson?.exercise === "string" && lesson.exercise.length >= 100, `${label} needs a real-work exercise`);
    check(typeof lesson?.artifact?.filename === "string" && lesson.artifact.filename.endsWith(".md"), `${label} needs a Markdown artefact filename`);
    check(typeof lesson?.artifact?.description === "string" && lesson.artifact.description.length >= 60, `${label} needs an artefact description`);
    check(Array.isArray(lesson?.verification) && lesson.verification.length >= 4, `${label} needs at least four verification checks`);
    check(lesson?.verification?.every((item) => typeof item === "string" && item.length >= 25), `${label} has a weak verification check`);

    validateTipTap(lesson?.content, `${label} content`, { allowCodeBlocks: false, allowImages: true });
    const text = textWithoutVisuals(lesson?.content);
    check(text.length >= 2500, `${label} content is too short (${text.length}/2500 characters)`);
    const headings = new Set(collectHeadings(lesson?.content));
    for (const heading of requiredLessonHeadings) {
        check(headings.has(heading), `${label} is missing the heading ${heading}`);
    }
    for (const phrase of expectedLessonPhrases.get(expected.key) ?? []) {
        check(text.includes(phrase), `${label} must teach or demonstrate: ${phrase}`);
    }
    if (expected.lessonId === "lesson_ai_for_actual_work_14") {
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
    validateTipTap(extension.content, `${label} content`, { allowCodeBlocks: true, allowImages: false });
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
        [
            /\b(?:ChatGPT|Claude|Copilot|Codex)\b.{0,40}\b(?:outperforms?|superior|more accurate|faster|best)\b/i,
            "unsupported product ranking or performance claim",
        ],
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
const mediaLock = parseRequiredJson(mediaPath, "media.json");
const assetContracts = parseRequiredJson(assetContractsPath, "asset-contracts.json");

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
    const featuredImage = mediaLock?.entries?.find(({ key }) => key === "course-featured-image")?.media;
    const featuredAsset = assetByTargetKey(assetContracts, "course-featured-image");
    const featuredTarget = featuredAsset?.promotionTargets?.find(({ key }) => key === "course-featured-image");
    check(featuredImage, "course-featured-image has no sealed media entry");
    check(
        featuredTarget?.owner === "course-manifest" && featuredTarget?.resolvedTargetId === course?.courseId,
        "course-featured-image must resolve to the stable course ID in the reviewed asset contract",
    );
    check(
        isDeepStrictEqual(course?.featuredImage, featuredImage),
        "course featuredImage must match the sealed course-featured-image Media object",
    );
    check(Array.isArray(course?.sections) && course.sections.length === 11, "course must have eleven sections");
    for (const phrase of requiredDescriptionPhrases) {
        check(course?.description?.toLowerCase().includes(phrase.toLowerCase()), `course description must cover: ${phrase}`);
    }

    const lessonKeys = [];
    const lessonIds = [];
    const allLearnerText = [];
    let extensionCount = 0;

    for (let sectionIndex = 0; sectionIndex < expectedSections.length; sectionIndex += 1) {
        const section = course?.sections?.[sectionIndex];
        const expected = expectedSections[sectionIndex];
        const sectionNumber = sectionIndex + 1;
        check(section?.key === expected.key, `section ${sectionNumber} key must be ${expected.key}`);
        check(section?.groupId === expected.groupId, `${expected.key} has the wrong stable groupId`);
        check(section?.title === expected.title, `section ${sectionNumber} title must be ${expected.title}`);
        check(section?.rank === expected.rank, `${expected.key} rank must be ${expected.rank}`);
        check(typeof section?.outcome === "string" && section.outcome.length >= 40, `section ${sectionNumber} needs an outcome`);
        check(Array.isArray(section?.lessons) && section.lessons.length === 2, `section ${sectionNumber} must have two lessons`);

        section?.lessons?.forEach((lesson, lessonIndex) => {
            lessonKeys.push(lesson.key);
            lessonIds.push(lesson.lessonId);
            allLearnerText.push(validateLesson(lesson, expected.lessons[lessonIndex]));
        });

        if (section?.technicalExtension) {
            extensionCount += 1;
            allLearnerText.push(validateExtension(section.technicalExtension, sectionNumber));
        }
    }

    check(lessonKeys.length === 22, "course must have twenty-two lessons");
    check(new Set(lessonKeys).size === 22, "lesson keys must be unique");
    check(new Set(lessonIds).size === 22, "lesson IDs must be unique");
    check(extensionCount >= 4, "course needs explicit technical extensions in at least four sections");
    validateLessonMedia(course, mediaLock, assetContracts);

    const finalSection = course?.sections?.[course.sections.length - 1];
    const finalLesson = finalSection?.lessons?.[finalSection.lessons.length - 1];
    check(finalSection?.groupId === "group_ai_for_actual_work_07", "the capstone section must remain last");
    check(finalLesson?.lessonId === "lesson_ai_for_actual_work_14", "lesson 14 and its capstone must remain last");

    const finalLessonNodes = Array.isArray(finalLesson?.content?.content) ? finalLesson.content.content : [];
    const capstoneHeadingIndex = finalLessonNodes.findIndex(
        (node) => node.type === "heading" && plainText(node).trim() === "Capstone: run your workflow",
    );
    const embeddedArtifactList =
        capstoneHeadingIndex >= 0
            ? finalLessonNodes.slice(capstoneHeadingIndex + 1).find((node) => node.type === "orderedList")
            : undefined;
    const embeddedCapstoneArtifacts = (embeddedArtifactList?.content ?? []).map(
        (item) => plainText(item).trim().match(/^[a-z0-9-]+\.md\b/)?.[0],
    );
    check(
        JSON.stringify(embeddedCapstoneArtifacts) === JSON.stringify(expectedCapstoneArtifacts),
        "lesson 14 must present exactly the five locked run artefacts in course order",
    );

    const capstone = course?.capstone;
    check(capstone?.key === "run-your-ai-assisted-workflow", "capstone key is wrong");
    check(capstone?.capstoneId === "capstone_ai_for_actual_work_v1", "capstone ID must be stable");
    check(capstone?.embeddedInLessonKey === "turn-misses-into-system-improvements", "capstone must be embedded in lesson 14");
    check(typeof capstone?.title === "string" && capstone.title.length >= 8, "capstone needs a title");
    check(typeof capstone?.outcome === "string" && capstone.outcome.length >= 50, "capstone needs an outcome");
    check(typeof capstone?.exercise === "string" && capstone.exercise.length >= 120, "capstone needs a real-work exercise");
    check(
        JSON.stringify(capstone?.artifacts) === JSON.stringify(expectedCapstoneArtifacts),
        "capstone must collect exactly five locked run artefacts in course order",
    );
    check(Array.isArray(capstone?.verification) && capstone.verification.length >= 10, "capstone needs at least ten checks");

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
    for (const url of requiredPrimarySources) {
        check(sourceMap.includes(url), `source-map.md is missing primary source ${url}`);
    }
    for (const { keys } of expectedLessonMedia) {
        for (const key of keys) {
            const file = mediaLock?.entries?.find((entry) => entry.key === key)?.media?.file;
            const sourceMapLine = sourceMap.split("\n").find((line) => line.includes(`\`${key}\``));
            check(sourceMapLine, `source-map.md is missing sealed media target ${key}`);
            check(file && sourceMapLine?.includes(file), `source-map.md maps the wrong sealed media URL for ${key}`);
        }
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

console.log("Curriculum verification passed: 11 sections, 22 lessons, 7 lesson images, 1 capstone, stable IDs, traced sources, and clean learner copy.");
