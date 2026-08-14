# AI Work School visual checkpoint

## Decision

Use CourseLit's existing split hero and TipTap image support. Do not add a new page block. The landing page gets one labelled tool-selection diagram; the other three diagrams appear in the lessons that teach them. This avoids turning the homepage into a four-card explanation of the course.

North star: **The Review Table**. A cross-functional team gathers around a shared worktable in late-afternoon daylight, reading the evidence before deciding what leaves the room.

Voice: assured, practical, human.

Rejected reflexes: cream-paper body styling, generic AI gradients and robots, and an editorial grid of interchangeable feature cards.

## Landing composition

1. Header: brand, CourseLit login/theme controls, `Start the course — free`.
2. Split hero: `Do one real job with AI, and show your working.` Copy and CTA precede the image in mobile DOM order. Lead: `A free course for working professionals. Bring one recurring, low-risk job you already do. Leave with a workflow that you, and anyone who reviews it, can inspect.` Primary: `Start the course — free`. Do not add a secondary anchor until the sticky-header scroll contract exists.
3. Inventory: `Free · Bring one job you already do · No coding`.
4. Choose the shape: `Choose the shape of the job, not the brand of the tool.` Body: `Tools change. The job does not. Decide whether you need a one-off answer, a reusable skill, or a governed connection to approved sources. Then match the mechanism to the risk and repeatability of the work.` Add the tool-selection diagram.
5. What you build: `Five artefacts, one job.` Name written context, source contract, checks, decision record and handover as a definition list. Follow with `illustration-checked-work.webp` and its caption.
6. Curriculum: `From first brief to finished handover.` The curriculum follows one real job from initial context and permission through checks, decisions and handover. Exact section copy and count resolve after the curriculum dependency merges. Use one plain ordered list with a one-line outcome for each resolved section. This is an earned sequence, not numbered decoration.
7. Fit check: the page's only grid, two panels. `This is for you if…` and `This is not for you if…`.
8. Compact course CTA: `Bring one job. Leave with a method. Free.`
9. FAQ: cost, coding, suitable work, company policy, sensitive material and tool independence. Maximum six questions.
10. Footer.

The header keeps no in-page anchor links: CourseLit's sticky header has no scroll-margin contract. The secondary hero action may target the curriculum only after that is fixed or measured safe.

## Raster placement

The normative file, hash, dimensions, semantic target, alt text and caption live in `asset-contracts.json`. It contains five editorial rasters, four labelled diagram rasters and eleven independent promotion targets. Each owning target receives its own MediaLit upload and ID because MediaLit deletion has no global reference count. The SVG diagram sources remain tracked for accessible review and future edits; their deterministic WebP renders are the promotion sources. Hero rendering uses CourseLit's actual 16:9 `Image` wrapper with centred `cover`; the source is wide enough to retain all three people under that crop. No colour correction, text overlay or CSS filter is permitted. Runtime media is blocked until the target's distinct `mediaId` and HTTPS URL are verified.

## Deterministic SVG specifications

All four diagrams use a vertical reading order and one responsive SVG: `viewBox="0 0 360 H"`, `width="100%"`, `max-width: 560px`, straight or right-angle 1.5px connectors, 8px node corners, no shadow, no hand-drawn stroke. Mulish 600 labels render at 14px or larger; Roboto Slab 500 titles render at 18px. Navy structures, teal identifies evidence/passed checks, clay identifies missing input/review/refusal. Oxblood is forbidden. Every connector has an arrow marker. Every node is labelled. Each diagram gets equivalent alt text; the landing diagram also gets a visually hidden ordered list.

### Tool selection

Slot: `assets/diagram-tool-selection.svg`. `viewBox="0 0 360 560"`. Read top to bottom:

1. `What is the job?`
2. Branch: `One-off question` → `Use a chat. Check the answer yourself.`
3. Branch: `Same job, repeated` → `Pack the context, steps, examples and checks as a reusable skill.`
4. Branch: `Needs approved files or systems` → `Connect the source behind a permission gate.`
5. Shared footer: `Higher consequence? Another person checks it before it leaves.`

The branch labels describe the job, never a vendor. Mobile uses the same vertical layout rather than shrinking a wide decision tree.

### Reusable skill package

Slot: `assets/diagram-skill-package.svg`. `viewBox="0 0 360 640"`. Place after the field-kit raster in semantic target `skill-lesson`. Its stable lesson ID is an unresolved curriculum dependency. Read top to bottom:

1. Title: `What goes in the package`
2. `The job, in one sentence`
3. `Written context: audience, constraints, finish condition`
4. `The steps, in order`
5. `Two worked examples`
6. `Checks that can fail`
7. `Source contract: what it may and may not use`
8. Boundary around 2–7: `One reusable skill`
9. Footer: `Open it next week. Same job, same standard.`

The raster shows the human act of packing. The SVG is the packing list.

### Governed MCP connection

Slot: `assets/diagram-mcp-connection.svg`. `viewBox="0 0 360 660"`. Place after the permission-gates raster in semantic target `mcp-lesson`. Its stable lesson ID is an unresolved curriculum dependency. Introduce MCP in prose as a governed connection, then expand the term once. Read top to bottom:

1. Title: `Three gates, three decisions`
2. `You ask for something`
3. `The assistant names the source it needs`
4. `Identity: who is asking?`
5. `Scope: which records?`
6. `Action: read, or change?`
7. `Approved source`
8. `Answer with its source` (teal)
9. `Recorded either way`
10. Clay branch from gates 4–6 to 9: `Refused, and recorded.`

The raster and SVG both contain exactly three gates. Permission, not plumbing, is the lesson.

### Checked-work workflow

Slot: `assets/diagram-checked-workflow.svg`. `viewBox="0 0 360 620"`. Place after the checked-work raster in semantic target `checked-work-lesson`. Its stable lesson ID is an unresolved curriculum dependency. Read top to bottom:

1. Title: `How work leaves the room`
2. `Brief with written context`
3. `Draft`
4. `Check against the sources`
5. `Cite what it rests on`
6. `A person decides: approve or send back`
7. Clay return loop to step 3: `Send back with the reason`
8. `Decision record`
9. `Handover`

The raster caption and SVG keep the same verbs: assemble, check, cite, decide. Teal marks a passed check; clay marks the return path; labels remain present in both states.

The fifth raster, `illustration-editing-argument.webp`, belongs to semantic target `editorial-partnership-lesson`; its stable lesson ID is also an unresolved curriculum dependency.

## Platform finding

No new block is justified. The existing hero already provides the bespoke split composition, and TipTap already renders image nodes. Do not set `hero.titleFontSize` until the default is measured at 375px, 768px and 1440px. If it fails, propose a separate responsive-title change after tracing all manifests that set the override; changing the shared hero affects every tenant and therefore is not part of this checkpoint.

## Verification contract for implementation

Use vertical TDD slices after approval:

1. Asset-contract test fails when a source file/hash/dimension is wrong or a requested runtime placement lacks verified `mediaId` and HTTPS URL; then add the validator.
2. Site verifier test fails unless hero comes before inventory, CTA copy is exact, only one body grid exists, tool-selection diagram has the required alt/list fallback, and action colour does not appear in diagram assets.
3. Course verifier test fails unless image nodes are allowed only with non-empty HTTPS `src`, meaningful `alt`, a semantic target resolved to a stable curriculum lesson ID, and nearby captions.
4. Renderer integration test proves an image node exposes alt text and preserves document reading order.

Tests assert public manifest and rendered behaviour, not helper calls or snapshot churn. Expected labels and paths come from this specification.

## Opus 5 adversarial pass

Opus 5's original verdict was **RED**. It required four corrections: keep oxblood action-only and introduce clay for review; remove speculative responsive hero sizing; forbid unsafe dark section bands; and gate runtime image nodes on verified uploads. All four are incorporated here. Its recommendation to add a cream page wash was rejected because Impeccable names that as a saturated AI default; the page remains true white/cool neutral.

Root's first checkpoint verdict was also **RED**. It found frozen curriculum counts, guessed lesson IDs, shared MediaLit ownership, an unresolved hero anchor, missing fifth-raster accounting and contrast evidence. Those blockers are now removed: copy is count-free; lesson placements are semantic dependencies; five source rasters map to seven distinct promotion uploads; the hero has one action; and verified contrast ratios live in `DESIGN.md`.

Checkpoint verdict: **GREEN for design artifacts only**. Runtime implementation remains pending on curriculum IDs, MediaLit uploads and test-first manifest changes; this does not claim the redesign is deployed.
