#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("./", import.meta.url);
const repoRoot = new URL("../../../", root);
const contract = JSON.parse(
    readFileSync(new URL("asset-contracts.json", root), "utf8"),
);
const mediaLock = JSON.parse(readFileSync(new URL("media.json", root), "utf8"));
const packageJson = JSON.parse(
    readFileSync(new URL("package.json", repoRoot), "utf8"),
);

assert.equal(contract.schemaVersion, 1);
assert.equal(contract.sourceRasterCount, contract.rasters.length);
assert.equal(contract.diagramSourceCount, contract.diagrams.length);

const expectedAppScreenshots = new Map([
    [
        "chatgpt-work-interface",
        {
            pageUrl:
                "https://openai.com/index/chatgpt-for-your-most-ambitious-work/",
            pageTitle:
                "ChatGPT is now a partner for your most ambitious work | OpenAI",
            sourceElementAlt:
                "ChatGPT desktop app menu with Work selected above Codex, Scheduled, and Sites.",
        },
    ],
    [
        "claude-cowork-interface",
        {
            pageUrl: "https://claude.com/product/cowork",
            pageTitle: "Claude Cowork | Claude by Anthropic",
            sourceElementAlt:
                "Official Claude Cowork example showing a recurring report prompt, connected sources and the finished slide deck.",
        },
    ],
    [
        "microsoft-cowork-interface",
        {
            pageUrl:
                "https://support.microsoft.com/en-us/microsoft-365-copilot/get-started-with-cowork",
            pageTitle: "Get started with Cowork | Microsoft Support",
            sourceElementAlt:
                "Screenshot of the Cowork home page showing the chat input, suggested prompts, and recent tasks.",
        },
    ],
    [
        "chatgpt-plugin-directory",
        {
            pageUrl:
                "https://openai.com/index/chatgpt-for-your-most-ambitious-work/",
            pageTitle:
                "ChatGPT is now a partner for your most ambitious work | OpenAI",
            sourceElementAlt:
                "ChatGPT plugins directory showing connected tools including Google Drive, Outlook Email, Gmail, Teams, Slack, SharePoint, Salesforce, and Adobe Acrobat.",
        },
    ],
]);

const appScreenshots = contract.rasters.filter(
    ({ kind }) => kind === "official-app-screenshot",
);
assert.deepEqual(
    appScreenshots.map(({ id }) => id),
    [...expectedAppScreenshots.keys()],
    "official app screenshots must match the reviewed set and order",
);
for (const screenshot of appScreenshots) {
    assert.deepEqual(
        screenshot.provenance,
        {
            ...expectedAppScreenshots.get(screenshot.id),
            capturedAt: "2026-08-14",
            captureMethod: "public official page element via Playwright",
        },
        `${screenshot.id} provenance changed`,
    );
}

const sources = [
    ...contract.rasters.map((asset) => ({ ...asset, file: asset.source })),
    ...contract.diagrams.map((asset) => ({
        ...asset,
        file: asset.sourceWebp,
        sha256: asset.webpSha256,
    })),
];
const targets = sources.flatMap(({ id, promotionTargets }) =>
    promotionTargets.map((target) => ({ ...target, assetId: id })),
);

assert.equal(targets.length, contract.promotionTargetCount);
assert.equal(
    new Set(targets.map(({ key }) => key)).size,
    targets.length,
    "promotion target keys must be unique",
);
assert.equal(mediaLock.schemaVersion, 1);
assert.equal(mediaLock.group, "ai-work-school-v5");
assert.equal(mediaLock.cdnHost, "media.bhekani.com");
assert.equal(mediaLock.entries.length, targets.length);

const sourcesByTarget = new Map(
    sources.flatMap((asset) =>
        asset.promotionTargets.map((target) => [target.key, asset]),
    ),
);
const mediaByTarget = new Map(
    mediaLock.entries.map((entry) => [entry.key, entry]),
);
assert.equal(
    mediaByTarget.size,
    mediaLock.entries.length,
    "media lock keys must be unique",
);

for (const asset of sources) {
    assert.match(
        asset.file,
        /^content\/site\/ai-work-school\/assets\/[a-z0-9-]+\.webp$/,
    );
    assert.match(asset.sha256, /^[a-f0-9]{64}$/);
    assert.ok(
        Number.isInteger(asset.width) && asset.width > 0,
        `${asset.id} needs a positive width`,
    );
    assert.ok(
        Number.isInteger(asset.height) && asset.height > 0,
        `${asset.id} needs a positive height`,
    );
    assert.equal(
        hash(readFileSync(new URL(asset.file, repoRoot))),
        asset.sha256,
        `${asset.id} source hash changed`,
    );
    assert.ok(
        asset.alt.trim().length >= 40,
        `${asset.id} needs meaningful alt text`,
    );
}

for (const target of targets) {
    assert.ok(
        ["site-manifest", "course-manifest", "course-lesson"].includes(
            target.owner,
        ),
    );
    assert.match(target.semanticTarget, /\S/);
    if (
        contract.status === "source-only-awaiting-upload-and-curriculum-targets"
    ) {
        assert.equal(
            target.mediaId,
            null,
            `${target.key} must not invent a MediaLit ID before promotion`,
        );
        assert.equal(
            target.httpsFileUrl,
            null,
            `${target.key} must not invent a runtime URL before promotion`,
        );
        assert.equal(target.uploadRequired, true);
    } else {
        assert.match(target.mediaId, /\S/, `${target.key} needs a MediaLit ID`);
        assert.match(
            target.httpsFileUrl,
            /^https:\/\//,
            `${target.key} needs a verified HTTPS URL`,
        );
        assert.equal(target.uploadRequired, false);
        const asset = sourcesByTarget.get(target.key);
        const entry = mediaByTarget.get(target.key);
        assert.ok(entry, `${target.key} has no sealed media lock`);
        assert.equal(entry.sourcePath, asset.file);
        assert.equal(entry.sha256, asset.sha256);
        assert.equal(entry.mimeType, "image/webp");
        assert.equal(
            entry.bytes,
            readFileSync(new URL(entry.sourcePath, repoRoot)).byteLength,
        );
        assert.equal(entry.media.mediaId, target.mediaId);
        assert.equal(entry.media.file, target.httpsFileUrl);
        assert.equal(entry.media.mimeType, "image/webp");
        assert.equal(entry.media.access, "public");
        assert.equal(entry.media.size, entry.bytes);
        assert.equal(
            entry.media.originalFileName,
            entry.sourcePath.split("/").at(-1),
        );
        assert.equal(
            entry.media.file,
            `https://${mediaLock.cdnHost}/p/${entry.media.mediaId}/main.webp`,
        );
        assert.equal(
            entry.media.thumbnail,
            `https://${mediaLock.cdnHost}/p/${entry.media.mediaId}/thumb.webp`,
        );
        assert.ok(entry.media.caption.trim().length >= 40);
    }
}

if (contract.status !== "source-only-awaiting-upload-and-curriculum-targets") {
    assert.equal(
        new Set(targets.map(({ mediaId }) => mediaId)).size,
        targets.length,
        "owning targets must not share MediaLit IDs",
    );
}

const diagramRequirements = {
    "tool-selection": {
        viewBox: "0 0 360 560",
        labels: [
            "What is the job?",
            "One-off question",
            "Same job, repeated",
            "Needs approved files or systems",
            "Higher consequence?",
        ],
    },
    "skill-package": {
        viewBox: "0 0 360 640",
        labels: [
            "What goes in the package",
            "One reusable skill",
            "Written context",
            "The steps, in order",
            "Two worked",
            "Checks that",
            "Source contract",
            "same standard.",
        ],
    },
    "mcp-connection": {
        viewBox: "0 0 360 660",
        labels: [
            "Three gates, three decisions",
            "You ask for something",
            "The assistant names the source",
            "Identity",
            "Scope",
            "Action",
            "Approved source",
            "Answer with its source",
            "Refused,",
            "Recorded either way",
        ],
    },
    "checked-workflow": {
        viewBox: "0 0 360 620",
        labels: [
            "How work leaves the room",
            "Brief with written context",
            "Draft",
            "Check against the sources",
            "Cite what it rests on",
            "A person decides",
            "Send back with",
            "Decision record",
            "Handover",
        ],
    },
    "behaviour-card-comparison": {
        viewBox: "0 0 360 620",
        labels: [
            "Same job. One change.",
            "Run A",
            "Run B",
            "Observed",
            "Not supported",
        ],
    },
    "context-router": {
        viewBox: "0 0 360 680",
        labels: [
            "Route context by its job",
            "Standing rule",
            "Procedure",
            "Explanation",
            "Current evidence",
            "Owner + update trigger",
        ],
    },
    "mechanism-ladder": {
        viewBox: "0 0 360 640",
        labels: [
            "Use the lowest sufficient mechanism",
            "Known choice",
            "Known sequence",
            "Bounded judgement",
            "Policy",
            "Workflow",
            "Agent",
        ],
    },
    "check-repair": {
        viewBox: "0 0 360 640",
        labels: [
            "Make the check capable of failing",
            "Weak check",
            "Plausible wrong result",
            "Repaired check",
            "Visible failure",
        ],
    },
    "decision-trace": {
        viewBox: "0 0 360 700",
        labels: [
            "Replay the decision",
            "Source",
            "Rule version",
            "Rejected alternative",
            "Decision + owner",
            "Still unproved",
        ],
    },
    "closure-states": {
        viewBox: "0 0 360 680",
        labels: [
            "Done is a claim",
            "Produced",
            "Reviewed",
            "Accepted or rejected",
            "Integrated",
            "Cleaned",
            "Fresh evidence",
        ],
    },
    "work-surface-choice": {
        viewBox: "0 0 360 660",
        labels: [
            "Choose the work surface",
            "Stay present to steer?",
            "Chat",
            "Bounded job +",
            "finish condition?",
            "Delegated work",
            "Person-only",
        ],
    },
    "claim-argument-map": {
        viewBox: "0 0 360 700",
        labels: [
            "Research before you draft",
            "Approved source",
            "Claim + status",
            "Counterargument",
            "Open gap",
            "Decision",
        ],
    },
    "authority-sequence": {
        viewBox: "0 0 360 680",
        labels: [
            "Authority is a sequence",
            "Inspect",
            "Propose",
            "Approve exact action",
            "Act",
            "Verify external state",
            "No approval",
        ],
    },
    "capstone-loop": {
        viewBox: "0 0 360 700",
        labels: [
            "One fresh run",
            "Brief + source contract",
            "Checks + evidence",
            "Decision + handover",
            "Miss",
            "One setup change",
            "Run again",
        ],
    },
};

const pedagogyDiagramIds = [
    "behaviour-card-comparison",
    "context-router",
    "mechanism-ladder",
    "check-repair",
    "decision-trace",
    "closure-states",
    "work-surface-choice",
    "claim-argument-map",
    "authority-sequence",
    "capstone-loop",
];
for (const id of pedagogyDiagramIds) {
    const source = `content/site/ai-work-school/assets/diagram-${id}.svg`;
    assert.ok(
        existsSync(new URL(source, repoRoot)),
        `${id} SVG source is missing`,
    );
}

const actionColours = /#(?:7a1b2b|5f1421|c8394f|b92d43)\b/i;
for (const diagram of contract.diagrams) {
    assert.equal(diagram.implementation, "deterministic-labelled-svg");
    assert.match(
        diagram.sourceSvg,
        /^content\/site\/ai-work-school\/assets\/diagram-[a-z0-9-]+\.svg$/,
    );
    const svg = readFileSync(new URL(diagram.sourceSvg, repoRoot), "utf8");
    assert.equal(
        hash(Buffer.from(svg)),
        diagram.svgSha256,
        `${diagram.id} SVG source hash changed`,
    );
    assert.match(diagram.webpSha256, /^[a-f0-9]{64}$/);
    assert.match(svg, /<svg[^>]+role="img"[^>]+aria-labelledby="title desc"/);
    assert.match(svg, /<title id="title">[^<]+<\/title>/);
    assert.match(svg, /<desc id="desc">[^<]+<\/desc>/);
    assert.match(svg, /@font-face[^}]+font-family: "Roboto Slab"/);
    assert.match(svg, /@font-face[^}]+font-family: "Mulish"/);
    assert.doesNotMatch(svg, /font-family(?:=|:)\s*["']?(?:Arial|Georgia)\b/i);
    assert.doesNotMatch(
        svg,
        /font-size(?:=|:)\s*["']?(?:[0-9]|1[01])(?![0-9])(?:px)?["']?/i,
    );
    const classFontSizes = new Map(
        [
            ...svg.matchAll(/\.([a-z][\w-]*)\s*\{[^}]*font-size:\s*(\d+)px/gi),
        ].map(([, className, fontSize]) => [className, Number(fontSize)]),
    );
    const textNodes = [...svg.matchAll(/<text\b([^>]*)>/g)];
    assert.ok(textNodes.length > 0, `${diagram.id} has no text nodes`);
    for (const [index, [, attributes]] of textNodes.entries()) {
        const inlineFontSize = attributes.match(
            /(?:font-size=["']|font-size:\s*)(\d+)(?:px)?/i,
        )?.[1];
        const classes =
            attributes
                .match(/class=["']([^"']+)["']/)?.[1]
                .split(/\s+/)
                .filter(Boolean) ?? [];
        const classFontSize = classes
            .map((className) => classFontSizes.get(className))
            .find((fontSize) => fontSize !== undefined);
        const fontSize = Number(inlineFontSize ?? classFontSize);
        assert.ok(
            Number.isFinite(fontSize),
            `${diagram.id} text node ${index + 1} has no checked font size`,
        );
        const renderedMobileSize =
            fontSize *
            ((contract.diagramRender.minimumMobileViewport -
                contract.diagramRender.lessonHorizontalPadding) /
                360);
        assert.ok(
            renderedMobileSize >= contract.diagramRender.minimumRenderedLabelPx,
            `${diagram.id} text node ${index + 1} renders at ${renderedMobileSize}px on the minimum mobile viewport`,
        );
    }
    assert.doesNotMatch(
        svg,
        actionColours,
        `${diagram.id} must not use the action colour`,
    );
    const requirement = diagramRequirements[diagram.id];
    assert.ok(requirement, `${diagram.id} has no reviewed diagram contract`);
    assert.match(svg, new RegExp(`viewBox="${requirement.viewBox}"`));
    for (const label of requirement.labels) {
        assert.ok(
            svg.includes(label),
            `${diagram.id} is missing label: ${label}`,
        );
    }
}

assert.deepEqual(contract.diagramRender, {
    brandFontSources: [
        "content/site/ai-work-school/assets/fonts/RobotoSlab-Medium.ttf",
        "content/site/ai-work-school/assets/fonts/Mulish-Regular.ttf",
        "content/site/ai-work-school/assets/fonts/Mulish-SemiBold.ttf",
    ],
    brandFontSha256: {
        "Roboto Slab Medium":
            "84836bee027a67ffbc137f8f67269af4824163259b0de4bf90d30b412e67f07e",
        "Mulish Regular":
            "183033a00c28957e0c658124fe1a3e74cccd762d5e86ae48126b6bf12c8eaee6",
        "Mulish SemiBold":
            "a1d0dad6d74e5ab8f8722f0e00067c5fc0d69d636c56ea4fa0d98f35706f74f6",
    },
    brandFontProvenance: {
        "Roboto Slab Medium":
            "https://raw.githubusercontent.com/googlefonts/robotoslab/main/fonts/ttf/RobotoSlab-Medium.ttf",
        "Mulish Regular":
            "https://raw.githubusercontent.com/googlefonts/mulish/main/fonts/ttf/Mulish-Regular.ttf",
        "Mulish SemiBold":
            "https://raw.githubusercontent.com/googlefonts/mulish/main/fonts/ttf/Mulish-SemiBold.ttf",
    },
    outputWidth: 720,
    commands: [
        "node content/site/ai-work-school/render-diagrams.mjs --write",
        "node content/site/ai-work-school/render-diagrams.mjs --check",
    ],
    toolVersions: { "@resvg/resvg-js": "2.6.2", cwebp: "1.6.0" },
    fontProbe: {
        diagramId: "mechanism-ladder",
        method: "isolated missing-font child render must differ",
    },
    minimumMobileViewport: 320,
    lessonHorizontalPadding: 32,
    minimumRenderedLabelPx: 12,
});
assert.equal(
    packageJson.devDependencies["@resvg/resvg-js"],
    contract.diagramRender.toolVersions["@resvg/resvg-js"],
    "diagram renderer dependency is not pinned",
);
const fontNames = ["Roboto Slab Medium", "Mulish Regular", "Mulish SemiBold"];
for (const [index, font] of contract.diagramRender.brandFontSources.entries()) {
    const bytes = readFileSync(new URL(font, repoRoot));
    assert.ok(
        bytes.byteLength > 20_000,
        `${font} is not the reviewed brand font`,
    );
    assert.equal(
        hash(bytes),
        contract.diagramRender.brandFontSha256[fontNames[index]],
        `${font} hash changed`,
    );
}

console.log(
    `AI Work School asset checks passed: ${sources.length} sources, ${targets.length} owning targets`,
);

function hash(bytes) {
    return createHash("sha256").update(bytes).digest("hex");
}
