import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Resvg } from "@resvg/resvg-js";

const mode = process.argv[2];
assert.ok(
    ["--check", "--write", "--render-missing-font-probe"].includes(mode),
    "usage: node render-diagrams.mjs --check|--write",
);

const courseDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(courseDir, "../../..");
const contract = JSON.parse(
    readFileSync(resolve(courseDir, "asset-contracts.json"), "utf8"),
);
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

if (mode === "--render-missing-font-probe") {
    const output = process.argv[3];
    assert.ok(output, "missing-font probe needs an output path");
    const probe = contract.diagrams.find(
        ({ id }) => id === contract.diagramRender.fontProbeDiagramId,
    );
    assert.ok(probe, "font probe diagram is missing");
    writeFileSync(
        output,
        renderPng(readFileSync(resolve(repoRoot, probe.sourceSvg)), []),
    );
    process.exit(0);
}

const tempDir = mkdtempSync(join(tmpdir(), "notes-course-diagrams-"));
try {
    for (const diagram of contract.diagrams) {
        const svg = readFileSync(resolve(repoRoot, diagram.sourceSvg));
        const firstPng = renderPng(svg);
        const secondPng = renderPng(svg);
        assert.deepEqual(
            firstPng,
            secondPng,
            `${diagram.id} PNG render is not stable`,
        );

        const pngPath = join(tempDir, `${diagram.id}.png`);
        const firstWebp = join(tempDir, `${diagram.id}-a.webp`);
        const secondWebp = join(tempDir, `${diagram.id}-b.webp`);
        writeFileSync(pngPath, firstPng);
        for (const output of [firstWebp, secondWebp]) {
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
        const rendered = readFileSync(firstWebp);
        assert.deepEqual(
            rendered,
            readFileSync(secondWebp),
            `${diagram.id} WebP render is not stable`,
        );
        const target = resolve(repoRoot, diagram.sourceWebp);
        if (mode === "--write") {
            writeFileSync(target, rendered);
        } else {
            assert.deepEqual(
                rendered,
                readFileSync(target),
                `${diagram.id} derivative does not match source SVG`,
            );
        }
    }

    const probe = contract.diagrams.find(
        ({ id }) => id === contract.diagramRender.fontProbeDiagramId,
    );
    const missingFontProbe = join(tempDir, "missing-font-probe.png");
    execFileSync(process.execPath, [
        fileURLToPath(import.meta.url),
        "--render-missing-font-probe",
        missingFontProbe,
    ]);
    assert.notDeepEqual(
        renderPng(readFileSync(resolve(repoRoot, probe.sourceSvg))),
        readFileSync(missingFontProbe),
        "brand-font render must differ from a missing-font render",
    );
} finally {
    rmSync(tempDir, { recursive: true, force: true });
}

process.stdout.write(`Notes course diagram render ${mode.slice(2)} passed\n`);
