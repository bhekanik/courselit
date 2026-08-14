#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("./", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("site.json", root), "utf8"));

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
const allowedBlockNames = new Set(["header", "footer", "hero", "rich-text", "grid", "faq"]);
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
  preflight: "default-or-managed",
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
assert.deepEqual(manifest.course, { ...course, access: "free", sections: 7, lessons: 14 });
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
assert.deepEqual(sharedWidgets.map(({ name }) => name), ["header", "footer"]);
assert.ok(sharedWidgets.every(({ shared }) => shared === true));

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
  assert.match(widget.widgetId, /^widget_ai_work_school_[a-z0-9_]+_v1$/);
  assert.ok(allowedBlockNames.has(widget.name), `${widget.name} is not an approved site block`);
  assert.equal(widget.settings.type, "site", `${widget.name} must use site metadata`);
  validateSettings(widget.name, widget.settings);
}

const bodyNames = page.layout.slice(1, -1).map(({ name }) => name);
assert.deepEqual(bodyNames, ["rich-text", "hero", "grid", "rich-text", "hero", "faq"]);
const managedWidget = page.layout.find(({ widgetId }) => widgetId === manifest.managedMarker.widgetId);
assert.equal(managedWidget.name, "rich-text");
assert.equal(managedWidget.shared, false);

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
assert.doesNotMatch(copy, /[\u2013\u2014]/, "copy must not use en/em dashes");
assert.doesNotMatch(copy, /[\u200b\u200c\u200d\ufeff]/, "copy must not contain invisible characters");
assert.match(copy, /real task/i);
assert.match(copy, /working brief/i);
assert.match(copy, /source contract/i);
assert.match(copy, /decision record/i);
assert.match(copy, /supplier review.*hiring scorecard.*board summary.*incident write-up/is);

const headerCourseLinks = sharedWidgets[0].settings.links.filter(({ href }) => href === course.href);
assert.deepEqual(headerCourseLinks.map(({ label }) => label), ["Start the free course"]);
const courseHeroes = page.layout.filter(({ name, settings }) => name === "hero" && settings.buttonAction === course.href);
assert.equal(courseHeroes.length, 2);
assert.ok(courseHeroes.every(({ settings }) => settings.buttonCaption === "Start the free course"));
const footerCourseLinks = sharedWidgets[1].settings.sections.flatMap(({ links }) => links).filter(({ href }) => href === course.href);
assert.deepEqual(footerCourseLinks.map(({ label }) => label), ["Start the free course"]);
const footerHrefs = new Set(sharedWidgets[1].settings.sections.flatMap(({ links }) => links).map(({ href }) => href));
assert.ok(manifest.requiredPages.every(({ href }) => footerHrefs.has(href)), "every required page must be linked from the footer");

const coursePanel = courseHeroes.at(-1).settings;
assert.match(collectText(managedWidget).join(" "), new RegExp(`${manifest.course.sections} sections.*${manifest.course.lessons} lessons`, "i"));
for (const [mode, backgroundKey] of [["light", "backgroundColor"], ["dark", "backgroundColorDark"]]) {
  assert.ok(contrast(theme.style.colors[mode].foreground, coursePanel.background[backgroundKey]) >= 4.5, `${mode} course panel must keep readable text`);
  assert.ok(contrast(theme.style.colors[mode].ring, coursePanel.background[backgroundKey]) >= 3, `${mode} course panel must keep a visible focus ring`);
}

console.log("AI Work School site manifest checks passed");

function validateSettings(name, settings) {
  const common = ["type", "verticalPadding", "maxWidth"];
  const allowedByBlock = {
    header: [...common, "links", "linkAlignment", "showLoginControl", "linkFontWeight", "spacingBetweenLinks", "layout", "backdropBlur"],
    footer: [...common, "sections", "titleFontSize", "sectionHeaderFontSize", "socials", "socialIconsSize"],
    hero: [...common, "background", "title", "description", "buttonCaption", "buttonAction", "secondaryButtonCaption", "secondaryButtonAction", "alignment", "titleFontSize", "descriptionFontSize", "contentAlignment", "cssId", "layout"],
    grid: [...common, "title", "description", "headerAlignment", "itemsAlignment", "items", "cssId", "columns"],
    "rich-text": [...common, "text", "alignment", "cssId", "fontSize"],
    faq: [...common, "title", "description", "headerAlignment", "itemsAlignment", "items", "cssId", "layout"],
  };
  const extras = Object.keys(settings).filter((key) => !allowedByBlock[name].includes(key));
  assert.deepEqual(extras, [], `${name} contains fields its Settings type does not define`);
  if (settings.maxWidth) assert.ok(allowedPageWidths.has(settings.maxWidth));
  if (settings.verticalPadding) assert.ok(allowedVerticalPadding.has(settings.verticalPadding));
  if (settings.background) assert.equal(settings.background.type, "color");
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
  if (name === "hero") assert.ok([3, 4, 5, 6].includes(settings.titleFontSize));
  assert.doesNotMatch(JSON.stringify(settings), /\b(?:w-\[|h-\[|min-w-\[|max-w-\[)/);
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
      if (["title", "label", "text", "subtitle", "description", "question", "answer", "buttonCaption", "secondaryButtonCaption"].includes(key) && typeof entry === "string") {
        results.push(entry);
      }
      collectText(entry, results);
    }
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
