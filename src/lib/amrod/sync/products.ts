import { streamArray } from "stream-json/streamers/stream-array.js";
import { pool } from "@/lib/db";
import { amrodFetch } from "@/lib/amrod/auth";
import { batchUpsert } from "@/lib/amrod/sync/batchUpsert";

type AmrodProduct = {
  simpleCode: string;
  fullCode: string;
  productName: string;
  brand: { code: string } | string | null;
  type: string;
  isDeleted?: boolean;
  status?: string;
  [k: string]: unknown;
};

const BATCH_SIZE = 500;

function brandCode(brand: AmrodProduct["brand"]): string | null {
  if (!brand) return null;
  if (typeof brand === "string") return brand;
  return brand.code ?? null;
}

async function upsertBatch(client: import("pg").PoolClient, products: AmrodProduct[]) {
  await batchUpsert(
    client,
    "products",
    ["simple_code", "type", "product_name", "brand_code", "data", "is_active", "last_synced_at"],
    ["simple_code"],
    ["type", "product_name", "brand_code", "data", "is_active", "last_synced_at"],
    products.map((p) => [
      p.simpleCode,
      p.type,
      p.productName,
      brandCode(p.brand),
      JSON.stringify(p),
      true,
      new Date(),
    ]),
    BATCH_SIZE,
    false
  );
}

/**
 * Full catalogue seed (large 25-100MB payload).
 * Streams the JSON array so the full response is never held in memory at once.
 */
export async function seedProducts(): Promise<number> {
  const res = await amrodFetch("/api/v1/Products/GetProductsAndBranding");
  if (!res.ok || !res.body) {
    throw new Error(`Product seed failed: ${res.status}`);
  }

  const client = await pool.connect();
  const syncStartedAt = new Date();
  let count = 0;
  let batch: AmrodProduct[] = [];

  try {
    const { readable, writable } = streamArray.withParserAsWebStream();

    const pump = res.body.pipeTo(writable);

    for await (const { value } of readable as unknown as AsyncIterable<{ value: AmrodProduct }>) {
      batch.push(value);
      count++;

      if (batch.length >= BATCH_SIZE) {
        await upsertBatch(client, batch);
        batch = [];
      }
    }

    await pump;

    if (batch.length) {
      await upsertBatch(client, batch);
    }

    // mark anything not touched in this full sync as inactive
    await client.query(`update products set is_active = false where last_synced_at < $1`, [
      syncStartedAt,
    ]);
  } finally {
    client.release();
  }

  return count;
}

/**
 * Daily delta sync — small payload, handled with plain JSON.parse.
 */
export async function syncUpdatedProducts(): Promise<number> {
  const res = await amrodFetch("/api/v1/Products/GetUpdatedProductsAndBranding");
  if (!res.ok) throw new Error(`Updated products sync failed: ${res.status}`);

  const text = await res.text();
  if (!text) return 0;

  const products: AmrodProduct[] = JSON.parse(text);
  if (!products.length) return 0;

  const deleted = products.filter((p) => p.isDeleted || p.status === "Deleted");
  const upserts = products.filter((p) => !(p.isDeleted || p.status === "Deleted"));

  const client = await pool.connect();
  try {
    if (upserts.length) {
      await upsertBatch(client, upserts);
    }
    if (deleted.length) {
      await client.query(
        `update products set is_active = false where simple_code = any($1::text[])`,
        [deleted.map((p) => p.simpleCode)]
      );
    }
  } finally {
    client.release();
  }

  return products.length;
}
