#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const root = new URL("./", import.meta.url);
const repoRoot = new URL("../../../", root);
const contract = JSON.parse(
    readFileSync(new URL("asset-contracts.json", root), "utf8"),
);
const mediaLock = JSON.parse(readFileSync(new URL("media.json", root), "utf8"));

assert.equal(contract.schemaVersion, 1);
assert.equal(contract.sourceRasterCount, contract.rasters.length);
assert.equal(contract.diagramSourceCount, contract.diagrams.length);

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
assert.equal(mediaLock.group, "ai-work-school-v2");
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
};

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
        "apps/web/public/fonts/roboto-slab/roboto-slab-latin-variable.woff2",
        "apps/web/public/fonts/mulish/mulish-latin-variable.woff2",
    ],
    outputWidth: 720,
    commands: [
        "sips -s format png {sourceSvg} --out {tempPng}",
        "sips --resampleWidth 720 {tempPng} --out {tempPng2x}",
        "cwebp -quiet -q 92 -metadata none {tempPng2x} -o {sourceWebp}",
    ],
    toolVersions: { sips: "316", cwebp: "1.6.0" },
});
for (const font of contract.diagramRender.brandFontSources) {
    assert.ok(
        readFileSync(new URL(font, repoRoot)).byteLength > 20_000,
        `${font} is not the reviewed brand font`,
    );
}

console.log(
    `AI Work School asset checks passed: ${sources.length} sources, ${targets.length} owning targets`,
);

function hash(bytes) {
    return createHash("sha256").update(bytes).digest("hex");
}
