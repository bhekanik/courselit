# AI Work School design rationale

## Product direction

The fixed product interview gave three words: practical, exacting, generous. The page should feel like a well-made job sheet on a calm workbench. It tells the learner what to bring, what to do next, what to check, and what they will have when they finish. It does not perform intelligence through decoration.

The page has one job: help a working professional decide whether the free course fits a real task, then take them to it. It names one course and one direct CourseLit route. There is no catalogue to pad, no borrowed proof, and no promise about speed. The numbered sequence is useful because order matters; it is not a row of interchangeable features.

## Visual system

The palette began in OKLCH around a cranberry action colour, then added a teal checking colour and cool navy neutrals. Cranberry marks a decision or next action. Teal marks verification and supporting states. White remains genuinely white in the light theme; the dark theme uses a deep navy surface rather than black. This gives the site a recognisable working character without the purple gradients and synthetic imagery common to AI pages.

CourseLit's theme renderer passes colour strings through `color-convert`, which accepts hex but not OKLCH. The manifest therefore stores six-digit hex values. Both modes contain every field in `ThemeStyle`, including sidebar, chart and shadow tokens, so the later migration never has to fill gaps from an unrelated parent theme.

Roboto Slab gives headings the character of a training manual without making the page ornamental. Mulish keeps instructions, questions and controls open at small sizes. Buttons use sentence case. Corners are modest. Cards have a border and no elevation; buttons get only the smallest shadow. The design avoids the double emphasis of a strong border and a wide shadow.

## Page composition

The header keeps one primary course action. It also retains CourseLit's login control and theme switcher. In-page anchor links were left out because the registered header is sticky and the block system has no scroll-margin setting for anchor targets. The opening hero asks for a real task, explains the complete learning result, and points to the exact course route. It uses no media because the available design does not have a real image that adds evidence.

The two-column workflow grid is an ordered diagram expressed through an existing registered block. It collapses to one column on small screens in CourseLit's implementation. The artefact section names the working brief, source contract, decision record and closing note the learner will keep. The course panel gives the only inventory facts supported by the curriculum and repeated in the manifest contract: free access, seven sections and fourteen lessons. The FAQ handles suitability, named work examples, non-coding work, sensitive material and tool independence without making product comparisons.

The core path is written for non-coding professionals. Engineering appears once as an explicit optional extension. Copy uses British spelling and avoids internal notes, testimonials, performance claims and fixed time savings.

## Accessibility and motion

Foreground pairs meet WCAG 2.2 AA in both modes, with body foregrounds targeting the stricter 7:1 ratio. Primary, secondary, muted, accent and sidebar pairs are checked separately. Focus rings target at least 3:1 against the page background. Text is never placed on an image.

The layout uses CourseLit's responsive `Section`, `Grid`, `Hero`, `FAQ`, header and footer implementations. Content widths and spacing are supported theme tokens. Buttons stack on small screens, the grid collapses, and the horizontal FAQ becomes a single column. The author-controlled rich text starts at heading level two. Registered grid, hero and FAQ blocks render their section titles through CourseLit's `Header1` primitive; changing that document outline belongs to the platform, not this data manifest.

There is no marquee, custom transition, auto-play media, parallax, or hover-only information. Reduced-motion users receive the same content and interaction because the manifest introduces no motion to remove.

## P4 apply contract

The manifest is domain-scoped. P4 resolves the current domain and its active owner, patches only the stated site title and subtitle, upserts `theme_ai_work_school_v1` for that owner, and points `Domain.themeId` at it. It copies the complete style to `theme` and `draftTheme`.

P4 upserts the two shared widgets by their stable IDs, then copies them to both `sharedWidgets` and `draftSharedWidgets`. It replaces the existing `homepage` layout only when preflight finds either the untouched CourseLit default or the dedicated rich-text widget named by `managedMarker`. That widget is stored in `Page.layout` and `draftLayout` through CourseLit's real `WidgetSchema`; its visible course inventory also earns its place in the page. Arbitrary owner-edited layouts match neither condition. Preflight must also find the mandatory `privacy` and `terms` pages listed in `requiredPages`, because the footer links to them; it leaves their content alone. P4 copies published page metadata and layout to their draft counterparts. Re-running the migration updates these same records and IDs rather than creating another theme or page.

The manifest does not mutate a database, contain production object IDs, or deploy by itself. It is the reviewed input to the launch migration.
