import { pool } from "@/lib/db";
import { amrodFetch } from "@/lib/amrod/auth";
import { batchUpsert } from "@/lib/amrod/sync/batchUpsert";

type AmrodCategory = {
  id: number | string;
  categoryName: string;
  categoryCode: string;
  categoryPath: string;
  categoryImage: string | null;
  order: number;
  children?: AmrodCategory[];
};

function flatten(
  categories: AmrodCategory[],
  parentId: string | null,
  out: { id: string; parentId: string | null; cat: AmrodCategory }[]
) {
  for (const cat of categories) {
    out.push({ id: String(cat.id), parentId, cat });
    if (cat.children?.length) {
      flatten(cat.children, String(cat.id), out);
    }
  }
}

export async function syncCategories(): Promise<number> {
  const res = await amrodFetch("/api/v1/Categories/");
  if (!res.ok) throw new Error(`Categories sync failed: ${res.status}`);

  const categories: AmrodCategory[] = await res.json();

  const flat: { id: string; parentId: string | null; cat: AmrodCategory }[] = [];
  flatten(categories, null, flat);

  // Pass 1: insert all rows without parent_id (avoids FK ordering issues)
  await batchUpsert(
    pool,
    "categories",
    ["id", "parent_id", "name", "path", "image_url", "data"],
    ["id"],
    ["parent_id", "name", "path", "image_url", "data"],
    flat.map(({ id, cat }) => [
      id,
      null,
      cat.categoryName,
      cat.categoryPath,
      cat.categoryImage,
      JSON.stringify(cat),
    ])
  );

  // Pass 2: set parent_id now that all rows exist
  await batchUpsert(
    pool,
    "categories",
    ["id", "parent_id", "name", "path", "image_url", "data"],
    ["id"],
    ["parent_id", "name", "path", "image_url", "data"],
    flat.map(({ id, parentId, cat }) => [
      id,
      parentId,
      cat.categoryName,
      cat.categoryPath,
      cat.categoryImage,
      JSON.stringify(cat),
    ])
  );

  return flat.length;
}
