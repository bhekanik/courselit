#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("./", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("site.json", root), "utf8"));
const mediaManifest = JSON.parse(readFileSync(new URL("media.json", root), "utf8"));
const courseManifest = JSON.parse(readFileSync(new URL("../../courses/ai-for-actual-work/course.json", root), "utf8"));

const course = {
  courseId: "course_ai_for_actual_work_v1",
  slug: "ai-for-actual-work",
  href: "/course/ai-for-actual-work/course_ai_for_actual_work_v1",
};

const colourFields = [
  "background",
  "foreground",
  "card",
  "cardForeground",
  "popover",
  "popoverForeground",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "accent",
  "accentForeground",
  "destructive",
  "border",
  "input",
  "ring",
  "chart1",
  "chart2",
  "chart3",
  "chart4",
  "chart5",
  "sidebar",
  "sidebarForeground",
  "sidebarPrimary",
  "sidebarPrimaryForeground",
  "sidebarAccent",
  "sidebarAccentForeground",
  "sidebarBorder",
  "sidebarRing",
  "shadow2xs",
  "shadowXs",
  "shadowSm",
  "shadowMd",
  "shadowLg",
  "shadowXl",
  "shadow2xl",
];
const shadowFields = new Set(colourFields.filter((field) => field.startsWith("shadow")));
const typographyFields = [
  "preheader",
  "header1",
  "header2",
  "header3",
  "header4",
  "subheader1",
  "subheader2",
  "text1",
  "text2",
  "link",
  "button",
  "input",
  "caption",
];
const allowedFonts = new Set([
  "font-roboto-slab",
  "font-mulish",
  "font-source-sans-3",
  "font-system-ui",
]);
const allowedBlockNames = new Set(["header", "footer", "hero", "rich-text", "media", "grid", "faq"]);
const allowedPageWidths = new Set(["max-w-2xl", "max-w-3xl", "max-w-4xl", "max-w-5xl", "max-w-6xl"]);
const allowedVerticalPadding = new Set(["py-4", "py-8", "py-12", "py-16", "py-20", "py-24", "py-32"]);
const allowedTipTapNodes = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "hardBreak",
]);
const allowedTipTapMarks = new Set(["bold", "italic", "underline", "strike", "link"]);

assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.siteKey, "ai-work-school");
assert.deepEqual(manifest.managedMarker, {
  pageId: "homepage",
  widgetId: "widget_ai_work_school_managed_v1",
  preflight: "launch-baseline-or-v2",
});
assert.deepEqual(manifest.domainScope, {
  selector: "current-domain",
  ownerUserIdSource: "domain-owner.userId",
    themeId: "theme_ai_work_school_v1",
    settingsPatch: {
      title: "AI Work School",
      subtitle: "Bring the task. Build the checks.",
    },
});
assert.deepEqual(manifest.course, { ...course, access: "free" });
assert.equal(courseManifest.course.courseId, course.courseId);
assert.equal(courseManifest.course.slug, course.slug);
assert.deepEqual(manifest.requiredPages, [
  { pageId: "privacy", href: "/p/privacy" },
  { pageId: "terms", href: "/p/terms" },
]);

const { theme } = manifest;
assert.equal(theme.themeId, manifest.domainScope.themeId);
assert.equal(theme.name, "AI Work School");
assert.equal(theme.parentThemeId, "learning");
assert.equal(theme.userIdSource, manifest.domainScope.ownerUserIdSource);
assert.deepEqual(theme.applyStyleTo, ["theme", "draftTheme"]);
assert.deepEqual(
  Object.fromEntries(["background", "foreground", "card", "primary", "primaryForeground", "accent", "accentForeground", "destructive", "border", "ring"].map((key) => [key, theme.style.colors.light[key]])),
  {
    background: "#ffffff",
    foreground: "#0f1d2e",
    card: "#f7f8f8",
    primary: "#7a1b2b",
    primaryForeground: "#ffffff",
    accent: "#ddebea",
    accentForeground: "#174a46",
    destructive: "#8a4b12",
    border: "#687783",
    ring: "#0e5c5e",
  },
  "light palette must keep the Review Table roles",
);
assert.deepEqual(
  Object.fromEntries(["background", "foreground", "card", "primary", "primaryForeground", "accent", "accentForeground", "destructive", "border", "ring"].map((key) => [key, theme.style.colors.dark[key]])),
  {
    background: "#101820",
    foreground: "#f3f5f7",
    card: "#17222c",
    primary: "#c8394f",
    primaryForeground: "#ffffff",
    accent: "#12312f",
    accentForeground: "#ddf7f4",
    destructive: "#d08a45",
    border: "#7d8b97",
    ring: "#57b6b2",
  },
  "dark palette must keep the Review Table roles",
);

for (const mode of ["light", "dark"]) {
  const colours = theme.style.colors[mode];
  assert.deepEqual(Object.keys(colours).sort(), [...colourFields].sort(), `${mode} colours must match ThemeStyle`);
  for (const field of colourFields) {
    assert.equal(typeof colours[field], "string", `${mode}.${field} must be a string`);
    if (!shadowFields.has(field)) {
      assert.match(colours[field], /^#[0-9a-f]{6}$/i, `${mode}.${field} must be renderer-compatible hex`);
    }
  }

  for (const [foreground, background, minimum] of [
    ["foreground", "background", 7],
    ["cardForeground", "card", 4.5],
    ["popoverForeground", "popover", 4.5],
    ["primaryForeground", "primary", 4.5],
    ["secondaryForeground", "secondary", 4.5],
    ["mutedForeground", "muted", 4.5],
    ["accentForeground", "accent", 4.5],
    ["sidebarForeground", "sidebar", 4.5],
    ["sidebarPrimaryForeground", "sidebarPrimary", 4.5],
    ["sidebarAccentForeground", "sidebarAccent", 4.5],
  ]) {
    assert.ok(
      contrast(colours[foreground], colours[background]) >= minimum,
      `${mode}.${foreground}/${background} must have at least ${minimum}:1 contrast`,
    );
  }
  assert.ok(contrast(colours.ring, colours.background) >= 3, `${mode} focus ring must have 3:1 contrast`);
  for (const token of ["border", "input"]) {
    assert.ok(contrast(colours[token], colours.background) >= 3, `${mode}.${token} must have 3:1 non-text contrast`);
  }
  assert.ok(contrast(colours.mutedForeground, colours.background) >= 4.5, `${mode}.mutedForeground must work on the page background`);
  assert.ok(contrast(colours.sidebarBorder, colours.sidebar) >= 3, `${mode}.sidebarBorder must have 3:1 non-text contrast`);
  assert.ok(contrast(colours.sidebarRing, colours.sidebar) >= 3, `${mode}.sidebarRing must have 3:1 focus contrast`);
}

assert.deepEqual(Object.keys(theme.style.typography).sort(), [...typographyFields].sort());
for (const [role, type] of Object.entries(theme.style.typography)) {
  assert.ok(allowedFonts.has(type.fontFamily), `${role} uses an unsupported font`);
  assert.match(type.fontSize, /^text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)$/);
  assert.match(type.fontWeight, /^font-(?:normal|medium|semibold|bold)$/);
}
for (const role of ["header1", "header2", "header3", "header4"]) {
  assert.equal(theme.style.typography[role].fontFamily, "font-roboto-slab");
}
for (const role of ["text1", "text2", "link", "button", "input", "caption"]) {
  assert.equal(theme.style.typography[role].fontFamily, "font-mulish");
}

assert.ok(allowedPageWidths.has(theme.style.structure.page.width));
assert.ok(allowedVerticalPadding.has(theme.style.structure.section.padding.y));
assert.equal(theme.style.structure.section.padding.x, "px-4");
assert.deepEqual(theme.style.interactives.button.border, {
  width: "border",
  radius: "rounded-md",
  style: "border-solid",
});
assert.equal(theme.style.interactives.button.shadow, "shadow-xs");
assert.equal(theme.style.interactives.card.border.radius, "rounded-lg");
assert.equal(theme.style.interactives.card.shadow, "shadow-none");

const { sharedWidgets, page } = manifest;
assert.deepEqual(manifest.draftSharedWidgetsSource, "sharedWidgets");
assert.equal(sharedWidgets.length, 2);
assert.deepEqual(sharedWidgets.map(({ widgetId }) => widgetId), ["widget_ai_work_school_header_v1", "widget_ai_work_school_footer_v1"]);
assert.deepEqual(sharedWidgets.map(({ name }) => name), ["header", "footer"]);
assert.ok(sharedWidgets.every(({ shared }) => shared === true));
assert.ok(
  new Set(["font-normal", "font-light", "font-bold"]).has(sharedWidgets[0].settings.linkFontWeight),
  "header linkFontWeight must match the registered Settings union",
);

assert.equal(page.pageId, "homepage");
assert.equal(page.type, "site");
assert.equal(page.entityIdSource, "domain.name");
assert.equal(page.creatorIdSource, manifest.domainScope.ownerUserIdSource);
assert.equal(page.draftLayoutSource, "page.layout");
assert.equal(page.draftTitleSource, "page.title");
assert.equal(page.draftDescriptionSource, "page.description");
assert.equal(page.draftRobotsAllowedSource, "page.robotsAllowed");
assert.equal(page.robotsAllowed, true);

assert.equal(page.layout[0].shared, true);
assert.equal(page.layout[0].name, "header");
assert.equal(page.layout.at(-1).shared, true);
assert.equal(page.layout.at(-1).name, "footer");
assert.equal(page.layout[0].widgetId, sharedWidgets[0].widgetId);
assert.equal(page.layout.at(-1).widgetId, sharedWidgets[1].widgetId);

const allWidgets = [...sharedWidgets, ...page.layout.filter(({ shared }) => !shared)];
assert.equal(new Set(allWidgets.map(({ widgetId }) => widgetId)).size, allWidgets.length, "widget IDs must be unique");
for (const widget of allWidgets) {
  assert.match(widget.widgetId, /^widget_ai_work_school_[a-z0-9_]+_v[12]$/);
  assert.ok(allowedBlockNames.has(widget.name), `${widget.name} is not an approved site block`);
  assert.equal(widget.settings.type, "site", `${widget.name} must use site metadata`);
  validateSettings(widget.name, widget.settings);
}

const bodyNames = page.layout.slice(1, -1).map(({ name }) => name);
assert.deepEqual(bodyNames, [
  "hero",
  "rich-text",
  "rich-text",
  "media",
  "rich-text",
  "media",
  "rich-text",
  "rich-text",
  "grid",
  "hero",
  "faq",
]);
const managedWidget = page.layout.find(({ widgetId }) => widgetId === manifest.managedMarker.widgetId);
assert.equal(managedWidget.name, "rich-text");
assert.equal(managedWidget.shared, false);

const expectedMedia = Object.fromEntries(mediaManifest.entries.map(({ key, media }) => [key, media]));
const hero = page.layout[1];
assert.equal(hero.widgetId, "widget_ai_work_school_hero_v2");
assert.equal(hero.name, "hero");
assert.equal(hero.settings.mobileMediaPlacement, "after-content");
assert.equal(hero.settings.alignment, "right");
assert.equal(hero.settings.contentAlignment, "left");
assert.deepEqual(hero.settings.media, expectedMedia["landing-hero"]);

for (const [widgetId, mediaKey] of [
  ["widget_ai_work_school_tool_selection_v2", "landing-tool-selection"],
  ["widget_ai_work_school_outputs_v2", "landing-checked-work"],
]) {
  const widget = page.layout.find((entry) => entry.widgetId === widgetId);
  assert.equal(widget.name, "media");
  assert.deepEqual(widget.settings.media, expectedMedia[mediaKey]);
  assert.equal(widget.settings.hasBorder, false);
  assert.equal(widget.settings.mediaRadius, 4);
}

const actions = [...collectValues(manifest, "href"), ...collectValues(manifest, "buttonAction")];
assert.ok(actions.every((href) => href.startsWith("/") || href.startsWith("#")), "all links must stay on the site");

const serialised = JSON.stringify(manifest);
assert.doesNotMatch(serialised, /\b(?:gradient|marquee|carousel|autoplay|parallax|chatbot|robot|purple|violet)\b/i);
assert.doesNotMatch(serialised, /animate-|transition-|duration-|hover:scale|hover:translate|motion-/i);
assert.doesNotMatch(serialised, /\b(?:ChatGPT|Claude|Gemini|Copilot)\b/i);

const copy = collectText(manifest).join("\n");
assert.doesNotMatch(copy, /\b(?:revolutionary|cutting-edge|game-changing|seamless|robust|leverage|unlock|supercharge|transform your|empower)\b/i);
assert.doesNotMatch(copy, /\b\d+(?:\.\d+)?\s*%/);
assert.doesNotMatch(copy, /\b(?:save|saved|saving)\s+\d+\s+(?:minutes?|hours?|days?)\b/i);
assert.doesNotMatch(copy.replaceAll("Start the course — free", ""), /[\u2013\u2014]/, "only the required CTA may use an en/em dash");
assert.doesNotMatch(copy, /[\u200b\u200c\u200d\ufeff]/, "copy must not contain invisible characters");
assert.match(copy, /real job/i);
assert.match(copy, /working brief/i);
assert.match(copy, /source contract/i);
assert.match(copy, /decision record/i);
assert.match(copy, /handover/i);
assert.match(copy, /Choose the shape of the job, not the brand of the tool\./);
assert.match(copy, /One-off question: use a chat, then check the answer yourself\./);
assert.match(copy, /Same job, repeated: pack the context, steps, examples and checks as a reusable skill\./);
assert.match(copy, /Needs approved files or systems: connect the source behind a permission gate\./);
assert.match(copy, /Higher consequence: another person checks it before it leaves\./);
assert.match(copy, /From first brief to finished handover\./);
assert.match(copy, /Bring one job\. Leave with a method\. Free\./);
assert.doesNotMatch(copy, /\b(?:7|seven) sections?\b|\b(?:14|fourteen|22|twenty-two) lessons?\b/i);

const headerCourseLinks = sharedWidgets[0].settings.links.filter(({ href }) => href === course.href);
assert.deepEqual(headerCourseLinks.map(({ label }) => label), ["Start the course — free"]);
const courseHeroes = page.layout.filter(({ name, settings }) => name === "hero" && settings.buttonAction === course.href);
assert.equal(courseHeroes.length, 2);
assert.ok(courseHeroes.every(({ settings }) => settings.buttonCaption === "Start the course — free"));
const footerCourseLinks = sharedWidgets[1].settings.sections.flatMap(({ links }) => links).filter(({ href }) => href === course.href);
assert.deepEqual(footerCourseLinks.map(({ label }) => label), ["Start the course — free"]);
const footerHrefs = new Set(sharedWidgets[1].settings.sections.flatMap(({ links }) => links).map(({ href }) => href));
assert.ok(manifest.requiredPages.every(({ href }) => footerHrefs.has(href)), "every required page must be linked from the footer");

assert.match(collectText(managedWidget).join(" "), /Free · Bring one job you already do · No coding/);
const artefacts = page.layout.find(({ widgetId }) => widgetId === "widget_ai_work_school_artefacts_v2");
const artefactItems = findNodes(artefacts.settings.text, "bulletList").flatMap(({ content }) => content);
assert.equal(artefactItems.length, 5);
assert.match(collectText(artefacts).join(" "), /capstone consolidates your lesson records into five reviewable files/i);
assert.deepEqual(
  artefactItems.map((item) => collectText(item).join(" ").match(/\(([^)]+\.md)\)/)?.[1]),
  courseManifest.course.capstone.artifacts,
);
const curriculum = page.layout.find(({ widgetId }) => widgetId === "widget_ai_work_school_curriculum_v2");
assert.equal(findNodes(curriculum.settings.text, "orderedList").length, 1);
const curriculumItems = findNodes(curriculum.settings.text, "orderedList")[0].content;
assert.deepEqual(
  curriculumItems.map((item) => collectText(item)[0].replace(/\.\s*$/, "")),
  courseManifest.course.sections.map(({ title }) => title),
  "homepage curriculum must follow the source course",
);
const grids = page.layout.filter(({ name }) => name === "grid");
assert.equal(grids.length, 1, "fit/not-fit must be the only grid");
assert.deepEqual(grids[0].settings.items.map(({ title }) => title), ["This is for you if", "This is not for you if"]);
assert.equal(grids[0].settings.items.length, 2);
const faqs = page.layout.filter(({ name }) => name === "faq");
assert.equal(faqs.length, 1);
assert.ok(faqs[0].settings.items.length <= 6, "FAQ must have no more than six items");
assert.equal(faqs[0].settings.items.length, 6);
assert.deepEqual(faqs[0].settings.items.map(({ title }) => title), [
  "How much does the course cost?",
  "Do I need to write code?",
  "What kind of work should I bring?",
  "What if my company has rules about AI?",
  "What should I do with sensitive material?",
  "Does this depend on one AI tool?",
]);
assert.equal(courseHeroes.at(-1).settings.verticalPadding, "py-12", "closing CTA must stay compact");
assert.ok(page.layout.every(({ settings }) => !settings?.background), "landing sections must not introduce colour bands");

console.log("AI Work School site manifest checks passed");

function validateSettings(name, settings) {
  const common = ["type", "verticalPadding", "maxWidth"];
  const allowedByBlock = {
    header: [...common, "links", "linkAlignment", "showLoginControl", "linkFontWeight", "spacingBetweenLinks", "layout", "backdropBlur"],
    footer: [...common, "sections", "titleFontSize", "sectionHeaderFontSize", "socials", "socialIconsSize"],
    hero: [...common, "title", "description", "buttonCaption", "buttonAction", "secondaryButtonCaption", "secondaryButtonAction", "alignment", "titleFontSize", "descriptionFontSize", "contentAlignment", "cssId", "layout", "media", "mediaRadius", "aspectRatio", "objectFit", "mobileMediaPlacement"],
    media: [...common, "media", "mediaRadius", "cssId", "aspectRatio", "objectFit", "hasBorder"],
    grid: [...common, "title", "description", "headerAlignment", "itemsAlignment", "items", "cssId", "columns"],
    "rich-text": [...common, "text", "alignment", "cssId", "fontSize"],
    faq: [...common, "title", "description", "headerAlignment", "itemsAlignment", "items", "cssId", "layout"],
  };
  const extras = Object.keys(settings).filter((key) => !allowedByBlock[name].includes(key));
  assert.deepEqual(extras, [], `${name} contains fields its Settings type does not define`);
  if (settings.maxWidth) assert.ok(allowedPageWidths.has(settings.maxWidth));
  if (settings.verticalPadding) assert.ok(allowedVerticalPadding.has(settings.verticalPadding));
  if (settings.media) validateMedia(settings.media);
  if (settings.description) validateTipTap(settings.description);
  if (settings.text) validateTipTap(settings.text);
  for (const item of settings.items ?? []) {
    if (item.description) validateTipTap(item.description);
    if (item.answer) validateTipTap(item.answer);
  }
  if (name === "faq") {
    assert.ok(settings.items.length > 0);
    assert.ok(settings.items.every((item) => typeof item.title === "string" && item.description?.type === "doc"));
  }
  if (name === "grid") assert.ok([2, 3].includes(settings.columns));
  if (name === "hero" && settings.titleFontSize !== undefined) assert.ok([3, 4, 5, 6].includes(settings.titleFontSize));
  assert.doesNotMatch(JSON.stringify(settings), /\b(?:w-\[|h-\[|min-w-\[|max-w-\[)/);
}

function validateMedia(media) {
  assert.equal(media.access, "public");
  assert.equal(media.mimeType, "image/webp");
  assert.match(media.file, /^https:\/\/media\.bhekani\.com\/p\/[A-Za-z0-9_-]+\/main\.webp$/);
  assert.match(media.thumbnail, /^https:\/\/media\.bhekani\.com\/p\/[A-Za-z0-9_-]+\/thumb\.webp$/);
  assert.ok(media.caption.length > 20, "media needs useful alternative text");
  assert.ok(!media.file.includes("?"), "sealed media URL must be stable");
}

function validateTipTap(node) {
  assert.equal(typeof node, "object");
  assert.ok(allowedTipTapNodes.has(node.type), `unsupported TipTap node: ${node.type}`);
  if (node.type === "doc") assert.ok(Array.isArray(node.content) && node.content.length > 0);
  for (const mark of node.marks ?? []) assert.ok(allowedTipTapMarks.has(mark.type));
  for (const child of node.content ?? []) validateTipTap(child);
}

function collectValues(value, key, results = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectValues(item, key, results);
  } else if (value && typeof value === "object") {
    for (const [entryKey, entryValue] of Object.entries(value)) {
      if (entryKey === key) results.push(entryValue);
      collectValues(entryValue, key, results);
    }
  }
  return results;
}

function collectText(value, results = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectText(item, results);
  } else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      if (["title", "label", "text", "caption", "subtitle", "description", "question", "answer", "buttonCaption", "secondaryButtonCaption"].includes(key) && typeof entry === "string") {
        results.push(entry);
      }
      collectText(entry, results);
    }
  }
  return results;
}

function findNodes(value, type, results = []) {
  if (Array.isArray(value)) {
    for (const item of value) findNodes(item, type, results);
  } else if (value && typeof value === "object") {
    if (value.type === type) results.push(value);
    for (const entry of Object.values(value)) findNodes(entry, type, results);
  }
  return results;
}

function contrast(foreground, background) {
  const luminance = (hex) => {
    const channels = hex.slice(1).match(/.{2}/g).map((part) => Number.parseInt(part, 16) / 255);
    const linear = channels.map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
