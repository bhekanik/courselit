# Editorial notes

Decisions, boundaries and maintenance triggers for the course manifest. Written for the reviewer and for whoever changes this next.

## Audience and mode

The primary learner is a working professional who has tried an AI chat tool and still uses it one question at a time. They may work in operations, product, research, analysis, marketing, law, finance or software.

The core path is a technical tutorial in the practical sense rather than the software sense. It assumes no coding, no API access, no admin rights, no team, no automation budget and no permission to mutate external systems. Every core lesson is written as a task the learner performs on one recurring job they already do, and each ends with something usable: an exercise, a named artefact and checks that can fail.

Technical practitioners follow the same core. Engineering material sits only in the optional extensions, which are marked optional, are not prerequisites for the next section and carry the audience value `technical practitioners`.

## Stable identifiers and slug contract

These are contract, not preference. Changing any of them breaks existing enrolments, progress and links.

- Course key and slug: `ai-for-actual-work`. Course ID: `course_ai_for_actual_work_v1`.
- Existing section group IDs `group_ai_for_actual_work_01` through `group_ai_for_actual_work_07` and lesson IDs `lesson_ai_for_actual_work_01` through `lesson_ai_for_actual_work_14` remain unchanged.
- Added section group IDs are `group_ai_for_actual_work_08` through `group_ai_for_actual_work_11`. Added lesson IDs are `lesson_ai_for_actual_work_15` through `lesson_ai_for_actual_work_22`.
- Display order is groups 01 through 06, groups 08 through 11, then group 07. The new groups use ranks 7000 through 10000 and group 07 moves to rank 11000. This keeps lesson 14 and its embedded capstone last without renumbering existing IDs.
- Capstone ID: `capstone_ai_for_actual_work_v1`.
- Lesson 1 is the preview and is the only lesson with enrolment not required. Every other lesson requires free enrolment.

Lesson titles and prose may be edited. Keys and IDs may not, and the verifier enforces both.

## How the capstone is embedded

The capstone exists twice on purpose and the two copies do different jobs.

The manifest carries top-level `course.capstone` metadata holding the key, the stable ID, the title, the outcome, the exercise, the five final run artefacts and the eleven assessment checks. That is the machine-readable record and the thing an assessment surface should read.

The learner sees twenty-two lessons. Lesson 14 remains the final lesson in display order even though the added lessons use IDs 15 through 22. The run instructions, five submission artefacts and eleven assessment checks are written into lesson 14 under a heading named exactly `Capstone: run your workflow`. The `embeddedInLessonKey` field points at `turn-misses-into-system-improvements` to record that placement.

The twenty-two lesson artefacts remain setup and working records. The five capstone files consolidate or reference them and hold the evidence produced during one fresh run. This keeps the teaching trail without asking the learner to pretend that every setup record was created during the capstone.

If the capstone metadata changes, the lesson 14 heading section has to change with it. They are not generated from one another.

## Original material decisions

The original source notes are engineering-heavy and support the mechanism, evidence, delivery and understanding arguments well. The public research and skill-library evidence add dated product terminology, editorial methods, professional-file checks and safe action controls. They still do not contain measured non-coding cases or a validated assessment rubric.

Rather than translate software examples by changing nouns, those gaps were filled with original illustrative material. Every original case is labelled as invented in the learner text and listed under `Original course examples` in the source map. None of them is presented as a measured result or as a description of a real organisation.

## Privacy boundary

No vault path, file location, employer name, client name, project name, internal URL, ticket reference or unpublished workplace detail appears in learner-facing content. Source provenance lives in `sourceNotes` fields and in the source map as bare filenames.

The verifier fails the build on private paths and learner-facing URLs. Dated factual vendor names are allowed in lesson 16 because the product distinction is the subject; ranking and performance language remains banned.

On the learner's side, lesson 1 requires a written permission check before any real data reaches a model, covering tool approval, data classification and retention, with redact-or-invent routes when the answer is unclear. Lesson 2 onwards keeps that position, and the capstone tells the learner to run on redacted or invented input if that is where the permission check landed.

## Claim boundaries

What this course is allowed to claim, and what it is not.

- No fixed time saving, productivity gain, percentage or measured improvement of any kind. The verifier rejects percentages and fixed time-saving phrasing.
- No career advantage, job-security claim or twelve-month window. The claim about a twelve-month advantage in one source note is unsupported by the evidence and is excluded.
- No current vendor ranking and no durable claim that one model or tool is better. Lesson 2 teaches observed behaviour on one job on one day and requires the learner to date their conclusions.
- Lesson 16 may state current product names and documented roles only with the label `As of 14 August 2026` and primary official sources in the source map. Documented capability is never treated as performance evidence.
- Lesson 18 may describe current MCP support only as a dated observation. It teaches the protocol boundary rather than setup or universal client support.
- No stable taxonomy of model philosophies or vendor-specific failure modes.
- No testimonial, no case study presented as real, no invented figure.
- A citation proves provenance and not support. The course states this in the learner text rather than leaving it implied.
- A decision trace proves that recorded facts propagated through a specific rule. It does not prove the rule was good or that any fact was interpreted correctly. The learner text says so.
- Deterministic-first design is taught as a design rule with trade-offs, not as a guarantee of lower cost or better performance.
- Not every interrupt is a context failure. Ambiguous requests, missing access or authority, and current model limits are kept as alternative causes.
- The repayment shape in lesson 13 is one practitioner's rule on their own projects. It is not a ratio, a formula or a promise.
- The two-rewards material is an observation about a mix that shifted. It is explicitly not a personality test and does not sort people into types.
- Landing-page copy may promise a real workflow run and inspectable output. It may not promise a fixed saving, a career advantage or an accuracy gain.
- Landing-page copy stays count-free. Lesson and artefact counts are implementation details that will change faster than the course promise.

## Unsupported and excluded claims

Excluded from learner text and from any future marketing built on this manifest:

- The twelve-month advantage claim.
- Internal company outcome figures from the scenario note.
- Internal names, URLs, project details and unpublished workplace material.
- Universal ratios or productivity percentages drawn from one practitioner's projects.
- A permanent verdict that scripts beat declared tool schemas. The extension teaches the context-budget measurement and requires a dated conclusion.
- The compound-interest rate figures quoted in the accretion literature note.
- The whole of the editor rules file as a model ruleset. Only its durable principles are used.
- Vendor launch comparisons, adoption figures, cost percentages and internal benchmarks.
- A claim that a skill grants data access or that an MCP connection grants authority to act.

## Review dates for tool observations

Anything that describes how current tools behave dates quickly. Set against a drafting date of 14 August 2026:

- Lesson 2 and the section 1 technical extension: review by 14 February 2027. Both make claims about how setups behave and how tool surfaces consume context.
- Lessons 16 and 18: review by 14 February 2027. Re-open every linked primary source, verify current product names, availability and MCP terminology, then rerun the account-level observation. Do not merely reread the lesson.
- The section 5 extension's description of validator and shadow-rollout practice: review by 14 August 2027.
- Any future lesson on cost, plan entitlements or integration setup must be written from live verification and carry its own review date. The current course makes no cost claim and teaches no setup command.

Reviewing means rerunning the observation, not rereading the prose.

## Assessment caveat

The five final artefacts and the eleven assessment checks are a starting rubric, not a validated one. They have not been piloted against real submissions.

Before the assessment is used to pass or fail anybody, pilot it against deliberately weak submissions and confirm that plausible-looking but unsupported work actually fails. The known risk is that a learner completes the lesson records and prepares five tidy final files without running the workflow. The rubric is meant to catch that failure and has not yet been proven to do so.

## Maintenance triggers

- Lesson keys, lesson IDs, group IDs, ranks or the capstone ID change: rerun the verifier and check every enrolment and progress surface that stores them.
- A source note is renamed in the vault: update the matching `sourceNotes` list, the locked map in the verifier and the source map together. The verifier compares source lists exactly, including the typographic apostrophe in one filename.
- Capstone metadata changes: update the `Capstone: run your workflow` section in lesson 14 in the same change.
- A review date above passes: rerun the observation and either refresh the lesson or record that it still holds, with a new date.
- A new banned claim is discovered: add it to the verifier's pattern list first, then fix the content, so the check fails before the repair.
- Any new original illustrative case is added: label it as invented in the learner text and add it to `Original course examples`.
- A product or MCP review date passes: update the primary-source entry, learner-facing date label and dated product map together.
- A reviewed curriculum image receives its final CDN URL: insert it only at the exact asset-role position in `source-map.md`, add reviewed alt text and caption, then verify lesson rendering. Do not replace the role note with a local or temporary URL.

## Reviewer-skill record

What was applied, and how honestly.

- Humanizer: applied by hand against the pattern list while drafting rather than as an automated pass. Em and en dashes, curly quotation marks, rule-of-three padding, promotional language, stock vocabulary, signposting, inline-header lists and generic upbeat conclusions were all checked. The verifier independently enforces the dash, quote, vocabulary and signposting rules.
- BK essay-edit skill: applicable only as a light voice pass. Its own routing table puts technical and instructional writing at light voice weight, and it directs operational instructional material to the docs skill. So its conventions were followed for sentence-case headings, spaced punctuation instead of dashes, rare bold, claim-scope discipline and no invented anecdote, but the full essay process of idea maps, thesis stress tests, hooks and cold reads was not run. These are lessons, not essays.
- Writing-docs: applied to lesson shape. Second person, imperative voice, the reader's next action named early, and every major section ending in something usable. Mutating work is documented in the safe order, with simulated or copied targets before anything live.
- TDD: the expansion contract was written first and failed against the fourteen-lesson manifest with 54 errors. Sections were added as vertical slices and the verifier rerun after each. The manifest became structurally green before source mapping; the final 17 failures were all traceability and image-role requirements, then the source map made the same verifier green.
- Test-quality rubric: the verifier uses requirement-derived exact values rather than values copied from the manifest, covers missing and invalid input paths, and fails when required structure is deleted. Deleting a required heading, shortening a lesson below the character floor, replacing a capstone artefact with prose or reordering a source list all produce a failure. Verification strings have a length floor, not a semantic-strength check, so reviewer judgement still matters there.
- TypeScript reviewer: no TypeScript file, type declaration, package manifest or build configuration entered the diff. The standalone verifier consumes untrusted JSON through runtime checks rather than a cast, so the negative scope and boundary check passes.
- Simplify: applied to the owned diff only, to remove duplication and unclear metadata without changing the course contract. No identifier, count, heading requirement or source list was simplified away.
- Remove-ai-marks: Layer A inspection was run over all five owned files after the final prose pass. It found no zero-width characters, bidi Unicode, suspicious format marks, space homoglyphs or confusables, so there was nothing to rewrite. Layer B was not run because the humanizer and editorial passes already reviewed the wording, and another statistical rewrite would discard deliberate phrasing and source boundaries.

## Handoff notes

### Learnings

- The strongest transferable teaching move is requirement-derived expectation. It survives the move out of software without changing the principle, and it carries the whole of section 4.
- The recurring spine across notes written for different projects is context, mechanism choice, evidence, guardrails, delivery state and deliberate understanding. The added sections make the missing middle explicit: choose the surface, package the method, research and edit, produce the professional artefact, then act within authority.
- The useful tension is already in the source material: raise ambition but timebox the miss, automate fully but keep ownership and learning. Both halves have to survive editing or the course becomes either timid or reckless.
- Notes carrying evidence tables and changed-my-mind sections make better teaching sources, because they expose the correction rather than presenting a finished rule.
- Formal terms such as ledger, trace and substrate can alienate a non-technical reader. Every lesson teaches the judgement first and names the artefact second.
- Product categories converge around quick conversation and delegated work, but identical words do not identify the same product. Claude Cowork and Copilot Cowork require explicit names every time.
- Skill and MCP are easiest to teach as two different questions: how should the work be done, and what external data or action does the application need.

### Assumptions disproved

- The talk abstract is an abstract, not curriculum. It sets framing and supplies almost no teaching content.
- The workflow note is two bullets and a broken reference, so it can only serve as a contrast.
- The accretion note is a literature note rather than original argument, which changes how it must be attributed.
- The named note set is overwhelmingly technical. A course for all professionals needed original non-coding cases, not translated ones.
- The editor rules file is not a clean template. It mixes durable principles, dated advice and stack-specific rules.
- An intermediate slice cannot pass the verifier. The suite is all-or-nothing on structure, which is fine but should be expected rather than treated as a regression.
- Microsoft Copilot Cowork was not still a research preview. Microsoft announced worldwide general availability on 16 June 2026.
- A general MCP source was not present in the selected local skills. The lesson needed the official protocol introduction, architecture and tool specification before the gap could be filled safely.

### Failed attempts

- A first attempt to deliver the whole manifest in a single patch exceeded the transport limit and was truncated. Splitting the work into a metadata-plus-lesson-1 patch and then one patch per section worked, and each later patch anchored on the last paragraph of the preceding section.
- A broad listing of the vault produced too much noise. Resolving exact filenames first, then reading only those, was faster and preserved provenance.
- Drafting without read access outside the working directory was refused rather than attempted, because attaching source filenames to content never derived from those notes would have fabricated provenance in a course whose whole editorial contract is traceability.
- The first Claude Opus 5 repository-wide pass used an incomplete provider reset and stayed idle with no edits. A corrected provider and permission pass also stayed idle. A smaller no-tools drafting request produced no response inside its three-minute cap. All three were stopped with a clean or unchanged worktree, and the curriculum was completed supervisor-side from the read evidence.

### Risks

- The evidence base is largely one practitioner's projects and one workplace. The positions are taught with their reasoning and trade-offs rather than as settled industry practice, and that framing has to survive future edits.
- Several sources are internal, draft or unpublished. Their patterns are used; their details are not, and any future edit must hold that line.
- The five capstone files can still become paperwork. Each one must contain evidence from the fresh run, and that tie is the thing most likely to erode.
- Tool-specific claims will date faster than the rest of the course. The review dates above are the only defence and they need somebody to own them.
- The four image roles have semantic targets and captions but no final CDN URLs. The course is complete without them; adding them later still needs alt-text and production-render review.
- The course can over-teach ambition if the miss filter is ever separated from the raise-your-aspirations framing. They are deliberately taught together.
- The assessment rubric is unpiloted. Treat any pass or fail decision made with it as provisional until the weak-submission pilot has run.
