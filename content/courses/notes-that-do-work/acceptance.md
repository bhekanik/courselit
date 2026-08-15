# Notes that do work: acceptance contract

## Product promise

This is a free, public course for non-technical professionals. A learner takes one real, low-risk work question and turns scattered notes, reading, meeting records and prior work into a source-backed output another person can use.

The course is tool-agnostic. Obsidian is a worked example because the source material lives there. Plain Markdown files, Apple Notes, OneNote and Notion are valid surfaces. The course teaches a way of working, not a software setup.

## Course shape

- Course ID: `course_notes_that_do_work_v1`
- Slug: `notes-that-do-work`
- Five sections, ten text lessons and one capstone embedded in lesson 10
- Lesson IDs: `lesson_notes_that_do_work_01` through `lesson_notes_that_do_work_10`
- The first lesson is a public preview. Lessons 2 to 10 require free enrolment.
- Existing course, group and lesson IDs are not reused.
- Every lesson is published when the course is published.

The exact section and lesson order is:

1. Capture with a purpose
   1. Find where useful thinking disappears
   2. Turn a capture into a source note
2. Make notes reusable
   1. Give each note one job
   2. Write one idea so it can stand alone
3. Connect as the work demands
   1. Use tags, properties and links for different jobs
   2. Search before creating
4. Think on the page
   1. Write to discover what you think
   2. Build a synthesis note around a live question
5. Ship from the system
   1. Move from notes to an outline and a decision
   2. Close the loop so the next job starts ahead

## Teaching contract

Every lesson teaches one load-bearing decision. It includes these headings in this order:

1. `Outcome`
2. `Before you continue`
3. `See it`
4. `Try it with guidance`
5. `What you will make`
6. `Try it on your work`
7. `Teach it back`
8. `Try a changed case`
9. `Check your work`
10. `If you get stuck`

Each lesson must:

- ask the learner to write a prediction or expose a prior model before the explanation;
- show a concrete professional case;
- guide one consequential decision and include an explicit stop-and-record point;
- produce one named artefact from the learner's real work;
- include at least four checks that could expose a plausible mistake;
- ask for a teach-back without the lesson open;
- change the case so the learner cannot repeat the example mechanically;
- finish with exactly three graduated hints;
- declare one `teaches` capability and the capabilities it `requires`;
- trace its claims to named vault notes or current official product documentation;
- be at least 2,500 learner-facing characters after captions are removed.

Static CourseLit content cannot hide an answer, wait for a learner response or keep learner state inside a lesson. The honest adaptation is an explicit instruction to write before scrolling, followed by visible guidance.

## Practical cases

The worked cases cover at least:

- an accountant turning month-end notes into an exception brief;
- a lawyer turning matter notes and sources into a handover or advice outline;
- an operations lead turning incident and meeting records into a decision note;
- an analyst turning reading and observations into a recommendation.

No case implies that a note system replaces professional judgement, source checking, records policy, confidentiality rules or review.

## Capstone

The learner chooses one real question they already need to answer and produces exactly four final files:

1. `source-pack.md`
2. `concept-map.md`
3. `working-brief.md`
4. `handover.md`

Lesson artefacts are working records. The four capstone files consolidate or reference them. They must show what happened on a fresh run, not what the learner planned to do.

## Visual contract

- One bespoke featured image shows raw notes becoming useful work.
- At least eight labelled teaching diagrams are placed beside the decision they teach.
- Diagrams use the existing AI Work School brand palette and deterministic render pipeline.
- Diagram labels remain at least 12 CSS pixels at a 320-pixel viewport with lesson padding.
- Every lesson image has exact alt text, a visible caption immediately after it and a distinct MediaLit owner ID.
- Decorative imagery does not count towards the diagram minimum.

## Copy and evidence constraints

- British English.
- No em dash, en dash, curly quote or invisible formatting mark.
- No fixed productivity, recall, retention, accuracy or compound-return claim.
- No claim that a particular app is required.
- No invented research citation.
- Secondary notes and Readwise imports are labelled as leads, not primary evidence.
- Product links point to current official documentation and bind the visible label to the exact URL.
- Tool observations that can change are dated in the source map.
- The copy does not use a `second brain` promise or tell learners to organise everything before doing real work.

## Production contract

- A new timestamped, idempotent migration creates the course, lessons and an external `internal:false` free plan.
- Existing course migrations and frozen snapshots remain byte-immutable.
- The migration accepts exactly `--dry-run` or `--apply` and requires `TARGET_DOMAIN=main`.
- Dry-run performs zero writes.
- Apply stages the course unpublished, verifies all lessons and the plan, publishes lessons, then publishes the course.
- Any landing-page change is last.
- Owner, legal-page, stable-ID and owner-edit conflicts fail before writes.
- Existing courses, learner progress, purchases, plans, users and unowned site fields are preserved.
- A second apply is a byte-stable no-op.
