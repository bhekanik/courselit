# AI Work School homepage acceptance

This directory is the source-controlled input for the AI Work School theme and homepage. It does not mutate a database or deploy by itself.

## Data and publication contract

- `site.json` contains one complete domain-scoped manifest: managed marker, course reference, legal-page dependencies, light/dark theme, shared header/footer widgets and published homepage layout.
- Stable IDs are retained for the theme, homepage, managed marker, shared widgets, legal links and course route. Re-applying the later migration must update those records, not create copies.
- The aggregate migration creates or resumes the course first. Before it publishes the homepage, it verifies that `course_ai_for_actual_work_v1` exists at slug `ai-for-actual-work`, is published and has an attached external free plan with `internal: false`.
- Homepage preflight accepts only the exact launch baseline or the exact v2 desired managed homepage. `widget_ai_work_school_managed_v1` identifies ownership but is not enough to pass preflight; a third or owner-edited state fails closed.
- The `privacy` and `terms` pages must already exist. The migration links to them but does not replace their content.
- Theme style is copied to `theme` and `draftTheme`. Shared widgets are copied to published and draft objects keyed by widget name. Page metadata and layout are copied to their draft counterparts.

## Homepage

- The header and both course heroes use the exact CTA `Start the course — free` and the real route `/course/ai-for-actual-work/course_ai_for_actual_work_v1`.
- The split hero comes first. Its copy precedes its sealed `landing-hero` media in mobile reading order.
- The inventory is count-free: `Free · Bring one job you already do · No coding`.
- The tool-choice section includes the sealed vertical diagram and an equivalent ordered text list for people who cannot read the image.
- The page names the capstone's five final files: working brief, source contract, checks and evidence, decision record and handover. The sealed checked-work image follows them.
- Curriculum is one ordered sequence using the published course's section names and outcomes. It does not advertise section or lesson counts.
- The fit/not-fit comparison is the page's only grid. The closing CTA is compact. The FAQ has six questions covering cost, coding, suitable work, company policy, sensitive material and tool independence.
- Header/footer shared-widget IDs and legal links remain unchanged.

## Design and accessibility

- The page uses only registered CourseLit `hero`, `rich-text`, `media`, `grid`, `faq`, `header` and `footer` blocks. No app code, new block or custom CSS is required.
- All landing sections remain light. No block supplies a background colour band.
- The palette follows `DESIGN.md`: navy structure, oxblood action, teal evidence and clay review. There are no gradients, purple AI styling, chatbot or robot imagery.
- Roboto Slab headings and Mulish body copy use fonts already registered by CourseLit.
- Sealed MediaLit objects are public WebP media on `media.bhekani.com`, have stable query-free URLs and meaningful alternative text.
- Theme pairs meet WCAG 2.2 AA contrast in both modes. Focus rings and rules meet the 3:1 non-text contrast target.
- The manifest adds no autoplay, parallax, marquee, custom animation or hover-only information. Reduced-motion users lose no content.
- Copy uses British spelling and contains no fake catalogue, metrics, testimonials, fixed time-saving claims, tool rankings or unsupported promises.

## Verification

Run:

```sh
node content/site/ai-work-school/verify.mjs
jq empty content/site/ai-work-school/site.json
```

The verifier checks the migration contract, real block fields, stable IDs, sealed media equality, reading order, exact CTA, one-grid rule, FAQ bound, count-free copy, theme completeness, contrast, TipTap structure and risky-copy exclusions.
