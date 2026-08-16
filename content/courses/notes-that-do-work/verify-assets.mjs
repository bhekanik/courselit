import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const courseDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(courseDir, "../../..");
const contract = JSON.parse(
    readFileSync(resolve(courseDir, "asset-contracts.json"), "utf8"),
);
const mediaLock = JSON.parse(
    readFileSync(resolve(courseDir, "media.json"), "utf8"),
);
const manifest = JSON.parse(
    readFileSync(resolve(courseDir, "course.json"), "utf8"),
);

const hash = (path) =>
    createHash("sha256")
        .update(readFileSync(resolve(repoRoot, path)))
        .digest("hex");
const dimensions = (path) =>
    execFileSync("identify", ["-format", "%wx%h", resolve(repoRoot, path)], {
        encoding: "utf8",
    }).trim();
const textOf = (node) =>
    !node || typeof node !== "object"
        ? ""
        : [node.text ?? "", ...(node.content ?? []).map(textOf)]
              .join(" ")
              .replaceAll(/\s+/g, " ")
              .trim();

assert.equal(contract.schemaVersion, 1);
assert.equal(contract.status, "resolved");
assert.equal(contract.diagrams.length, 12);
assert.equal(contract.screenshots.length, 2);
assert.equal(mediaLock.schemaVersion, 1);
assert.equal(mediaLock.group, "notes-that-do-work-v2");
assert.equal(mediaLock.cdnHost, "media.bhekani.com");
assert.equal(mediaLock.entries.length, 15);

const mediaByKey = new Map(
    mediaLock.entries.map((entry) => [entry.key, entry]),
);
assert.equal(mediaByKey.size, 15);
assert.equal(
    new Set(mediaLock.entries.map((entry) => entry.media.mediaId)).size,
    15,
    "each owning target needs a distinct MediaLit ID",
);

const featured = contract.featuredImage;
const featuredLock = mediaByKey.get(featured.id);
assert.ok(featuredLock, "featured media lock is missing");
assert.equal(hash(featured.source), featured.sha256);
assert.equal(statSync(resolve(repoRoot, featured.source)).size, featured.bytes);
assert.equal(
    dimensions(featured.source),
    `${featured.width}x${featured.height}`,
);
assert.equal(featuredLock.sha256, featured.sha256);
assert.equal(featuredLock.bytes, featured.bytes);
assert.deepEqual(manifest.course.featuredImage, featuredLock.media);
assert.ok(featured.alt.length >= 80);
assert.ok(featured.prompt.length >= 160);

const lessonByKey = new Map(
    manifest.course.sections.flatMap((section) =>
        section.lessons.map((lesson) => [lesson.key, lesson]),
    ),
);

for (const diagram of contract.diagrams) {
    const svgPath = resolve(repoRoot, diagram.sourceSvg);
    const svg = readFileSync(svgPath, "utf8");
    assert.equal(
        hash(diagram.sourceSvg),
        diagram.svgSha256,
        `${diagram.id} SVG hash`,
    );
    assert.equal(
        hash(diagram.sourceWebp),
        diagram.webpSha256,
        `${diagram.id} WebP hash`,
    );
    assert.equal(
        dimensions(diagram.sourceWebp),
        `${diagram.width}x${diagram.height}`,
        `${diagram.id} dimensions`,
    );
    assert.match(svg, /<title id="title">[^<]+<\/title>/);
    assert.match(svg, /<desc id="desc">[^<]+<\/desc>/);
    const [, viewBoxWidth] = svg.match(/viewBox="0 0 (\d+) \d+"/) ?? [];
    assert.ok(viewBoxWidth, `${diagram.id} has a numeric viewBox`);
    const declaredSizes = [
        ...svg.matchAll(/font-size(?::|=")\s*([0-9.]+)/g),
    ].map(([, size]) => Number(size));
    assert.ok(declaredSizes.length > 0, `${diagram.id} declares text sizes`);
    for (const size of declaredSizes) {
        assert.ok(
            size >= 15,
            `${diagram.id} declares ${size}px text below the source floor`,
        );
        const mobileSize =
            size *
            ((contract.diagramRender.minimumMobileViewport -
                contract.diagramRender.lessonHorizontalPadding) /
                Number(viewBoxWidth));
        assert.ok(
            mobileSize >= contract.diagramRender.minimumRenderedLabelPx,
            `${diagram.id} renders ${mobileSize}px text on the minimum viewport`,
        );
    }

    const lock = mediaByKey.get(diagram.id);
    assert.ok(lock, `${diagram.id} media lock is missing`);
    assert.equal(lock.sourcePath, diagram.sourceWebp);
    assert.equal(lock.sha256, diagram.webpSha256);
    assert.equal(
        lock.bytes,
        statSync(resolve(repoRoot, diagram.sourceWebp)).size,
    );
    assert.equal(lock.mimeType, "image/webp");
    assert.equal(lock.media.size, lock.bytes);
    assert.equal(lock.media.caption, diagram.caption);
    assert.equal(lock.media.access, "public");
    assert.equal(lock.media.mimeType, "image/webp");
    assert.equal(
        lock.media.file,
        `https://media.bhekani.com/p/${lock.media.mediaId}/main.webp`,
    );
    assert.equal(
        lock.media.thumbnail,
        `https://media.bhekani.com/p/${lock.media.mediaId}/thumb.webp`,
    );
    assert.doesNotMatch(lock.media.file, /[?#]/);

    const lesson = lessonByKey.get(diagram.lessonKey);
    assert.ok(lesson, `${diagram.id} target lesson exists`);
    const nodes = lesson.content.content;
    const imageIndexes = nodes.flatMap((node, index) =>
        node.type === "image" && node.attrs?.src === lock.media.file
            ? [index]
            : [],
    );
    assert.equal(
        imageIndexes.length,
        1,
        `${diagram.lessonKey} has the expected teaching image once`,
    );
    const imageIndex = imageIndexes[0];
    const image = nodes[imageIndex];
    assert.equal(image.attrs.src, lock.media.file);
    assert.equal(image.attrs.alt, diagram.alt);
    assert.ok(image.attrs.title.length >= 30);
    assert.equal(textOf(nodes[imageIndex + 1]), diagram.caption);
    const anchorIndex = nodes.findIndex(
        (node) =>
            node.type === "heading" && textOf(node) === diagram.anchorHeading,
    );
    assert.ok(anchorIndex >= 0, `${diagram.id} anchor heading exists`);
    assert.equal(
        imageIndex,
        diagram.placement === "before" ? anchorIndex - 2 : anchorIndex + 1,
        `${diagram.id} is beside its teaching anchor`,
    );
}

for (const screenshot of contract.screenshots) {
    assert.equal(hash(screenshot.sourceWebp), screenshot.webpSha256);
    assert.equal(
        statSync(resolve(repoRoot, screenshot.sourceWebp)).size,
        screenshot.bytes,
    );
    assert.equal(
        dimensions(screenshot.sourceWebp),
        `${screenshot.width}x${screenshot.height}`,
    );
    assert.match(screenshot.officialPageUrl, /^https:\/\//);
    if (screenshot.directAssetUrl) {
        assert.match(screenshot.directAssetUrl, /^https:\/\//);
    }
    assert.match(screenshot.captureDate, /^2026-08-16$/);
    assert.ok(screenshot.capture.length >= 40);

    const lock = mediaByKey.get(screenshot.id);
    assert.ok(lock, `${screenshot.id} media lock is missing`);
    assert.equal(lock.sourcePath, screenshot.sourceWebp);
    assert.equal(lock.sha256, screenshot.webpSha256);
    assert.equal(lock.bytes, screenshot.bytes);
    assert.equal(lock.media.caption, screenshot.caption);
    assert.equal(lock.media.access, "public");
    assert.equal(lock.media.mimeType, "image/webp");
    assert.equal(
        lock.media.file,
        `https://media.bhekani.com/p/${lock.media.mediaId}/main.webp`,
    );

    const lesson = lessonByKey.get(screenshot.lessonKey);
    assert.ok(lesson, `${screenshot.id} target lesson exists`);
    const nodes = lesson.content.content;
    const imageIndex = nodes.findIndex(
        (node) =>
            node.type === "image" && node.attrs?.src === lock.media.file,
    );
    assert.ok(imageIndex >= 0, `${screenshot.id} appears in its lesson`);
    assert.equal(nodes[imageIndex].attrs.alt, screenshot.alt);
    assert.equal(textOf(nodes[imageIndex + 1]), screenshot.caption);
    const anchorIndex = nodes.findIndex((node) =>
        textOf(node).startsWith(screenshot.anchorText),
    );
    assert.ok(anchorIndex >= 0, `${screenshot.id} anchor exists`);
    assert.equal(
        imageIndex,
        screenshot.placement === "before" ? anchorIndex - 2 : anchorIndex + 1,
        `${screenshot.id} is beside its practical anchor`,
    );
}

assert.deepEqual(
    [...mediaByKey.keys()].sort(),
    [
        featured.id,
        ...contract.screenshots.map(({ id }) => id),
        ...contract.diagrams.map(({ id }) => id),
    ].sort(),
);

process.stdout.write(
    `Notes course asset checks passed: ${contract.diagrams.length} diagrams, ${mediaLock.entries.length} owning targets\n`,
);
