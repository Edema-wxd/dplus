import { pool } from "@/lib/db";
import { amrodFetch } from "@/lib/amrod/auth";
import { batchUpsert } from "@/lib/amrod/sync/batchUpsert";

type AmrodStock = { simpleCode: string; fullCode: string; [k: string]: unknown };
type AmrodPrice = { simplecode: string; fullCode: string; [k: string]: unknown };

async function fetchJsonArray<T>(path: string): Promise<T[]> {
  const res = await amrodFetch(path);
  if (res.status === 204) return [];
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text);
}

export async function syncStock(updatedOnly: boolean): Promise<number> {
  const path = updatedOnly ? "/api/v1/Stock/GetUpdated" : "/api/v1/Stock/";
  const items = await fetchJsonArray<AmrodStock>(path);

  await batchUpsert(
    pool,
    "product_stock",
    ["full_code", "simple_code", "data"],
    ["full_code"],
    ["simple_code", "data"],
    items.map((item) => [item.fullCode, item.simpleCode, JSON.stringify(item)])
  );

  return items.length;
}

export async function syncPrices(updatedOnly: boolean): Promise<number> {
  const path = updatedOnly ? "/api/v1/Prices/GetUpdated" : "/api/v1/Prices/";
  const items = await fetchJsonArray<AmrodPrice>(path);

  await batchUpsert(
    pool,
    "product_prices",
    ["full_code", "simple_code", "data"],
    ["full_code"],
    ["simple_code", "data"],
    items.map((item) => [item.fullCode, item.simplecode, JSON.stringify(item)])
  );

  return items.length;
}
