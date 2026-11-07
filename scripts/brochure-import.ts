/**
 * Optimises a folder of brochure page images, saves them (and the PDF) to
 * UPLOADS_DIR, and writes the brochure row.
 *
 *   npx tsx scripts/brochure-import.ts \
 *     --dir "public/brochures/corporate-christmas-2026" \
 *     --slug corporate-christmas-2026 \
 *     --name "Corporate Christmas" \
 *     --edition "Two thousand and twenty-six" \
 *     --description "..." [--publish] [--dry-run]
 *
 * Pages are ordered by filename. Re-running with the same slug replaces the
 * brochure's files and deletes the ones it supersedes.
 *
 * The files have to land where the site serves them, so run this on the server
 * (UPLOADS_DIR=~/public_html/uploads) or copy ./uploads there afterwards.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const MAX_WIDTH = 2000; // the page never displays wider than ~1720px
const WEBP_QUALITY = 80;
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|avif|tiff?)$/i;

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}
const flag = (name: string) => process.argv.includes(`--${name}`);

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Page count read from the PDF itself. */
async function countPdfPages(file: string) {
  const text = (await fs.readFile(file)).toString("latin1");
  const matches = text.match(/\/Type\s*\/Page(?!s)/g);
  return matches?.length ?? null;
}

async function main() {
  const dir = arg("dir");
  const slug = arg("slug");
  const name = arg("name");
  const dryRun = flag("dry-run");

  if (!dir || !slug || !name) {
    console.error("Usage: tsx scripts/brochure-import.ts --dir <folder> --slug <slug> --name <name> [--edition ..] [--description ..] [--publish] [--dry-run]");
    process.exit(1);
  }

  const entries = (await fs.readdir(dir)).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
  const imageFiles = entries.filter((f) => IMAGE_EXTENSIONS.test(f));
  const pdfFile = entries.find((f) => f.toLowerCase().endsWith(".pdf"));

  if (!imageFiles.length) {
    console.error(`No page images found in ${dir}`);
    process.exit(1);
  }

  // ── optimise ────────────────────────────────────────────
  console.log(`Optimising ${imageFiles.length} pages from ${dir}`);
  let beforeTotal = 0;
  let afterTotal = 0;
  let ratio: number | null = null;

  const optimised: { name: string; data: Buffer }[] = [];

  for (const [i, file] of imageFiles.entries()) {
    const source = path.join(dir, file);
    const input = await fs.readFile(source);
    beforeTotal += input.byteLength;

    const image = sharp(input).rotate();
    const meta = await image.metadata();
    if (ratio === null && meta.width && meta.height) {
      ratio = Number((meta.width / meta.height).toFixed(3));
    }

    const data = await image
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    afterTotal += data.byteLength;

    optimised.push({
      name: `${slug}-${String(i + 1).padStart(2, "0")}.webp`,
      data,
    });
    process.stdout.write(
      `  ${String(i + 1).padStart(2, "0")} ${file} → ${formatBytes(input.byteLength)} → ${formatBytes(data.byteLength)}\n`
    );
  }

  console.log(
    `Pages: ${formatBytes(beforeTotal)} → ${formatBytes(afterTotal)} ` +
      `(${Math.round((1 - afterTotal / beforeTotal) * 100)}% smaller), page shape ${ratio}`
  );

  const pdfPath = pdfFile ? path.join(dir, pdfFile) : null;
  const pdfStat = pdfPath ? await fs.stat(pdfPath) : null;
  const pdfPageCount = pdfPath ? await countPdfPages(pdfPath) : null;
  if (pdfPath) {
    console.log(`PDF: ${pdfFile} (${formatBytes(pdfStat!.size)}, ${pdfPageCount ?? "?"} pages)`);
  }

  if (dryRun) {
    console.log("\nDry run — nothing saved, nothing written.");
    process.exit(0);
  }

  // ── upload ──────────────────────────────────────────────
  const { saveUpload, deleteUploadedFiles } = await import("../src/lib/uploads");

  const uploaded: { url: string; key: string; alt: string }[] = [];

  /** Removes everything this run saved, so a failure leaves none. */
  async function rollback() {
    const keys = uploaded.map((p) => p.key);
    if (!keys.length) return;
    console.error(`Removing ${keys.length} files saved by this run…`);
    await deleteUploadedFiles(keys);
  }

  console.log("\nSaving pages…");
  try {
    for (const file of optimised) {
      const data = await saveUpload("brochurePage", file.data, "webp", file.name);
      uploaded.push({ url: data.url, key: data.key, alt: "" });
    }
    console.log(`  ${uploaded.length}/${optimised.length} pages`);
  } catch (err) {
    await rollback();
    throw err;
  }

  const pages = [...uploaded]; // copied: `uploaded` keeps growing for rollback

  let pdfUrl: string | null = null;
  let pdfKey: string | null = null;
  if (pdfPath) {
    try {
      const data = await saveUpload("brochurePdf", await fs.readFile(pdfPath), "pdf", `${slug}.pdf`);
      pdfUrl = data.url;
      pdfKey = data.key;
      uploaded.push({ url: data.url, key: data.key, alt: "" });
      console.log("  PDF saved");
    } catch (err) {
      await rollback();
      throw err;
    }
  }

  // ── write the row ───────────────────────────────────────
  const brochures = await import("../src/lib/brochures");
  const existing = (await brochures.getBrochures({ includeUnpublished: true })).find(
    (b) => b.slug === slug
  );

  const payload = {
    slug,
    name,
    edition: arg("edition") ?? null,
    description: arg("description") ?? null,
    pageRatio: ratio ?? 1.414,
    pages,
    pdfUrl,
    pdfKey,
    pdfSizeBytes: pdfStat?.size ?? null,
    pdfPageCount,
    isPublished: flag("publish"),
  };

  try {
    if (existing) {
      const superseded = [
        ...existing.pages.map((p) => p.key),
        ...(existing.pdfKey ? [existing.pdfKey] : []),
      ].filter(Boolean);

      await brochures.updateBrochure(existing.id, payload);
      if (superseded.length) {
        await deleteUploadedFiles(superseded);
        console.log(
          `Replaced brochure #${existing.id}, removed ${superseded.length} old files`
        );
      }
    } else {
      const created = await brochures.createBrochure(payload);
      console.log(`Created brochure #${created.id}`);
    }
  } catch (err) {
    await rollback();
    throw err;
  }

  console.log(
    `\nDone. ${payload.isPublished ? "Published" : "Saved as a draft"} — ` +
      `review it at /admin/brochures.`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
