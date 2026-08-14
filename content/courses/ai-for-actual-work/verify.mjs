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
            {
                key: "stop-asking-isolated-questions",
                lessonId: "lesson_ai_for_actual_work_01",
            },
            {
                key: "test-behaviour-not-brand-loyalty",
                lessonId: "lesson_ai_for_actual_work_02",
            },
        ],
    },
    {
        key: "build-context-that-survives-the-session",
        groupId: "group_ai_for_actual_work_02",
        title: "Build context that survives the session",
        rank: 2000,
        lessons: [
            {
                key: "turn-answers-into-reusable-rules",
                lessonId: "lesson_ai_for_actual_work_03",
            },
            {
                key: "route-context-and-give-it-an-update-trigger",
                lessonId: "lesson_ai_for_actual_work_04",
            },
        ],
    },
    {
        key: "choose-the-mechanism-before-the-prompt",
        groupId: "group_ai_for_actual_work_03",
        title: "Choose the mechanism before the prompt",
        rank: 3000,
        lessons: [
            {
                key: "use-policy-workflow-or-agent-on-purpose",
                lessonId: "lesson_ai_for_actual_work_05",
            },
            {
                key: "audit-the-substrate-before-adding-ai",
                lessonId: "lesson_ai_for_actual_work_06",
            },
        ],
    },
    {
        key: "choose-the-work-surface",
        groupId: "group_ai_for_actual_work_08",
        title: "Choose the work surface",
        rank: 4000,
        lessons: [
            {
                key: "separate-chat-from-delegated-work",
                lessonId: "lesson_ai_for_actual_work_15",
            },
            {
                key: "map-current-work-surfaces",
                lessonId: "lesson_ai_for_actual_work_16",
            },
        ],
    },
    {
        key: "build-checks-that-can-prove-you-wrong",
        groupId: "group_ai_for_actual_work_04",
        title: "Build checks that can prove you wrong",
        rank: 5000,
        lessons: [
            {
                key: "derive-expectations-from-the-requirement",
                lessonId: "lesson_ai_for_actual_work_07",
            },
            {
                key: "fail-cheaply-before-you-mutate",
                lessonId: "lesson_ai_for_actual_work_08",
            },
        ],
    },
    {
        key: "make-consequential-work-inspectable",
        groupId: "group_ai_for_actual_work_05",
        title: "Make consequential work inspectable",
        rank: 6000,
        lessons: [
            {
                key: "stop-the-system-from-guessing",
                lessonId: "lesson_ai_for_actual_work_09",
            },
            {
                key: "leave-a-replayable-decision-trace",
                lessonId: "lesson_ai_for_actual_work_10",
            },
        ],
    },
    {
        key: "close-delegated-work-properly",
        groupId: "group_ai_for_actual_work_06",
        title: "Close delegated work properly",
        rank: 7000,
        lessons: [
            {
                key: "treat-done-as-a-claim",
                lessonId: "lesson_ai_for_actual_work_11",
            },
            {
                key: "design-for-automation-failure",
                lessonId: "lesson_ai_for_actual_work_12",
            },
        ],
    },
    {
        key: "package-repeated-work",
        groupId: "group_ai_for_actual_work_09",
        title: "Package repeated work",
        rank: 8000,
        lessons: [
            {
                key: "write-and-test-a-skill",
                lessonId: "lesson_ai_for_actual_work_17",
            },
            {
                key: "separate-skills-from-mcp-connections",
                lessonId: "lesson_ai_for_actual_work_18",
            },
        ],
    },
    {
        key: "research-and-write-with-evidence",
        groupId: "group_ai_for_actual_work_10",
        title: "Research and write with evidence",
        rank: 9000,
        lessons: [
            {
                key: "research-before-you-draft",
                lessonId: "lesson_ai_for_actual_work_19",
            },
            {
                key: "edit-the-argument-and-repair-the-prose",
                lessonId: "lesson_ai_for_actual_work_20",
            },
        ],
    },
    {
        key: "produce-work-and-act-safely",
        groupId: "group_ai_for_actual_work_11",
        title: "Produce work and act safely",
        rank: 10000,
        lessons: [
            {
                key: "build-and-check-work-artifacts",
                lessonId: "lesson_ai_for_actual_work_21",
            },
            {
                key: "act-only-with-explicit-authority",
                lessonId: "lesson_ai_for_actual_work_22",
            },
        ],
    },
    {
        key: "keep-the-understanding-and-improve-the-setup",
        groupId: "group_ai_for_actual_work_07",
        title: "Keep the understanding and improve the setup",
        rank: 11000,
        lessons: [
            {
                key: "pay-back-some-of-the-speed",
                lessonId: "lesson_ai_for_actual_work_13",
            },
            {
                key: "turn-misses-into-system-improvements",
                lessonId: "lesson_ai_for_actual_work_14",
            },
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
        "separate-chat-from-delegated-work",
        ["ai-work-school-public-research.md"],
    ],
    ["map-current-work-surfaces", ["ai-work-school-public-research.md"]],
    ["write-and-test-a-skill", ["ai-work-school-skills-evidence.md"]],
    [
        "separate-skills-from-mcp-connections",
        [
            "ai-work-school-public-research.md",
            "ai-work-school-skills-evidence.md",
        ],
    ],
    [
        "research-before-you-draft",
        [
            "ai-work-school-public-research.md",
            "ai-work-school-skills-evidence.md",
        ],
    ],
    [
        "edit-the-argument-and-repair-the-prose",
        [
            "ai-work-school-public-research.md",
            "ai-work-school-skills-evidence.md",
        ],
    ],
    ["build-and-check-work-artifacts", ["ai-work-school-skills-evidence.md"]],
    [
        "act-only-with-explicit-authority",
        [
            "ai-work-school-public-research.md",
            "ai-work-school-skills-evidence.md",
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

const expectedConcepts = new Map([
    [
        "stop-asking-isolated-questions",
        { teaches: "safe-real-work-baseline", requires: [] },
    ],
    [
        "test-behaviour-not-brand-loyalty",
        { teaches: "behaviour-card", requires: ["safe-real-work-baseline"] },
    ],
    [
        "turn-answers-into-reusable-rules",
        { teaches: "reusable-rule", requires: ["behaviour-card"] },
    ],
    [
        "route-context-and-give-it-an-update-trigger",
        { teaches: "context-router", requires: ["reusable-rule"] },
    ],
    [
        "use-policy-workflow-or-agent-on-purpose",
        { teaches: "mechanism-choice", requires: ["context-router"] },
    ],
    [
        "audit-the-substrate-before-adding-ai",
        { teaches: "substrate-audit", requires: ["mechanism-choice"] },
    ],
    [
        "separate-chat-from-delegated-work",
        { teaches: "work-surface-choice", requires: ["mechanism-choice"] },
    ],
    [
        "map-current-work-surfaces",
        { teaches: "dated-surface-map", requires: ["work-surface-choice"] },
    ],
    [
        "derive-expectations-from-the-requirement",
        {
            teaches: "requirement-derived-check",
            requires: ["safe-real-work-baseline"],
        },
    ],
    [
        "fail-cheaply-before-you-mutate",
        {
            teaches: "failure-cost-order",
            requires: ["requirement-derived-check"],
        },
    ],
    [
        "stop-the-system-from-guessing",
        {
            teaches: "evidence-boundary",
            requires: ["requirement-derived-check"],
        },
    ],
    [
        "leave-a-replayable-decision-trace",
        { teaches: "decision-trace", requires: ["evidence-boundary"] },
    ],
    [
        "treat-done-as-a-claim",
        { teaches: "closure-ledger", requires: ["decision-trace"] },
    ],
    [
        "design-for-automation-failure",
        { teaches: "delegation-contract", requires: ["closure-ledger"] },
    ],
    [
        "write-and-test-a-skill",
        {
            teaches: "skill-package",
            requires: ["context-router", "mechanism-choice"],
        },
    ],
    [
        "separate-skills-from-mcp-connections",
        {
            teaches: "governed-connection",
            requires: ["skill-package", "work-surface-choice"],
        },
    ],
    [
        "research-before-you-draft",
        {
            teaches: "research-evidence-pack",
            requires: ["evidence-boundary", "work-surface-choice"],
        },
    ],
    [
        "edit-the-argument-and-repair-the-prose",
        {
            teaches: "evidence-preserving-edit",
            requires: ["research-evidence-pack"],
        },
    ],
    [
        "build-and-check-work-artifacts",
        {
            teaches: "artefact-verification",
            requires: ["requirement-derived-check", "work-surface-choice"],
        },
    ],
    [
        "act-only-with-explicit-authority",
        {
            teaches: "authority-gate",
            requires: ["artefact-verification", "evidence-boundary"],
        },
    ],
    [
        "pay-back-some-of-the-speed",
        { teaches: "understanding-pass", requires: ["delegation-contract"] },
    ],
    [
        "turn-misses-into-system-improvements",
        { teaches: "miss-triage", requires: ["understanding-pass"] },
    ],
]);

const expectedLessonPhrases = new Map([
    [
        "separate-chat-from-delegated-work",
        ["chat surface", "delegated work surface"],
    ],
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
    [
        "research-before-you-draft",
        ["claim-status table", "strongest counterargument", "fact-check"],
    ],
    [
        "edit-the-argument-and-repair-the-prose",
        ["idea map", "line edit", "fabrication check", "AI-writing repair"],
    ],
    [
        "build-and-check-work-artifacts",
        [
            "document",
            "spreadsheet",
            "meeting",
            "illustrative accountant exercise",
        ],
    ],
    [
        "act-only-with-explicit-authority",
        [
            "safe action",
            "action ledger",
            "illustrative lawyer exercise",
            "illustrative operations exercise",
        ],
    ],
]);

const requiredPrimarySources = [
    "https://help.openai.com/en/articles/20001275/",
    "https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork",
    "https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-overview",
    "https://learn.microsoft.com/en-us/microsoft-365/copilot/cowork/",
    "https://modelcontextprotocol.io/docs/getting-started/intro",
];

const expectedPracticalLinks = new Map([
    [
        "map-current-work-surfaces",
        [
            {
                text: "ChatGPT Work and Codex guide",
                href: "https://help.openai.com/en/articles/20001275/",
            },
            {
                text: "Claude Cowork setup guide",
                href: "https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork",
            },
            {
                text: "Microsoft Cowork setup guide",
                href: "https://support.microsoft.com/en-us/microsoft-365-copilot/get-started-with-cowork",
            },
            {
                text: "Open ChatGPT, then choose Work for a bounded multi-step job or Codex for repository work. Interface captured from OpenAI on 14 August 2026.",
                href: "https://chatgpt.com/",
            },
            {
                text: "Claude Cowork shows the request, connected sources and finished slide deck in one task view. Interface captured from Anthropic on 14 August 2026.",
                href: "https://claude.ai/",
            },
            {
                text: "Open Microsoft 365 Copilot and switch from Chat to Cowork before starting a multi-step task. Interface captured from Microsoft Support on 14 August 2026.",
                href: "https://m365.cloud.microsoft/",
            },
        ],
    ],
    [
        "write-and-test-a-skill",
        [
            {
                text: "open Agent Skills format",
                href: "https://agentskills.io/home",
            },
            {
                text: "ChatGPT",
                href: "https://help.openai.com/en/articles/20001066",
            },
            {
                text: "Claude",
                href: "https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview",
            },
            {
                text: "Microsoft 365 Copilot Cowork",
                href: "https://learn.microsoft.com/en-us/microsoft-365/copilot/cowork/cowork-customize",
            },
        ],
    ],
    [
        "separate-skills-from-mcp-connections",
        [
            {
                text: "MCP introduction",
                href: "https://modelcontextprotocol.io/docs/getting-started/intro",
            },
            {
                text: "official MCP Registry",
                href: "https://registry.modelcontextprotocol.io/",
            },
            {
                text: "ChatGPT's Plugin Directory",
                href: "https://chatgpt.com/plugins",
            },
            {
                text: "Claude Connectors",
                href: "https://claude.com/connectors",
            },
            {
                text: "Microsoft 365 Copilot Cowork plugins",
                href: "https://learn.microsoft.com/en-us/microsoft-365/copilot/cowork/cowork-plugins",
            },
        ],
    ],
]);

const expectedLessonMedia = [
    {
        lessonId: "lesson_ai_for_actual_work_02",
        keys: ["behaviour-card-comparison-lesson"],
        precedingText:
            "The research-brief case below is a complete behaviour card in prose. Read it as a demonstration of controlled comparison: one variable changes, the job stays fixed, and every conclusion is limited to what the two runs can support.",
        followingHeading: "Loyalty is not literacy",
    },
    {
        lessonId: "lesson_ai_for_actual_work_04",
        keys: ["context-router-lesson"],
        precedingText:
            "The operational-handover case below shows the router as a maintained system rather than one large prompt. Watch where each kind of context lives, what evidence can overturn it, and which named person or event causes an update.",
        followingHeading: "One big instruction file is the wrong shape",
    },
    {
        lessonId: "lesson_ai_for_actual_work_05",
        keys: ["mechanism-ladder-lesson"],
        precedingText:
            "The explanation below demonstrates the lowest-sufficient-mechanism test. Policy fixes a known choice, workflow fixes known order, and an agent handles bounded judgement. The useful move is arguing work down the ladder, not promoting it toward novelty.",
        followingHeading: "Three ways to allocate judgement",
    },
    {
        lessonId: "lesson_ai_for_actual_work_15",
        keys: ["work-surface-choice-lesson"],
        precedingText:
            "The lesson below treats chat and delegated work as different surfaces, not levels of intelligence. Watch how job duration, continuity, context, authority, and review change the choice.",
        followingHeading: "Choose from the job, not the button",
    },
    {
        lessonId: "lesson_ai_for_actual_work_16",
        keys: [
            "chatgpt-work-interface-lesson",
            "claude-cowork-interface-lesson",
            "microsoft-cowork-interface-lesson",
        ],
        precedingText:
            "These screenshots show where the current products expose delegated work. They are evidence of the interface on 14 August 2026, not evidence that your account has access or that any product suits your job.",
        followingHeading: "Use four evidence states",
    },
    {
        lessonId: "lesson_ai_for_actual_work_07",
        keys: ["check-repair-lesson"],
        precedingText:
            "The three repairs below demonstrate the dependency from requirement to expectation to plausible failure to check. Compare each weak check with the repaired one and notice which realistic bug the repair can now catch.",
        followingHeading: "Where expected results come from",
    },
    {
        lessonId: "lesson_ai_for_actual_work_10",
        keys: ["decision-trace-lesson"],
        precedingText:
            "The lesson below demonstrates a trace as the explanation of a decision. The review map is only a compact view into that trace; it does not replace sources, checks, or the final-state proof.",
        followingHeading: "The record is the explanation",
    },
    {
        lessonId: "lesson_ai_for_actual_work_11",
        keys: ["closure-states-lesson"],
        precedingText:
            "The closure model below demonstrates why a completion claim is only a proposed state. Work moves through review, acceptance or rejection, integration, final-state verification, and cleanup, with evidence at every transition.",
        followingHeading: "A stopped worker is not a delivered result",
    },
    {
        lessonId: "lesson_ai_for_actual_work_17",
        keys: ["skill-lesson", "skill-package-lesson"],
        precedingText:
            "Tighten the step that fails dangerously, not every sentence around it.",
        followingHeading: "Keep the core small and route the rest",
    },
    {
        lessonId: "lesson_ai_for_actual_work_18",
        keys: ["mcp-lesson", "mcp-connection-lesson"],
        precedingText:
            "Check the current client and approved server before relying on any connection.",
        followingHeading: "Choose among four honest answers",
    },
    {
        lessonId: "lesson_ai_for_actual_work_18",
        keys: ["chatgpt-plugin-directory-lesson"],
        precedingText:
            "Directories help you discover available integrations. They do not prove that a publisher, server, scope or action is approved. Start with the system where the source of truth already lives, inspect the exact permissions, and prefer read-only access for the first harmless test.",
        followingHeading: "Test access without testing damage",
    },
    {
        lessonId: "lesson_ai_for_actual_work_19",
        keys: ["claim-argument-map-lesson"],
        precedingText:
            "The claim-status and argument method below demonstrates research before drafting. Sources earn a place by supporting a named claim; gaps, counterarguments, and dropped sources remain visible instead of being smoothed into prose.",
        followingHeading: "Name the decision before the topic",
    },
    {
        lessonId: "lesson_ai_for_actual_work_20",
        keys: ["editorial-partnership-lesson"],
        precedingText:
            "End each section with a consequence, decision or next action rather than a summary of itself.",
        followingHeading: "Repair AI writing without fabricating humanity",
    },
    {
        lessonId: "lesson_ai_for_actual_work_21",
        keys: ["checked-work-lesson", "checked-workflow-lesson"],
        precedingText:
            "Visual polish is a later proof, not a substitute for the first ones.",
        followingHeading: "Document lane",
    },
    {
        lessonId: "lesson_ai_for_actual_work_22",
        keys: ["authority-sequence-lesson"],
        precedingText:
            "The accounting, legal, and operations cases below demonstrate the same authority sequence. Drafting and proposing are not permission to act; final-state evidence comes from the external system after the authorised action.",
        followingHeading: "Drafting is not authority",
    },
    {
        lessonId: "lesson_ai_for_actual_work_14",
        keys: ["capstone-loop-lesson"],
        precedingText:
            "The lesson below demonstrates miss triage before improvement. A miss becomes one bounded setup change, a fresh rerun, retained evidence, and a handover. The capstone then applies the whole course to one new real run.",
        followingHeading: "Sort the misses before you fix anything",
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
const allowedMarkTypes = new Set(["bold", "italic", "code", "strike", "link"]);
const requiredLessonHeadings = new Set([
    "Try it on your work",
    "What you will make",
    "Check your work",
]);
const requiredTeachingSequence = [
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
const expectedTeachingMarkers = new Map([
    [
        "stop-asking-isolated-questions",
        [
            "recipient, the decision or use",
            "monthly list of approved budget movements",
            "question, not a job",
            "first-pass chronology",
            "what would make that person reject",
        ],
    ],
    [
        "test-behaviour-not-brand-loyalty",
        [
            "one thing you could change between two runs",
            "same ten comments",
            "observation about two runs and a product ranking",
            "operational handover instead of a research brief",
            "Limit the conclusion to this job",
        ],
    ],
    [
        "turn-answers-into-reusable-rules",
        [
            "last time an AI tool or colleague stopped",
            "cancelled subscriptions",
            "answering an interrupt is not the same",
            "legal intake workflow",
            "answer recurs unchanged",
        ],
    ],
    [
        "route-context-and-give-it-an-update-trigger",
        [
            "one standing rule, one procedure",
            "invented procurement review",
            "routing problem and a maintenance problem",
            "matter-intake job",
            "Start with update rhythm",
        ],
    ],
    [
        "use-policy-workflow-or-agent-on-purpose",
        [
            "Break your chosen job into three decisions",
            "invented expense-review job",
            "without describing products",
            "contract-intake job",
            "known in advance",
        ],
    ],
    [
        "audit-the-substrate-before-adding-ai",
        [
            "draw the current job as inputs, rules",
            "invented supplier-review process",
            "weak process",
            "monthly reconciliation",
            "manual fallback",
        ],
    ],
    [
        "separate-chat-from-delegated-work",
        [
            "label each one chat, delegated work",
            "invented meeting-brief job",
            "chat answer and delegated work",
            "quarterly finance commentary",
            "person in the step",
        ],
    ],
    [
        "map-current-work-surfaces",
        [
            "one AI work surface you can access today",
            "Classify four statements",
            "documented feature is not automatically approved",
            "spreadsheet or meeting surface",
            "Vendor documentation supports capability",
        ],
    ],
    [
        "derive-expectations-from-the-requirement",
        [
            "one requirement from your chosen job",
            "invented reconciliation requirement",
            "expected result comes from",
            "board memo",
            "Invent the wrong result",
        ],
    ],
    [
        "fail-cheaply-before-you-mutate",
        [
            "next six steps",
            "invented record-update job",
            "failure-cost ordering",
            "publishing a client-facing document",
            "checks that read but do not change",
        ],
    ],
    [
        "stop-the-system-from-guessing",
        [
            "one consequential claim",
            "Supplier A improved delivery performance",
            "provenance and support",
            "legal chronology",
            "preserve the gap",
        ],
    ],
    [
        "leave-a-replayable-decision-trace",
        [
            "one decision your workflow makes",
            "invented procurement trace",
            "narrative summary",
            "meeting preparation",
            "rejected alternatives",
        ],
    ],
    [
        "treat-done-as-a-claim",
        [
            "fresh evidence you would demand",
            "invented weekly-report job",
            "stopped worker, saved draft",
            "calendar update",
            "produced, reviewed, accepted",
        ],
    ],
    [
        "design-for-automation-failure",
        [
            "failure path for your job",
            "invented CRM correction",
            "operator on call",
            "client email",
            "exact objects and fields",
        ],
    ],
    [
        "write-and-test-a-skill",
        [
            "repeated part of your job",
            "approved meeting transcript",
            "reusable work package",
            "month-end variance commentary",
            "fresh case",
        ],
    ],
    [
        "separate-skills-from-mcp-connections",
        [
            "instruction, data access, action capability",
            "invented calendar-preparation job",
            "skill cannot grant access",
            "document repository",
            "Instruction answers how",
        ],
    ],
    [
        "research-before-you-draft",
        [
            "decision your work must support",
            "renew a supplier",
            "drafting before the evidence map",
            "policy briefing",
            "consequential claim a source",
        ],
    ],
    [
        "edit-the-argument-and-repair-the-prose",
        [
            "structural, which is evidential",
            "invented recommendation",
            "argument pass and the prose pass",
            "board update or client note",
            "Reject stylistic suggestions",
        ],
    ],
    [
        "build-and-check-work-artifacts",
        [
            "Choose one lane only",
            "partly completed board brief",
            "checks that apply to every work artefact",
            "two lanes you skipped",
            "Do not complete all three lanes",
        ],
    ],
    [
        "act-only-with-explicit-authority",
        [
            "external action your workflow could propose",
            "invented supplier-contact action",
            "inspect, propose, approve",
            "calendar or client record",
            "Bind approval to the exact",
        ],
    ],
    [
        "pay-back-some-of-the-speed",
        [
            "five predictions in understanding-pass.md",
            "invented reporting workflow",
            "authority, destination, restart",
            "most recent work you delegated",
            "wrong answer identifies",
        ],
    ],
    [
        "turn-misses-into-system-improvements",
        [
            "one miss from a fresh workflow run",
            "weekly brief",
            "bug report against the setup",
            "different surface",
            "Change one thing",
        ],
    ],
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
    if (node.type === "text")
        return typeof node.text === "string" ? node.text : "";
    return Array.isArray(node.content)
        ? node.content.map(plainText).join("\n")
        : "";
}

function collectHeadings(node, headings = []) {
    if (!node || typeof node !== "object") return headings;
    if (node.type === "heading") headings.push(plainText(node).trim());
    if (Array.isArray(node.content)) {
        for (const child of node.content) collectHeadings(child, headings);
    }
    return headings;
}

function validateTeachingSequence(lesson, label) {
    const headings = collectHeadings(lesson?.content);
    const nodes = lesson?.content?.content ?? [];
    let previousIndex = -1;

    for (const requiredHeading of requiredTeachingSequence) {
        const indexes = headings.flatMap((heading, index) =>
            heading === requiredHeading ? [index] : [],
        );
        check(
            indexes.length === 1,
            `${label} needs exactly one ${requiredHeading} heading`,
        );
        if (indexes.length === 1) {
            check(
                indexes[0] > previousIndex,
                `${label} must place ${requiredHeading} after ${requiredTeachingSequence[requiredTeachingSequence.indexOf(requiredHeading) - 1]}`,
            );
            previousIndex = indexes[0];
        }
    }

    const nodeIndex = (heading) =>
        nodes.findIndex(
            (node) =>
                node.type === "heading" && plainText(node).trim() === heading,
        );
    const beforeIndex = nodeIndex("Before you continue");
    const guidedIndex = nodeIndex("Try it with guidance");
    const teachBackIndex = nodeIndex("Teach it back");
    const hintsIndex = nodeIndex("If you get stuck");

    check(
        nodes[beforeIndex + 1]?.type === "blockquote",
        `${label} prediction must be a written blockquote`,
    );
    check(
        nodes[guidedIndex + 1]?.type === "paragraph",
        `${label} guided practice needs a case`,
    );
    check(
        nodes[guidedIndex + 2]?.type === "orderedList",
        `${label} guided practice needs ordered steps`,
    );
    check(
        nodes[guidedIndex + 3]?.type === "blockquote",
        `${label} guided practice needs a stop-and-record checkpoint`,
    );
    check(
        nodes[teachBackIndex + 1]?.type === "blockquote",
        `${label} teach-back must require a written explanation`,
    );
    check(
        nodes[hintsIndex + 1]?.type === "orderedList",
        `${label} hints must be a graduated ordered list`,
    );
    check(
        nodes[hintsIndex + 1]?.content?.length === 3,
        `${label} needs exactly three graduated hints`,
    );

    for (const failure of teachingMarkerFailures(lesson)) {
        check(false, `${label} ${failure}`);
    }
}

function teachingMarkerFailures(lesson) {
    const markers = expectedTeachingMarkers.get(lesson?.key);
    if (!markers) return ["has no lesson-owned teaching marker contract"];
    const nodes = lesson?.content?.content ?? [];
    const followingNode = (heading) => {
        const index = nodes.findIndex(
            (node) =>
                node.type === "heading" && plainText(node).trim() === heading,
        );
        return nodes[index + 1];
    };
    const guidedIndex = nodes.findIndex(
        (node) =>
            node.type === "heading" &&
            plainText(node).trim() === "Try it with guidance",
    );
    const segments = [
        followingNode("Before you continue"),
        followingNode("Try it with guidance"),
        followingNode("Teach it back"),
        followingNode("Try a changed case"),
        followingNode("If you get stuck"),
    ].map((node) => plainText(node).trim());
    const labels = [
        "prediction",
        "guided case",
        "teach-back",
        "changed case",
        "hints",
    ];
    const failures = markers.flatMap((marker, index) =>
        segments[index]?.includes(marker)
            ? []
            : [
                  `${labels[index]} must retain its reviewed concept marker: ${marker}`,
              ],
    );
    if (!segments[0].includes(lesson.artifact?.filename ?? "")) {
        failures.push("prediction must write into the lesson artefact");
    }
    const guidedSteps = nodes[guidedIndex + 2]?.content ?? [];
    if (
        guidedSteps.length < 3 ||
        guidedSteps.length > 4 ||
        guidedSteps.some((item) => plainText(item).trim().length < 40)
    ) {
        failures.push(
            "guided case must leave three or four consequential decisions to the learner",
        );
    }
    const hints = followingNode("If you get stuck")?.content ?? [];
    if (hints.some((item) => plainText(item).trim().length < 35)) {
        failures.push("graduated hints must name a usable next move");
    }
    return failures;
}

function validatePedagogyMutationGate(course) {
    const lessons = course.sections.flatMap((section) => section.lessons);
    const first = structuredClone(lessons[0]);
    const second = structuredClone(lessons[1]);
    const nodeAfter = (lesson, heading) => {
        const nodes = lesson.content.content;
        const index = nodes.findIndex(
            (node) =>
                node.type === "heading" && plainText(node).trim() === heading,
        );
        return nodes[index + 1];
    };

    const firstPrediction = nodeAfter(first, "Before you continue");
    const secondPrediction = nodeAfter(second, "Before you continue");
    [firstPrediction.content, secondPrediction.content] = [
        secondPrediction.content,
        firstPrediction.content,
    ];
    check(
        teachingMarkerFailures(first).length > 0 &&
            teachingMarkerFailures(second).length > 0,
        "pedagogy verifier must reject swapped lesson predictions",
    );

    const mutations = [
        [
            "Before you continue",
            "Write something in your file before continuing.",
        ],
        ["Try it with guidance", "Complete a generic example."],
        ["Teach it back", "Explain the lesson."],
        ["Try a changed case", "Try another case."],
        ["If you get stuck", "Read the lesson again."],
    ];
    for (const [heading, replacement] of mutations) {
        const mutated = structuredClone(lessons[0]);
        const node = nodeAfter(mutated, heading);
        node.content = [
            {
                type: "paragraph",
                content: [{ type: "text", text: replacement }],
            },
        ];
        check(
            teachingMarkerFailures(mutated).length > 0,
            `pedagogy verifier must reject weakened ${heading} content`,
        );
    }
}

function validateTipTap(document, label, { allowCodeBlocks, allowImages }) {
    check(document?.type === "doc", `${label} must be a TipTap doc`);
    check(
        Array.isArray(document?.content),
        `${label} must have a content array`,
    );

    function visit(node, path) {
        if (!node || typeof node !== "object") {
            errors.push(`${label} has a non-object node at ${path}`);
            return;
        }

        check(
            allowedNodeTypes.has(node.type),
            `${label} uses unsupported node ${node.type} at ${path}`,
        );
        if (!allowCodeBlocks) {
            check(
                node.type !== "codeBlock",
                `${label} puts engineering/code content in the core lesson`,
            );
        }
        if (!allowImages) {
            check(
                node.type !== "image",
                `${label} contains an image outside a reviewed core lesson target`,
            );
        }
        if (node.type === "heading") {
            check(
                [2, 3].includes(node.attrs?.level),
                `${label} heading at ${path} must use level 2 or 3`,
            );
        }
        if (node.type === "text") {
            check(
                typeof node.text === "string" && node.text.length > 0,
                `${label} has an empty text node at ${path}`,
            );
            check(
                !Object.hasOwn(node, "content"),
                `${label} text node at ${path} cannot have children`,
            );
        }
        if (node.type === "image") {
            check(
                !Object.hasOwn(node, "content"),
                `${label} image at ${path} cannot have children`,
            );
            check(
                /^https:\/\//.test(node.attrs?.src),
                `${label} image at ${path} needs an HTTPS src`,
            );
            check(
                node.attrs?.alt?.trim().length >= 40,
                `${label} image at ${path} needs meaningful alt text`,
            );
            check(
                node.attrs?.title?.trim().length >= 40,
                `${label} image at ${path} needs a meaningful title`,
            );
        }
        if (Array.isArray(node.marks)) {
            for (const mark of node.marks) {
                check(
                    allowedMarkTypes.has(mark?.type),
                    `${label} uses unsupported mark ${mark?.type} at ${path}`,
                );
                if (mark?.type === "link") {
                    check(
                        typeof mark.attrs?.href === "string" &&
                            /^https:\/\/[^\s]+$/.test(mark.attrs.href),
                        `${label} uses an unsafe link at ${path}`,
                    );
                }
            }
        }
        if (Array.isArray(node.content)) {
            node.content.forEach((child, index) =>
                visit(child, `${path}.content[${index}]`),
            );
        }
    }

    if (Array.isArray(document?.content)) {
        document.content.forEach((node, index) =>
            visit(node, `content[${index}]`),
        );
    }
}

function textWithoutVisuals(document) {
    const nodes = Array.isArray(document?.content) ? document.content : [];
    const captionIndexes = new Set();
    nodes.forEach((node, index) => {
        if (node?.type === "image") captionIndexes.add(index + 1);
    });
    return nodes
        .filter(
            (node, index) =>
                node?.type !== "image" && !captionIndexes.has(index),
        )
        .map(plainText)
        .join("\n");
}

function assetByTargetKey(assetContracts, key) {
    return [
        ...(assetContracts?.rasters ?? []),
        ...(assetContracts?.diagrams ?? []),
    ].find((asset) =>
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

function collectLinks(node, links = []) {
    if (!node || typeof node !== "object") return links;
    if (Array.isArray(node.marks)) {
        for (const mark of node.marks) {
            if (mark?.type === "link" && typeof mark.attrs?.href === "string") {
                links.push({ text: node.text, href: mark.attrs.href });
            }
        }
    }
    if (Array.isArray(node.content)) {
        for (const child of node.content) collectLinks(child, links);
    }
    return links;
}

function practicalLinkFailures(lesson) {
    const expected = expectedPracticalLinks.get(lesson.key);
    if (!expected) return [];
    const actual = collectLinks(lesson.content);
    const failures = [];
    if (actual.length !== expected.length) {
        failures.push(
            `needs exactly ${expected.length} practical links, found ${actual.length}`,
        );
    }
    expected.forEach((link, index) => {
        if (actual[index]?.text !== link.text) {
            failures.push(
                `practical link ${index + 1} must retain label ${link.text}`,
            );
        }
        if (actual[index]?.href !== link.href) {
            failures.push(
                `practical link ${link.text} must point to ${link.href}`,
            );
        }
    });
    return failures;
}

function validatePracticalLinks(lesson, label) {
    for (const failure of practicalLinkFailures(lesson)) {
        check(false, `${label} ${failure}`);
    }
}

function validatePracticalLinkMutationGate(course) {
    const lesson = structuredClone(
        course.sections
            .flatMap((section) => section.lessons)
            .find(({ key }) => key === "map-current-work-surfaces"),
    );
    const linkMarks = [];
    const visit = (node) => {
        if (!node || typeof node !== "object") return;
        for (const mark of node.marks ?? []) {
            if (mark?.type === "link") linkMarks.push(mark);
        }
        for (const child of node.content ?? []) visit(child);
    };
    visit(lesson.content);
    if (linkMarks.length < 2) {
        check(
            false,
            "curriculum verifier needs two practical links for its swap mutation",
        );
        return;
    }
    [linkMarks[0].attrs.href, linkMarks[1].attrs.href] = [
        linkMarks[1].attrs.href,
        linkMarks[0].attrs.href,
    ];
    check(
        practicalLinkFailures(lesson).length > 0,
        "curriculum verifier must reject swapped practical link targets",
    );
}

function validateLessonMedia(course, mediaLock, assetContracts) {
    const mediaByKey = new Map(
        (mediaLock?.entries ?? []).map((entry) => [entry.key, entry]),
    );
    const allLessons = (course?.sections ?? []).flatMap(
        (section) => section.lessons ?? [],
    );
    const actualImageSources = [];

    for (const expected of expectedLessonMedia) {
        const lesson = allLessons.find(
            ({ lessonId }) => lessonId === expected.lessonId,
        );
        const nodes = Array.isArray(lesson?.content?.content)
            ? lesson.content.content
            : [];
        const precedingIndex = nodes.findIndex(
            (node) =>
                node.type === "paragraph" &&
                plainText(node).trim().endsWith(expected.precedingText),
        );
        check(
            precedingIndex >= 0,
            `${expected.lessonId} is missing its reviewed media anchor`,
        );

        expected.keys.forEach((key, keyIndex) => {
            const imageIndex = precedingIndex + 1 + keyIndex * 2;
            const image = nodes[imageIndex];
            const caption = nodes[imageIndex + 1];
            const media = mediaByKey.get(key)?.media;
            const asset = assetByTargetKey(assetContracts, key);
            const promotionTarget = asset?.promotionTargets?.find(
                (target) => target.key === key,
            );
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
            check(
                image?.type === "image",
                `${expected.lessonId} must place ${key} at its reviewed anchor`,
            );
            check(
                isDeepStrictEqual(image?.attrs, expectedAttrs),
                `${expected.lessonId} ${key} image attributes must match the sealed media and accessibility contracts`,
            );
            check(
                caption?.type === "paragraph",
                `${expected.lessonId} ${key} needs a visible caption paragraph`,
            );
            check(
                plainText(caption).trim() === media?.caption,
                `${expected.lessonId} ${key} caption must match the sealed media contract`,
            );
        });

        const followingNode =
            nodes[precedingIndex + 1 + expected.keys.length * 2];
        check(
            followingNode?.type === "heading" &&
                plainText(followingNode).trim() === expected.followingHeading,
            `${expected.lessonId} media must remain at the reviewed reading-order anchor`,
        );
    }

    for (const lesson of allLessons) {
        actualImageSources.push(
            ...collectImages(lesson?.content).map((image) => image.attrs?.src),
        );
    }
    const expectedImageSources = expectedLessonMedia.flatMap(({ keys }) =>
        keys.map((key) => mediaByKey.get(key)?.media?.file),
    );
    check(
        JSON.stringify(actualImageSources) ===
            JSON.stringify(expectedImageSources),
        "course lessons must contain exactly the twenty-one reviewed images in reading order",
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
        check(
            typeof filename === "string" && filename.endsWith(".md"),
            `${label} has an invalid source filename`,
        );
        check(
            !filename.includes("/") && !filename.includes("\\"),
            `${label} exposes a source path instead of a filename`,
        );
    }
}

function validateConceptDependencies(course) {
    const lessons = (course?.sections ?? []).flatMap(
        (section) => section.lessons ?? [],
    );
    const taught = new Set();

    for (const lesson of lessons) {
        const expected = expectedConcepts.get(lesson.key);
        check(expected, `${lesson.lessonId} needs a reviewed concept contract`);
        if (!expected) continue;
        check(
            lesson.teaches === expected.teaches,
            `${lesson.lessonId} must teach ${expected.teaches}`,
        );
        check(
            JSON.stringify(lesson.requires) ===
                JSON.stringify(expected.requires),
            `${lesson.lessonId} prerequisite concepts must match the reviewed dependency map`,
        );
        check(
            !taught.has(expected.teaches),
            `${expected.teaches} must be taught by exactly one lesson`,
        );
        for (const prerequisite of expected.requires) {
            check(
                taught.has(prerequisite),
                `${lesson.lessonId} requires ${prerequisite} before it is taught`,
            );
        }
        taught.add(expected.teaches);
    }
}

function validateLesson(lesson, expected) {
    const label = expected.lessonId;

    check(lesson?.key === expected.key, `${label} key must be ${expected.key}`);
    check(
        lesson?.lessonId === expected.lessonId,
        `${expected.key} has the wrong stable lessonId`,
    );
    check(
        typeof lesson?.title === "string" && lesson.title.length >= 8,
        `${label} needs a title`,
    );
    check(
        typeof lesson?.outcome === "string" &&
            lesson.outcome.length >= 40 &&
            lesson.outcome.length <= 240,
        `${label} needs a concise outcome`,
    );
    check(lesson?.type === "text", `${label} type must be text`);
    check(
        lesson?.published === true,
        `${label} intended state must be published`,
    );
    check(
        lesson?.requiresEnrollment ===
            (expected.lessonId !== "lesson_ai_for_actual_work_01"),
        `${label} has the wrong enrolment setting`,
    );
    check(
        typeof lesson?.exercise === "string" && lesson.exercise.length >= 100,
        `${label} needs a real-work exercise`,
    );
    check(
        typeof lesson?.artifact?.filename === "string" &&
            lesson.artifact.filename.endsWith(".md"),
        `${label} needs a Markdown artefact filename`,
    );
    check(
        typeof lesson?.artifact?.description === "string" &&
            lesson.artifact.description.length >= 60,
        `${label} needs an artefact description`,
    );
    check(
        Array.isArray(lesson?.verification) && lesson.verification.length >= 4,
        `${label} needs at least four verification checks`,
    );
    check(
        lesson?.verification?.every(
            (item) => typeof item === "string" && item.length >= 25,
        ),
        `${label} has a weak verification check`,
    );

    validateTipTap(lesson?.content, `${label} content`, {
        allowCodeBlocks: false,
        allowImages: true,
    });
    const text = textWithoutVisuals(lesson?.content);
    check(
        text.length >= 2500,
        `${label} content is too short (${text.length}/2500 characters)`,
    );
    const headings = new Set(collectHeadings(lesson?.content));
    for (const heading of requiredLessonHeadings) {
        check(
            headings.has(heading),
            `${label} is missing the heading ${heading}`,
        );
    }
    for (const phrase of expectedLessonPhrases.get(expected.key) ?? []) {
        check(
            text.includes(phrase),
            `${label} must teach or demonstrate: ${phrase}`,
        );
    }
    if (expected.lessonId === "lesson_ai_for_actual_work_14") {
        check(
            headings.has("Capstone: run your workflow"),
            `${label} must contain the capstone`,
        );
    }
    if (expected.lessonId === "lesson_ai_for_actual_work_21") {
        check(
            text.includes("Choose one lane for your first pass"),
            `${label} must tell learners to practise one professional-file lane first`,
        );
    }
    check(
        text.includes(lesson.artifact.filename),
        `${label} must name its learner artefact in the lesson`,
    );
    validateTeachingSequence(lesson, label);
    validateSources(lesson, label);
    validatePracticalLinks(lesson, label);
    return text;
}

function validateExtension(extension, sectionNumber) {
    if (!extension) return "";
    const label = `section ${sectionNumber} technical extension`;
    check(extension.optional === true, `${label} must be optional`);
    check(
        extension.requiredForNextSection === false,
        `${label} cannot be a prerequisite`,
    );
    check(
        extension.audience === "technical practitioners",
        `${label} must name its audience`,
    );
    check(
        typeof extension.title === "string" && extension.title.length >= 8,
        `${label} needs a title`,
    );
    check(
        typeof extension.outcome === "string" && extension.outcome.length >= 40,
        `${label} needs an outcome`,
    );
    check(
        Array.isArray(extension.sourceNotes) &&
            extension.sourceNotes.length > 0,
        `${label} needs source notes`,
    );
    extension.sourceNotes?.forEach((filename) => {
        check(
            typeof filename === "string" && filename.endsWith(".md"),
            `${label} has an invalid source filename`,
        );
        check(
            !filename.includes("/") && !filename.includes("\\"),
            `${label} exposes a source path`,
        );
    });
    validateTipTap(extension.content, `${label} content`, {
        allowCodeBlocks: true,
        allowImages: false,
    });
    const text = plainText(extension.content);
    check(
        text.length >= 500,
        `${label} content is too short (${text.length}/500 characters)`,
    );
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
            values.push(
                section.technicalExtension.title,
                section.technicalExtension.outcome,
            );
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
        [
            /[\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/u,
            "invisible Unicode mark",
        ],
        [/\b(?:twelve|12)[ -]month\b/i, "unsupported twelve-month advantage"],
        [/\bjob security\b/i, "unsupported job-security claim"],
        [/\b\d+(?:\.\d+)?\s*%/, "percentage claim"],
        [
            /\b\d+\s+(?:minutes?|hours?)\s+(?:saved|faster)\b/i,
            "fixed time-saving claim",
        ],
        [
            /\b(?:ChatGPT|Claude|Copilot|Codex)\b.{0,40}\b(?:outperforms?|superior|more accurate|faster|best)\b/i,
            "unsupported product ranking or performance claim",
        ],
        [
            /\b(?:Contentful|Notto|Life Coach OS)\b/i,
            "private or internal project detail",
        ],
        [/(?:\/Users\/|iCloud|Obsidian)/i, "private source path"],
        [/https?:\/\//i, "learner-facing URL"],
        [
            /\b(?:behavior|organization|organize|analyze|authorization|centered)\b/i,
            "American spelling",
        ],
        [
            /\b(?:delve|pivotal|showcase|tapestry|testament|vibrant)\b/i,
            "stock AI vocabulary",
        ],
        [
            /\b(?:let's dive in|here's what you need to know|in this lesson, we will)\b/i,
            "AI signposting",
        ],
    ];

    for (const [pattern, description] of bannedPatterns) {
        const match = text.match(pattern);
        check(
            !match,
            `learner-facing text contains ${description}${match ? `: ${match[0]}` : ""}`,
        );
    }
}

const manifest = parseManifest();
const sourceMap = readRequiredFile(sourceMapPath, "source-map.md");
const editorialNotes = readRequiredFile(
    editorialNotesPath,
    "editorial-notes.md",
);
const mediaLock = parseRequiredJson(mediaPath, "media.json");
const assetContracts = parseRequiredJson(
    assetContractsPath,
    "asset-contracts.json",
);

if (manifest) {
    check(manifest.schemaVersion === 1, "schemaVersion must be 1");
    const course = manifest.course;
    check(
        course?.key === "ai-for-actual-work",
        "course key must be ai-for-actual-work",
    );
    check(
        course?.courseId === "course_ai_for_actual_work_v1",
        "courseId must be stable",
    );
    check(
        course?.slug === "ai-for-actual-work",
        "course slug must be ai-for-actual-work",
    );
    check(
        course?.title === "AI for actual work",
        "course title must be AI for actual work",
    );
    check(course?.access === "free", "course access must be free");
    check(course?.privacy === "public", "course privacy must be public");
    check(
        course?.published === true,
        "course intended state must be published",
    );
    const featuredImage = mediaLock?.entries?.find(
        ({ key }) => key === "course-featured-image",
    )?.media;
    const featuredAsset = assetByTargetKey(
        assetContracts,
        "course-featured-image",
    );
    const featuredTarget = featuredAsset?.promotionTargets?.find(
        ({ key }) => key === "course-featured-image",
    );
    check(featuredImage, "course-featured-image has no sealed media entry");
    check(
        featuredTarget?.owner === "course-manifest" &&
            featuredTarget?.resolvedTargetId === course?.courseId,
        "course-featured-image must resolve to the stable course ID in the reviewed asset contract",
    );
    check(
        isDeepStrictEqual(course?.featuredImage, featuredImage),
        "course featuredImage must match the sealed course-featured-image Media object",
    );
    check(
        Array.isArray(course?.sections) && course.sections.length === 11,
        "course must have eleven sections",
    );
    for (const phrase of requiredDescriptionPhrases) {
        check(
            course?.description?.toLowerCase().includes(phrase.toLowerCase()),
            `course description must cover: ${phrase}`,
        );
    }

    const lessonKeys = [];
    const lessonIds = [];
    const allLearnerText = [];
    let extensionCount = 0;

    for (
        let sectionIndex = 0;
        sectionIndex < expectedSections.length;
        sectionIndex += 1
    ) {
        const section = course?.sections?.[sectionIndex];
        const expected = expectedSections[sectionIndex];
        const sectionNumber = sectionIndex + 1;
        check(
            section?.key === expected.key,
            `section ${sectionNumber} key must be ${expected.key}`,
        );
        check(
            section?.groupId === expected.groupId,
            `${expected.key} has the wrong stable groupId`,
        );
        check(
            section?.title === expected.title,
            `section ${sectionNumber} title must be ${expected.title}`,
        );
        check(
            section?.rank === expected.rank,
            `${expected.key} rank must be ${expected.rank}`,
        );
        check(
            typeof section?.outcome === "string" &&
                section.outcome.length >= 40,
            `section ${sectionNumber} needs an outcome`,
        );
        check(
            Array.isArray(section?.lessons) && section.lessons.length === 2,
            `section ${sectionNumber} must have two lessons`,
        );

        section?.lessons?.forEach((lesson, lessonIndex) => {
            lessonKeys.push(lesson.key);
            lessonIds.push(lesson.lessonId);
            allLearnerText.push(
                validateLesson(lesson, expected.lessons[lessonIndex]),
            );
        });

        if (section?.technicalExtension) {
            extensionCount += 1;
            allLearnerText.push(
                validateExtension(section.technicalExtension, sectionNumber),
            );
        }
    }

    check(lessonKeys.length === 22, "course must have twenty-two lessons");
    check(new Set(lessonKeys).size === 22, "lesson keys must be unique");
    check(new Set(lessonIds).size === 22, "lesson IDs must be unique");
    check(
        extensionCount >= 4,
        "course needs explicit technical extensions in at least four sections",
    );
    validateConceptDependencies(course);
    validateLessonMedia(course, mediaLock, assetContracts);
    validatePedagogyMutationGate(course);
    validatePracticalLinkMutationGate(course);

    const finalSection = course?.sections?.[course.sections.length - 1];
    const finalLesson =
        finalSection?.lessons?.[finalSection.lessons.length - 1];
    check(
        finalSection?.groupId === "group_ai_for_actual_work_07",
        "the capstone section must remain last",
    );
    check(
        finalLesson?.lessonId === "lesson_ai_for_actual_work_14",
        "lesson 14 and its capstone must remain last",
    );

    const finalLessonNodes = Array.isArray(finalLesson?.content?.content)
        ? finalLesson.content.content
        : [];
    const capstoneHeadingIndex = finalLessonNodes.findIndex(
        (node) =>
            node.type === "heading" &&
            plainText(node).trim() === "Capstone: run your workflow",
    );
    const embeddedArtifactList =
        capstoneHeadingIndex >= 0
            ? finalLessonNodes
                  .slice(capstoneHeadingIndex + 1)
                  .find((node) => node.type === "orderedList")
            : undefined;
    const embeddedCapstoneArtifacts = (embeddedArtifactList?.content ?? []).map(
        (item) =>
            plainText(item)
                .trim()
                .match(/^[a-z0-9-]+\.md\b/)?.[0],
    );
    check(
        JSON.stringify(embeddedCapstoneArtifacts) ===
            JSON.stringify(expectedCapstoneArtifacts),
        "lesson 14 must present exactly the five locked run artefacts in course order",
    );

    const capstone = course?.capstone;
    check(
        capstone?.key === "run-your-ai-assisted-workflow",
        "capstone key is wrong",
    );
    check(
        capstone?.capstoneId === "capstone_ai_for_actual_work_v1",
        "capstone ID must be stable",
    );
    check(
        capstone?.embeddedInLessonKey ===
            "turn-misses-into-system-improvements",
        "capstone must be embedded in lesson 14",
    );
    check(
        typeof capstone?.title === "string" && capstone.title.length >= 8,
        "capstone needs a title",
    );
    check(
        typeof capstone?.outcome === "string" && capstone.outcome.length >= 50,
        "capstone needs an outcome",
    );
    check(
        typeof capstone?.exercise === "string" &&
            capstone.exercise.length >= 120,
        "capstone needs a real-work exercise",
    );
    check(
        JSON.stringify(capstone?.artifacts) ===
            JSON.stringify(expectedCapstoneArtifacts),
        "capstone must collect exactly five locked run artefacts in course order",
    );
    check(
        Array.isArray(capstone?.verification) &&
            capstone.verification.length >= 10,
        "capstone needs at least ten checks",
    );

    const learnerText = [
        collectLearnerMetadata(course),
        ...allLearnerText,
    ].join("\n");
    validateEditorialText(learnerText);
    for (const phrase of [
        "research brief",
        "operational handover",
        "stakeholder update",
        "confidential",
        "approved tool",
        "not enough evidence",
    ]) {
        check(
            learnerText.toLowerCase().includes(phrase),
            `course must teach or demonstrate: ${phrase}`,
        );
    }

    for (const lessonKey of lessonKeys) {
        check(
            sourceMap.includes(`\`${lessonKey}\``),
            `source-map.md is missing ${lessonKey}`,
        );
    }
    for (const url of requiredPrimarySources) {
        check(
            sourceMap.includes(url),
            `source-map.md is missing primary source ${url}`,
        );
    }
    for (const { keys } of expectedLessonMedia) {
        for (const key of keys) {
            const file = mediaLock?.entries?.find((entry) => entry.key === key)
                ?.media?.file;
            const sourceMapLine = sourceMap
                .split("\n")
                .find((line) => line.includes(`\`${key}\``));
            check(
                sourceMapLine,
                `source-map.md is missing sealed media target ${key}`,
            );
            check(
                file && sourceMapLine?.includes(file),
                `source-map.md maps the wrong sealed media URL for ${key}`,
            );
        }
    }
    check(
        sourceMap.includes("Original course example"),
        "source-map.md must label original course examples",
    );
    check(
        editorialNotes.includes("## Claim boundaries"),
        "editorial-notes.md needs claim boundaries",
    );
    check(
        editorialNotes.includes("## Reviewer-skill record"),
        "editorial-notes.md needs the reviewer-skill record",
    );
}

if (errors.length > 0) {
    console.error(
        `Curriculum verification failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`,
    );
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
}

console.log(
    "Curriculum verification passed: 11 sections, 22 lessons, 21 lesson images, 1 capstone, stable IDs, traced sources, practical links, and clean learner copy.",
);
