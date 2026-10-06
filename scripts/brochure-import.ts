/**
 * Optimises a folder of brochure page images, uploads them (and the PDF) to
 * UploadThing, and writes the brochure row.
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
  if (!dryRun && !process.env.UPLOADTHING_TOKEN) {
    console.error("UPLOADTHING_TOKEN is not set in .env.local");
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
    console.log("\nDry run — nothing uploaded, nothing written.");
    process.exit(0);
  }

  // ── upload ──────────────────────────────────────────────
  const { UTApi, UTFile } = await import("uploadthing/server");
  const utapi = new UTApi();

  // Uploaded a few at a time, with retries: sending two dozen at once makes the
  // ingest endpoint drop connections, and a half-finished run leaves orphans.
  const uploaded: { url: string; key: string; alt: string }[] = [];

  async function uploadOne(file: { name: string; data: Buffer }, type: string) {
    let lastError = "unknown error";
    for (let attempt = 1; attempt <= 3; attempt++) {
      const result = await utapi.uploadFiles(
        new UTFile([new Uint8Array(file.data)], file.name, { type })
      );
      if (!result.error && result.data) return result.data;
      lastError = result.error?.message ?? lastError;
      if (attempt < 3) {
        console.log(`  retrying ${file.name} (attempt ${attempt + 1})`);
        await new Promise((r) => setTimeout(r, attempt * 1500));
      }
    }
    throw new Error(`Upload failed for ${file.name}: ${lastError}`);
  }

  /** Removes everything this run put in the account, so a failure leaves none. */
  async function rollback() {
    const keys = uploaded.map((p) => p.key);
    if (!keys.length) return;
    console.error(`Removing ${keys.length} files uploaded by this run…`);
    try {
      await utapi.deleteFiles(keys);
    } catch {
      console.error("Could not remove them — check the UploadThing dashboard.");
    }
  }

  console.log("\nUploading pages to UploadThing…");
  const BATCH = 4;
  try {
    for (let i = 0; i < optimised.length; i += BATCH) {
      const batch = optimised.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map((file) => uploadOne(file, "image/webp"))
      );
      uploaded.push(
        ...results.map((data) => ({ url: data.ufsUrl, key: data.key, alt: "" }))
      );
      console.log(`  ${uploaded.length}/${optimised.length} pages`);
    }
  } catch (err) {
    await rollback();
    throw err;
  }

  const pages = [...uploaded]; // copied: `uploaded` keeps growing for rollback

  let pdfUrl: string | null = null;
  let pdfKey: string | null = null;
  if (pdfPath) {
    console.log("Uploading PDF…");
    try {
      const data = await uploadOne(
        { name: `${slug}.pdf`, data: await fs.readFile(pdfPath) },
        "application/pdf"
      );
      pdfUrl = data.ufsUrl;
      pdfKey = data.key;
      uploaded.push({ url: data.ufsUrl, key: data.key, alt: "" });
      console.log("  PDF uploaded");
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
        await utapi.deleteFiles(superseded);
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
