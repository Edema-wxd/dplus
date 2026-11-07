/**
 * One-off: copies every UploadThing file the database points at into
 * UPLOADS_DIR and rewrites the rows to the new URLs and keys.
 *
 *   DATABASE_URL=… UPLOADS_DIR=~/public_html/uploads \
 *   NEXT_PUBLIC_SITE_URL=https://www.de-signplus.com node scripts/migrate-uploadthing.mjs [--dry-run]
 *
 * Plain JavaScript so it runs on the server with only production dependencies.
 * Safe to re-run: rows already pointing at /uploads are left alone. Leave the
 * UploadThing account alone until the site has been checked; this never
 * deletes anything there.
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import pg from "pg";

const dryRun = process.argv.includes("--dry-run");
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.de-signplus.com").replace(/\/$/, "");
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || "uploads");

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
  "application/postscript": "eps",
  "application/illustrator": "ai",
};

const isUploadThingUrl = (url) => {
  try {
    const { hostname } = new URL(url);
    return hostname === "utfs.io" || hostname === "ufs.sh" || hostname.endsWith(".ufs.sh");
  } catch {
    return false;
  }
};

let copied = 0;

/** Downloads one file and saves it the way src/lib/uploads.ts would. */
async function copy(url, slot) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  const ext = EXTENSIONS[type];
  if (!ext) throw new Error(`${url}: unexpected content type "${type}"`);
  const data = new Uint8Array(await res.arrayBuffer());

  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const key = `${slot}/${now.getUTCFullYear()}/${month}/${randomUUID()}.${ext}`;
  if (!dryRun) {
    const dest = path.join(UPLOADS_DIR, key);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, data);
  }
  copied++;
  console.log(`  ${url} → ${key} (${Math.round(data.byteLength / 1024)} KB)`);
  return { url: `${SITE_URL}/uploads/${key}`, key };
}

/** Pages: [{ url, key, alt }]; the PDF sits in its own columns. */
async function migrateDocuments(client, table, pageSlot, pdfSlot) {
  const { rows } = await client.query(`select id, slug, pages, pdf_url from ${table} order by id`);
  for (const row of rows) {
    let changed = false;
    const pages = [];
    for (const page of row.pages) {
      if (isUploadThingUrl(page.url)) {
        pages.push({ ...page, ...(await copy(page.url, pageSlot)) });
        changed = true;
      } else pages.push(page);
    }
    let pdf = null;
    if (row.pdf_url && isUploadThingUrl(row.pdf_url)) pdf = await copy(row.pdf_url, pdfSlot);
    if (!changed && !pdf) continue;

    console.log(`${table} #${row.id} (${row.slug}): ${pages.length} pages${pdf ? " + PDF" : ""}`);
    if (dryRun) continue;
    await client.query(
      `update ${table} set pages = $2::jsonb, pdf_url = coalesce($3, pdf_url),
         pdf_key = coalesce($4, pdf_key), updated_at = now() where id = $1`,
      [row.id, JSON.stringify(pages), pdf?.url ?? null, pdf?.key ?? null]
    );
  }
}

/** Order lines: items[].artwork = [{ url, key, name }]. */
async function migrateOrders(client) {
  const { rows } = await client.query("select id, items from orders order by id");
  for (const row of rows) {
    let changed = false;
    for (const item of row.items) {
      for (const [i, file] of (item.artwork ?? []).entries()) {
        if (!isUploadThingUrl(file.url)) continue;
        item.artwork[i] = { ...file, ...(await copy(file.url, "customerArtwork")) };
        changed = true;
      }
    }
    if (!changed) continue;
    console.log(`order #${row.id}: artwork copied`);
    if (!dryRun) {
      await client.query("update orders set items = $2::jsonb where id = $1", [
        row.id,
        JSON.stringify(row.items),
      ]);
    }
  }
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  console.log(`${dryRun ? "Dry run: " : ""}copying into ${UPLOADS_DIR}, served at ${SITE_URL}/uploads`);
  await migrateDocuments(client, "brochures", "brochurePage", "brochurePdf");
  await migrateDocuments(client, "hampers", "hamperPage", "hamperPdf");
  await migrateOrders(client);
  console.log(`Done: ${copied} file${copied === 1 ? "" : "s"} ${dryRun ? "would be " : ""}copied.`);
} finally {
  await client.end();
}
