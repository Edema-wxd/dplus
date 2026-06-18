import { NextRequest, NextResponse } from "next/server";
import { getProducts, PAGE_SIZE, type SortOption } from "@/lib/products";

const VALID_SORTS: SortOption[] = ["name_asc", "price_asc", "price_desc", "relevance"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const brand = searchParams.get("brand") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const offset = Number(searchParams.get("offset") ?? "0") || 0;
  const rawSort = searchParams.get("sort") ?? "name_asc";
  const sort: SortOption = VALID_SORTS.includes(rawSort as SortOption)
    ? (rawSort as SortOption)
    : "name_asc";

  const { items, hasMore, total } = await getProducts({ q, brand, category, sort, offset, limit: PAGE_SIZE });

  return NextResponse.json({ items, hasMore, total });
}
