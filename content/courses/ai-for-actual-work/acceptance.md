# Acceptance checks

Status: locked before curriculum generation

## Course contract

- `course.json` parses as JSON and has schema version `1`.
- The course title is `AI for actual work` and its slug is `ai-for-actual-work`.
- The stable identifiers are `course_ai_for_actual_work_v1`, `group_ai_for_actual_work_01` through `group_ai_for_actual_work_07`, and `lesson_ai_for_actual_work_01` through `lesson_ai_for_actual_work_14`.
- The course is free and public in its intended published state.
- There are seven ordered sections, two core lessons per section, fourteen core lessons in total, and one capstone embedded in lesson 14.
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

## Teaching contract

- The core path assumes no coding, API access, admin rights, team, automation budget, or permission to mutate external systems.
- Engineering material sits only in explicit optional technical extensions.
- The learner brings one recurring, low-risk job and carries it through all fourteen lessons.
- The course includes worked, clearly illustrative non-coding cases for a research brief, an operational handover, and a stakeholder update.
- Before using real work data, the learner checks organisational policy and tool approval. If the boundary is unclear, they use redacted or invented material and ask the appropriate owner.
- Checks come from requirements and must fail on a plausible wrong result.
- Consequential claims keep provenance separate from support and include an honest insufficient-evidence path.
- A claim of "done" needs review and delivery evidence.
- Setup improvement has a stop rule. A production task does not become an open-ended model experiment.

## Editorial contract

- British spelling.
- No fake metrics, testimonials, fixed time savings, career guarantees, or universal productivity claims.
- No current vendor ranking or durable claim about one model or tool being better.
- No private vault path, internal URL, employer name, project name, or unpublished workplace detail in learner-facing text.
- No em or en dashes, curly quotation marks, invisible Unicode marks, marketing copy, or generic AI-written conclusions.
- Source mapping records what each note supports and names original course examples as original rather than source-derived.

## Verification

Run:

```sh
node content/courses/ai-for-actual-work/verify.mjs
```

The command validates observable manifest behaviour: identifiers, counts, lesson completeness, TipTap shape, source traceability, banned claims, privacy coverage, and the non-coding core boundary.

## Reviewer-skill applicability

- TDD: acceptance checks are defined and run red before `course.json` exists, then rerun after each content slice.
- Test-quality rubric: the verifier uses exact requirement-derived values, invalid/missing-input paths, and checks that fail when content is deleted or weakened.
- TypeScript reviewer: not applicable to implementation because this phase changes JSON, Markdown, and a standalone JavaScript verifier only. It remains applicable to checking that no TypeScript contract or package configuration entered the diff.
- Simplify: applies to the final owned diff only. It may remove duplication or unclear metadata without changing the course contract.
