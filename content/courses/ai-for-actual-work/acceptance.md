# Acceptance checks

Status: expansion contract locked before curriculum changes

## Course contract

- `course.json` parses as JSON and has schema version `1`.
- The course title is `AI for actual work` and its slug is `ai-for-actual-work`.
- Existing stable identifiers remain unchanged: `course_ai_for_actual_work_v1`, `group_ai_for_actual_work_01` through `group_ai_for_actual_work_07`, and `lesson_ai_for_actual_work_01` through `lesson_ai_for_actual_work_14`.
- New stable identifiers are `group_ai_for_actual_work_08` through `group_ai_for_actual_work_11` and `lesson_ai_for_actual_work_15` through `lesson_ai_for_actual_work_22`.
- The course is free and public in its intended published state.
- There are eleven ordered sections, two core lessons per section, twenty-two core lessons in total, and one capstone embedded in lesson 14.
- Groups 01 through 06 remain first. Groups 08 through 11 follow. Group 07 remains last at rank 11000 so lesson 14 and its capstone are still the final lesson without renumbering any stable identifier.
- Each section can carry one clearly optional technical extension. Extensions do not count as core lessons and cannot be prerequisites for later sections.

## Lesson contract

Every lesson has:

- a deterministic key and lesson ID;
- a title and concise outcome;
- a complete TipTap/ProseMirror `doc` using nodes supported by CourseLit's current text editor;
- at least 2,500 characters of practical learner-facing text;
- the headings `Try it on your work`, `What you will make`, and `Check your work`;
- a real-work exercise;
- one named learner artefact;
- four or more concrete checks;
- exact source-note filenames outside the learner-facing document.

The first lesson is available as a preview. The remaining lessons require free enrolment.

## Media contract

- `course.featuredImage` is the complete sealed `course-featured-image` Media object from `content/site/ai-work-school/media.json`.
- Lesson 17 contains `skill-lesson` followed by `skill-package-lesson` at the reviewed anchor after "Choose the degree of freedom".
- Lesson 18 contains `mcp-lesson` followed by `mcp-connection-lesson` after the dated introductory paragraph.
- Lesson 20 contains `editorial-partnership-lesson` between "Rebuild the map after revision" and "Repair AI writing without fabricating humanity".
- Lesson 21 contains `checked-work-lesson` followed by `checked-workflow-lesson` before "Document lane".
- Every lesson image uses the exact sealed HTTPS `file` URL, the reviewed alt text from `asset-contracts.json`, and a non-empty title. Its next node is a visible paragraph whose text matches the sealed media caption exactly.
- The course contains exactly these seven lesson images. No image substitutes for lesson prose, an exercise, an artefact, or a check.
- Stable course, group, lesson and capstone identifiers do not change when media is added. The capstone submission remains the same five files.

## Expansion contract

- `separate-chat-from-delegated-work` distinguishes a quick conversational surface from delegated multi-step work using job scope, inputs, authority, progress and finish conditions.
- `map-current-work-surfaces` gives a dated field map for ChatGPT Work versus Codex, Claude Cowork, Microsoft 365 Copilot and Copilot Cowork. Every current product fact is labelled `As of 14 August 2026`, cites a primary official URL in `source-map.md`, and makes no ranking or performance claim.
- `write-and-test-a-skill` defines a skill as reusable workflow instructions plus only the references, scripts or assets the job needs. The learner writes a skill brief and tests it with blind evaluation prompts, including an ambiguous and an out-of-scope case.
- `separate-skills-from-mcp-connections` teaches that a skill tells the AI how to do repeated work while Model Context Protocol connects an AI application to external tools and data. The learner chooses instruction, connection or both and records permission and failure boundaries.
- `research-before-you-draft` separates observed, inferred, disproved and unknown claims, checks primary sources, maps the argument and records the strongest counterargument before drafting.
- `edit-the-argument-and-repair-the-prose` teaches the editorial partnership from `edit-bk-essays` before the writing repair from `humanizer`. It preserves supported claims and voice, removes assistant residue, and rejects invented specificity.
- `build-and-check-work-artifacts` applies separate content and rendered-output checks to a document, spreadsheet and meeting brief. It includes a clearly illustrative accountant exercise.
- `act-only-with-explicit-authority` uses inspect, propose, approve, act and verify for externally visible changes. It includes clearly illustrative lawyer and operations exercises and produces an action ledger.
- Every new lesson produces one concrete Markdown artefact and at least four requirement-derived checks.
- The capstone remains one fresh real task. Its submission is exactly five files: `working-brief.md`, `source-contract.md`, `checks-and-evidence.md`, `decision-record.md`, and `handover.md`.
- The five capstone files consolidate or reference the twenty-two lesson artefacts, which remain setup and working records rather than separate capstone submissions. Each final file contains evidence from the fresh run.
- Capstone checks cover work-surface choice, skill or MCP boundaries, professional-file QA and action authority.

## Teaching contract

- The core path assumes no coding, API access, admin rights, team, automation budget, or permission to mutate external systems.
- Engineering material sits only in explicit optional technical extensions.
- The learner brings one recurring, low-risk job and carries it through all twenty-two lessons.
- The course includes worked, clearly illustrative non-coding cases for a research brief, an operational handover, and a stakeholder update.
- Before using real work data, the learner checks organisational policy and tool approval. If the boundary is unclear, they use redacted or invented material and ask the appropriate owner.
- Checks come from requirements and must fail on a plausible wrong result.
- Consequential claims keep provenance separate from support and include an honest insufficient-evidence path.
- A claim of "done" needs review and delivery evidence.
- Setup improvement has a stop rule. A production task does not become an open-ended model experiment.
- Product access, permissions and features are checked against the learner's actual account and organisation rather than inferred from the dated field map.
- A skill is forward-tested on fresh examples. An MCP connection is treated as an access and action boundary, not as another instruction file.
- Documents, spreadsheets and meeting briefs have separate source, content and rendered-output checks.
- External sending, posting, deletion, purchasing, filing, ledger mutation and record updates require explicit authority and post-action evidence.

## Editorial contract

- British spelling.
- No fake metrics, testimonials, fixed time savings, career guarantees, or universal productivity claims.
- No current vendor ranking or durable claim about one model or tool being better.
- No private vault path, internal URL, employer name, project name, or unpublished workplace detail in learner-facing text.
- No em or en dashes, curly quotation marks, invisible Unicode marks, marketing copy, or generic AI-written conclusions.
- Source mapping records what each note supports and names original course examples as original rather than source-derived.
- `source-map.md` records primary official product and MCP URLs plus review dates. Learner-facing prose does not contain raw URLs.
- Course media uses only sealed HTTPS URLs from `media.json`. No local or temporary image URL enters the manifest, and lesson prose remains complete without an image.

## Verification

Run:

```sh
node content/courses/ai-for-actual-work/verify.mjs
```

The command validates observable manifest behaviour: explicit stable identifiers, counts, ordering, lesson completeness, TipTap shape, sealed media, accessible image attributes and captions, dated product coverage, source traceability, professional exercises, banned claims, privacy coverage, capstone integration, and the non-coding core boundary.

## Reviewer-skill applicability

- TDD: expansion checks are changed and run red against the original fourteen-lesson manifest before any expansion content is added, then rerun after each content slice.
- Test-quality rubric: the verifier uses exact requirement-derived values, invalid/missing-input paths, and checks that fail when content is deleted or weakened.
- TypeScript reviewer: this phase changes JSON, Markdown, and a standalone JavaScript verifier only. The TypeScript pass is a negative scope check that no TypeScript contract or package configuration entered the diff.
- Simplify: applies to the final owned diff only. It may remove duplication or unclear metadata without changing the course contract.
