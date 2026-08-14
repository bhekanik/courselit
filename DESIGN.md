---
name: AI Work School
description: Practical AI training for work that must stand up to review.
colors:
    page: "#FFFFFF"
    surface: "#F7F8F8"
    ink: "#0F1D2E"
    ink-secondary: "#435564"
    action: "#7A1B2B"
    action-hover: "#5F1421"
    action-foreground: "#FFFFFF"
    evidence: "#0E5C5E"
    evidence-tint: "#DDEDEA"
    evidence-tint-foreground: "#174A46"
    review: "#8A4B12"
    rule: "#687783"
    dark-page: "#101820"
    dark-surface: "#17222C"
    dark-ink: "#F3F5F7"
    dark-ink-secondary: "#B8C3CC"
    dark-action: "#C8394F"
    dark-action-hover: "#B92D43"
    dark-action-foreground: "#FFFFFF"
    dark-evidence: "#57B6B2"
    dark-evidence-tint: "#12312F"
    dark-evidence-tint-foreground: "#DDF7F4"
    dark-review: "#D08A45"
    dark-rule: "#7D8B97"
typography:
    display:
        fontFamily: "Roboto Slab, ui-serif, Georgia, serif"
        fontSize: "clamp(2rem, 1.35rem + 2.4vw, 3.25rem)"
        fontWeight: 600
        lineHeight: 1.14
        letterSpacing: "-0.005em"
    headline:
        fontFamily: "Roboto Slab, ui-serif, Georgia, serif"
        fontSize: "clamp(1.5rem, 1.2rem + 1.1vw, 2rem)"
        fontWeight: 600
        lineHeight: 1.22
        letterSpacing: "normal"
    title:
        fontFamily: "Roboto Slab, ui-serif, Georgia, serif"
        fontSize: "1.125rem"
        fontWeight: 500
        lineHeight: 1.35
    body:
        fontFamily: "Mulish, ui-sans-serif, system-ui, sans-serif"
        fontSize: "1rem"
        fontWeight: 400
        lineHeight: 1.65
    label:
        fontFamily: "Mulish, ui-sans-serif, system-ui, sans-serif"
        fontSize: "0.875rem"
        fontWeight: 600
        lineHeight: 1.4
        letterSpacing: "0.01em"
rounded:
    control: "6px"
    surface: "8px"
    media: "12px"
spacing:
    xs: "4px"
    sm: "8px"
    md: "16px"
    lg: "24px"
    xl: "32px"
    section: "64px"
components:
    button-primary:
        backgroundColor: "{colors.action}"
        textColor: "{colors.action-foreground}"
        typography: "{typography.label}"
        rounded: "{rounded.control}"
        padding: "12px 24px"
    button-primary-hover:
        backgroundColor: "{colors.action-hover}"
        textColor: "{colors.action-foreground}"
    button-secondary:
        backgroundColor: "{colors.page}"
        textColor: "{colors.ink}"
        typography: "{typography.label}"
        rounded: "{rounded.control}"
        padding: "12px 24px"
    work-panel:
        backgroundColor: "{colors.surface}"
        textColor: "{colors.ink}"
        rounded: "{rounded.surface}"
        padding: "24px"
    field:
        backgroundColor: "{colors.page}"
        textColor: "{colors.ink}"
        typography: "{typography.body}"
        rounded: "{rounded.control}"
        padding: "12px 16px"
---

# Design System: AI Work School

## Overview

**Creative North Star: "The Review Table"**

A cross-functional team gathers around a shared worktable in late-afternoon daylight, reading the evidence before deciding what leaves the room. The visual system feels like that table: organised but in use, serious without becoming austere, and built around documents, sources, checks and human decisions.

The page is light-first because learners may use it during an ordinary working day. True white and cool neutral surfaces keep the generated editorial illustrations distinct without turning the interface into cream-paper pastiche. Navy supplies structure, oxblood marks an action, teal marks evidence or a passed check, and clay marks something that needs a look. The system rejects generic AI gradients, purple glow, robot or chatbot art, giant empty heroes, glassmorphism, endless card grids and editorial-magazine styling used as a shortcut for seriousness.

**Key Characteristics:**

- Real professional work before AI vocabulary.
- One decisive split hero; all later imagery teaches or proves something.
- Flat surfaces, modest corners and rules that organise rather than decorate.
- Visible evidence, refusal paths and human decisions.
- A mobile course action before the first viewport ends.

## Colors

The full palette behaves like a working notation system. Navy is structure; oxblood is an action; teal is evidence; clay is review.

### Primary

- **Action Oxblood:** The only light-mode call-to-action colour. It is never used for errors, warnings, diagram nodes or status.
- **Dark Action Cranberry:** The dark-mode action equivalent, lightened enough to keep white button text readable.

### Secondary

- **Evidence Teal:** Sources, citations, passed checks and supporting links. Every teal state also has a text label.
- **Review Clay:** Work that needs attention, a missing input or a refusal path. It is never substituted with the action colour.

### Neutral

- **True White:** The light page canvas.
- **Cool Work Surface:** Panels and alternating quiet regions; never a cream or sand page wash.
- **Ledger Ink:** Headings and body copy.
- **Secondary Ink:** Captions, metadata and the compact inventory line.
- **Measured Rule:** Inputs and meaningful boundaries; decorative hairlines may be lighter, but they never carry meaning alone.
- **Night Desk:** The dark-mode page canvas, with a slightly lighter raised surface.

**The Four Roles Rule.** Navy structures. Oxblood acts. Teal verifies. Clay asks for review. Never exchange their jobs.

**The Light Section Rule.** Landing-page sections remain light. No navy section band is permitted because CourseLit's section background cannot safely swap foreground tokens.

### Verified contrast

Ratios use WCAG relative luminance. Normal text and control labels require at least 4.5:1; meaningful non-text boundaries require at least 3:1.

- Light body `#0F1D2E` on `#FFFFFF`: **17.00:1**.
- Light secondary `#435564` on `#FFFFFF`: **7.71:1**.
- Light action label `#FFFFFF` on `#7A1B2B`: **10.40:1**; hover on `#5F1421`: **13.05:1**.
- Light rule `#687783` on `#FFFFFF`: **4.61:1**.
- Dark body `#F3F5F7` on `#101820`: **16.37:1**.
- Dark secondary `#B8C3CC` on `#101820`: **9.98:1**.
- Dark action label `#FFFFFF` on `#C8394F`: **5.06:1**; hover on `#B92D43`: **5.97:1**.
- Dark rule `#7D8B97` on `#101820`: **5.12:1**.

## Typography

**Display Font:** Roboto Slab (with Georgia fallback)
**Body Font:** Mulish (with system sans fallback)

**Character:** The slab headings feel like a clear training manual rather than a campaign headline. Mulish keeps instructions open and legible at working sizes. There is no third type family and no monospace costume.

### Hierarchy

- **Display** (600, fluid 2rem–3.25rem, 1.14): Hero heading only, capped at 17 characters per line where the layout permits.
- **Headline** (600, fluid 1.5rem–2rem, 1.22): Section headings, balanced and capped near 24 characters per line.
- **Title** (500, 1.125rem, 1.35): Artefact names, diagram titles and the two earned comparison panels.
- **Body** (400, 1rem, 1.65): Instructions and explanatory copy, capped at 68ch.
- **Label** (600, 0.875rem, 1.4, sentence case): Inventory, navigation and captions. Never used as a repeated uppercase eyebrow.

**The Working Size Rule.** Body copy never drops below 1rem and diagram labels never render below 12px. Display tracking never becomes tighter than -0.005em.

## Elevation

The system is flat by default. Tonal separation and rules establish hierarchy. Cards and figures use no shadow. The only elevation is a small action shadow on buttons; it signals that the control can be pressed rather than trying to make every surface float.

### Shadow Vocabulary

- **Action lift** (`0 1px 2px rgba(15, 29, 46, 0.16)`): Primary and secondary buttons only.

**The One Shadow Rule.** If an element already has a visible border, it receives no decorative shadow. No blur greater than 8px is part of this system.

## Components

### Buttons

- **Shape:** Compact, gently curved control (6px radius), at least 44px high.
- **Primary:** Oxblood with white text in light mode; cranberry with white text in dark mode; 12px × 24px padding.
- **Hover / Focus:** Use the verified darker hover shade in each mode. Use a 2px focus ring with a 2px offset. State transitions last 160ms and become instant under reduced motion.
- **Secondary:** White or raised-surface fill with ledger ink and one measured border. It never competes with the primary course action.

### Chips

- **Style:** Use only for real metadata such as `Free` or `No coding`, not as decorative eyebrows. Evidence chips use the teal tint plus explicit text.
- **State:** No colour-only state.

### Cards / Containers

- **Corner Style:** 8px for panels; 12px for media. Nothing above 16px.
- **Background:** White or cool work surface.
- **Shadow Strategy:** None.
- **Border:** One measured rule where the boundary matters.
- **Internal Padding:** 24px.

### Inputs / Fields

- **Style:** White or night-desk surface, 6px radius, 12px × 16px padding and a 3:1 boundary.
- **Focus:** 2px navy ring in light mode; 2px near-white ring in dark mode.
- **Error / Disabled:** Error copy names the problem. Disabled state reduces opacity but keeps text readable.

### Navigation

The header is sticky, quiet and action-led. It keeps the brand, login/theme controls and one `Start the course — free` button. It does not add anchor links that can land beneath the sticky header.

### Split Hero

Copy and the course action come first in DOM and mobile order. The working-team illustration follows. On desktop the two share the row without letting the image crop hide any person. The illustration uses a 12px radius, no border and no shadow.

## Do's and Don'ts

### Do:

- **Do** show documents, source material, checklists and human decisions before naming an AI mechanism.
- **Do** use true white and cool neutral surfaces so the warm illustrations remain the visual event.
- **Do** keep oxblood action-only, teal evidence-only and clay review-only.
- **Do** place deterministic labelled diagrams inside the lesson where the relationship is taught.
- **Do** put the primary course action before the hero image in mobile reading order.
- **Do** verify every runtime media URL before adding its image node to a canonical manifest.

### Don't:

- **Don't** use generic AI gradients, purple glow, robot or chatbot art, or synthetic intelligence motifs.
- **Don't** use giant empty heroes, endless identical card grids, marquees, glassmorphism or motion without a job.
- **Don't** use editorial-magazine styling as a shortcut for seriousness.
- **Don't** repeat tiny uppercase eyebrows or generic numbered section scaffolding.
- **Don't** use fake metrics, testimonials, unsupported time-saving claims, tool rankings or brand loyalty as proof.
- **Don't** put the action colour inside a diagram or use colour as the only carrier of status.
- **Don't** combine a visible border with a wide soft shadow, use card radii above 16px, or use dark section bands.
