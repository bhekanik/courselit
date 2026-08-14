# AI Work School landing page acceptance

This package is the single source-controlled input for applying the AI Work School theme and homepage to one CourseLit domain. It must not change a database by itself.

## Data contract

- `site.json` contains one complete manifest: a managed-site marker, domain scope, the published course reference, required legal pages, a complete light/dark `UserTheme`, shared header/footer widgets, and the homepage metadata and layout.
- Stable identifiers are explicit. The homepage layout contains the dedicated widget named by `managedMarker`; later migration preflight accepts only the untouched CourseLit default or a page containing that marker. Re-running the migration must update the same theme, widgets, and page rather than create copies.
- The owner and domain-specific identifiers are symbolic sources for the migration to resolve. No production IDs or private data are stored here.
- The later migration must fail its preflight if the required `privacy` and `terms` pages do not exist. It does not create or replace their content.
- The theme style is copied to both `theme` and `draftTheme`; shared widgets are copied to both published and draft fields; the page layout and metadata are copied to both published and draft fields.
- The course CTA is `/course/ai-for-actual-work/course_ai_for_actual_work_v1`, the route used by CourseLit for a real course.

## Design

- The page feels like a practical workbench for professionals: precise, calm, and generous with explanation.
- The colour system uses cranberry as the decisive action colour and teal as a checking/accent colour. It has no purple AI gradient, chatbot image, or generic AI imagery.
- Headings use Roboto Slab and body copy uses Mulish, both fonts already registered by CourseLit.
- The page presents one free course. It contains no fake catalogue, metrics, testimonials, time-saving claims, or comparisons that will age.
- The visual hierarchy is clear without custom React, custom CSS, or uploaded media. It uses only registered, site-compatible CourseLit blocks.

## Accessibility and responsive behaviour

- Text and controls meet WCAG 2.2 AA contrast in both themes; focus rings meet the 3:1 non-text contrast target.
- Author-controlled rich text uses an ordered heading level. Links and buttons have descriptive text. Questions and answers use semantic FAQ markup supplied by the registered block. CourseLit owns the heading element used by each registered section block.
- The layout uses CourseLit's responsive block implementations, supported width/spacing tokens, and no horizontal fixed dimensions.
- The page has no marquee, auto-play media, custom animation, parallax, hover-only information, or motion required to understand content. Reduced-motion users therefore lose nothing.

## Content

- The opening names a real learner action and the course's concrete result. Named examples show what a suitable task looks like.
- The outline is an earned sequence, not a row of interchangeable feature cards.
- Learner artefacts and verification practices are stated plainly.
- British spelling is used. Copy avoids hype, vague claims, canned transitions, and internal/private details.

## Verification

Run:

```sh
node content/site/ai-work-school/verify.mjs
jq empty content/site/ai-work-school/site.json
```

The verifier checks the schema subset needed by the later migration, stable IDs, block compatibility, course route, theme completeness, contrast, motion exclusions, TipTap document structure, and risky copy patterns.
