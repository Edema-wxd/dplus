import { pool } from "@/lib/db";
import { amrodFetch } from "@/lib/amrod/auth";
import { batchUpsert } from "@/lib/amrod/sync/batchUpsert";

type AmrodBrand = {
  name: string;
  code: string;
  order: number;
  image: string | null;
};

export async function syncBrands(): Promise<number> {
  const res = await amrodFetch("/api/v1/Brands/");
  if (!res.ok) throw new Error(`Brands sync failed: ${res.status}`);

  const brands: AmrodBrand[] = await res.json();

  await batchUpsert(
    pool,
    "brands",
    ["code", "name", "data"],
    ["code"],
    ["name", "data"],
    brands.map((b) => [b.code, b.name, JSON.stringify(b)])
  );

  return brands.length;
}
