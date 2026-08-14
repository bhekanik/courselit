# AI Work School homepage rationale

## Product direction

The page has one job: help a working professional decide whether this free course fits a real piece of work, then take them to it. The design is practical, exacting and generous. It explains what to bring, what the learner will build and how the work will be checked. It does not try to look intelligent through decoration.

The opening promise is deliberately concrete: do one real job and show the working. The page names one course and one CourseLit route. It has no fake catalogue, borrowed proof, speed claim or tool ranking. Course counts were removed because they add little to the decision and drift as the curriculum changes.

## Visual system

The page follows the `DESIGN.md` Review Table direction. True white and cool neutral surfaces keep the editorial images distinct. Navy carries structure. Oxblood is reserved for actions. Teal marks evidence and checks. Clay marks review. Light sections never become navy bands because the block renderer cannot safely switch all foreground tokens per section.

Roboto Slab gives headings the plain authority of a training manual. Mulish keeps instructions and controls readable at small sizes. Corners stay modest. Images use the existing 16:9 CourseLit renderer with a small radius, no border and no shadow. The design uses no gradients, chatbot imagery, new block or custom CSS.

## Composition

The sticky shared header keeps login and theme controls plus one course action. The split hero uses `mobileMediaPlacement: after-content`; with the verified hero implementation, `alignment: right` keeps text on the left at desktop widths while preserving content-first DOM order on mobile. The hero uses its target-specific sealed MediaLit object rather than a shared upload.

The short inventory earns the managed marker's visible place without freezing curriculum counts. The next section asks learners to choose the job's shape before a tool. A vertical diagram carries the visual explanation; the adjacent ordered list supplies the same decision path in text.

The artefact section matches the capstone contract: `working-brief.md`, `source-contract.md`, `checks-and-evidence.md`, `decision-record.md` and `handover.md`. These consolidate the lesson records into five files a colleague can review. The checked-work image shows colleagues assembling and checking that evidence. The curriculum then follows the real course sequence in one ordered list. Order matters here, so numbering is structural rather than decorative.

The fit/not-fit comparison is the only grid. This is the one place where equal side-by-side panels make the decision easier. The closing hero is short and has no coloured band. Six FAQs answer the practical objections most likely to block enrolment.

## Accessibility and responsive behaviour

Every sealed image carries the reviewed MediaLit caption as alternative text. The tool-selection image is not the sole explanation; its ordered text equivalent precedes it. Course text precedes hero media in the mobile DOM. No text sits on images.

Light and dark theme pairs are checked for WCAG 2.2 AA contrast. Rules, inputs and focus rings are checked at 3:1 against their surfaces. The manifest uses responsive CourseLit blocks and supported width/spacing tokens, with no fixed horizontal dimensions. It introduces no motion, autoplay or hover-only information.

## Apply contract

The aggregate migration owns publication, not this manifest. It resolves the current domain and owner, creates or resumes the course stage, and verifies the exact course ID, slug, published state and external free plan before it exposes a CTA. It then upserts `theme_ai_work_school_v1`, applies the complete style to published and draft theme fields, and publishes shared widgets and homepage last.

`Domain.sharedWidgets` and `Domain.draftSharedWidgets` are name-keyed objects at persistence. The migration converts the manifest array to an object keyed by `header` and `footer`; each value keeps its stable widget ID. Homepage preflight accepts only the exact launch baseline or the exact v2 desired managed homepage. `widget_ai_work_school_managed_v1` proves ownership but cannot admit a third state on its own. Preflight also requires the existing `privacy` and `terms` pages. Re-running updates the same records and IDs.

## Bounded Opus pass

The requested direct-profile Opus 5 design pass returned no output within the five-minute bound and was stopped. Implementation continued from the already-reviewed `PRODUCT.md`, `DESIGN.md`, `visual-direction.md`, asset contract, media manifest and live CourseLit block schemas. No model suggestion was silently substituted for those frozen inputs.
