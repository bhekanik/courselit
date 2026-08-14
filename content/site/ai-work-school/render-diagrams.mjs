import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Resvg } from "@resvg/resvg-js";

const mode = process.argv[2];
assert.ok(
    mode === "--check" ||
        mode === "--write" ||
        mode === "--render-missing-font-probe",
    "usage: node render-diagrams.mjs --check|--write",
);

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contractPath = resolve(
    repoRoot,
    "content/site/ai-work-school/asset-contracts.json",
);
const contract = JSON.parse(readFileSync(contractPath, "utf8"));
const tempDir =
    mode === "--render-missing-font-probe"
        ? ""
        : mkdtempSync(join(tmpdir(), "aiws-diagram-render-"));
const fontFiles = contract.diagramRender.brandFontSources.map((source) =>
    resolve(repoRoot, source),
);

function renderPng(svg, fonts = fontFiles) {
    return new Resvg(svg, {
        background: "#F7F8F8",
        fitTo: { mode: "width", value: contract.diagramRender.outputWidth },
        font: {
            fontFiles: fonts,
            loadSystemFonts: false,
            defaultFontFamily: "Mulish",
            serifFamily: "Roboto Slab",
            sansSerifFamily: "Mulish",
        },
        shapeRendering: 2,
        textRendering: 2,
    })
        .render()
        .asPng();
}

function renderWebp(svg, tempDir, name) {
    const firstPng = renderPng(svg);
    const secondPng = renderPng(svg);
    assert.deepEqual(firstPng, secondPng, `${name} PNG render is not stable`);

    const pngPath = join(tempDir, `${name}.png`);
    const firstWebpPath = join(tempDir, `${name}-a.webp`);
    const secondWebpPath = join(tempDir, `${name}-b.webp`);
    writeFileSync(pngPath, firstPng);
    for (const output of [firstWebpPath, secondWebpPath]) {
        execFileSync("cwebp", [
            "-quiet",
            "-q",
            "92",
            "-metadata",
            "none",
            pngPath,
            "-o",
            output,
        ]);
    }
    const firstWebp = readFileSync(firstWebpPath);
    const secondWebp = readFileSync(secondWebpPath);
    assert.deepEqual(
        firstWebp,
        secondWebp,
        `${name} WebP conversion is not stable`,
    );
    return firstWebp;
}

if (mode === "--render-missing-font-probe") {
    const output = process.argv[3];
    assert.ok(output, "missing-font probe needs an output path");
    const probe = contract.diagrams.find(
        ({ id }) => id === contract.diagramRender.fontProbe.diagramId,
    );
    assert.ok(probe, "font probe diagram is missing");
    const svgWithoutFontSources = readFileSync(
        resolve(repoRoot, probe.sourceSvg),
        "utf8",
    ).replaceAll(/@font-face\s*\{[^}]+\}/g, "");
    writeFileSync(output, renderPng(svgWithoutFontSources, []));
    process.exit(0);
}

try {
    for (const diagram of contract.diagrams) {
        const svg = readFileSync(resolve(repoRoot, diagram.sourceSvg));
        const rendered = renderWebp(svg, tempDir, diagram.id);
        const target = resolve(repoRoot, diagram.sourceWebp);
        if (mode === "--write") {
            writeFileSync(target, rendered);
        } else {
            assert.deepEqual(
                rendered,
                readFileSync(target),
                `${diagram.id} derivative does not match the deterministic render`,
            );
        }
    }

    const probe = contract.diagrams.find(
        ({ id }) => id === contract.diagramRender.fontProbe.diagramId,
    );
    assert.ok(probe, "font probe diagram is missing");
    const probeSvg = readFileSync(resolve(repoRoot, probe.sourceSvg));
    const missingFontProbe = join(tempDir, "missing-font-probe.png");
    execFileSync(process.execPath, [
        fileURLToPath(import.meta.url),
        "--render-missing-font-probe",
        missingFontProbe,
    ]);
    assert.notDeepEqual(
        renderPng(probeSvg),
        readFileSync(missingFontProbe),
        "brand-font render must differ from a missing-font render",
    );
} finally {
    rmSync(tempDir, { recursive: true, force: true });
}

console.log(`AI Work School diagram render ${mode.slice(2)} passed`);
