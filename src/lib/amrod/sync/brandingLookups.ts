import { pool } from "@/lib/db";
import { amrodFetch } from "@/lib/amrod/auth";
import { batchUpsert } from "@/lib/amrod/sync/batchUpsert";

type BrandingDepartment = { name: string; code: string; [k: string]: unknown };
type InclusiveBranding = { inclusiveBrandingId: number; [k: string]: unknown };
type BrandingPrice = { brandingCode: string; brandingMethod: string; [k: string]: unknown };
type ColourSwatch = { id: string; name: string; code: string; [k: string]: unknown };

export async function syncBrandingDepartments(): Promise<number> {
  const res = await amrodFetch("/api/v1/BrandingDepartments/");
  if (!res.ok) throw new Error(`BrandingDepartments sync failed: ${res.status}`);
  const items: BrandingDepartment[] = await res.json();

  await batchUpsert(
    pool,
    "branding_departments",
    ["code", "name", "data"],
    ["code"],
    ["name", "data"],
    items.map((item) => [item.code, item.name, JSON.stringify(item)])
  );
  return items.length;
}

export async function syncInclusiveBrandings(): Promise<number> {
  const res = await amrodFetch("/api/v1/InclusiveBrandings/");
  if (!res.ok) throw new Error(`InclusiveBrandings sync failed: ${res.status}`);
  const items: InclusiveBranding[] = await res.json();

  // dedupe by inclusiveBrandingId — last one wins
  const byId = new Map<string, InclusiveBranding>();
  for (const item of items) byId.set(String(item.inclusiveBrandingId), item);
  const deduped = [...byId.values()];

  await batchUpsert(
    pool,
    "inclusive_brandings",
    ["id", "data"],
    ["id"],
    ["data"],
    deduped.map((item) => [String(item.inclusiveBrandingId), JSON.stringify(item)])
  );
  return items.length;
}

export async function syncBrandingPrices(): Promise<number> {
  const res = await amrodFetch("/api/v1/BrandingPrices/");
  if (!res.ok) throw new Error(`BrandingPrices sync failed: ${res.status}`);
  const items: BrandingPrice[] = await res.json();

  await batchUpsert(
    pool,
    "branding_prices",
    ["branding_code", "branding_method", "data"],
    ["branding_code"],
    ["branding_method", "data"],
    items.map((item) => [item.brandingCode, item.brandingMethod, JSON.stringify(item)])
  );
  return items.length;
}

export async function syncColourSwatches(): Promise<number> {
  const res = await amrodFetch("/api/v1/ColourSwatches/");
  if (!res.ok) throw new Error(`ColourSwatches sync failed: ${res.status}`);
  const items: ColourSwatch[] = await res.json();

  await batchUpsert(
    pool,
    "colour_swatches",
    ["id", "group_name", "data"],
    ["id"],
    ["group_name", "data"],
    items.map((item) => [item.id, item.name, JSON.stringify(item)])
  );
  return items.length;
}
