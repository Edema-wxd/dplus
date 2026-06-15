import { NextRequest, NextResponse } from "next/server";
import { getProducts, PAGE_SIZE } from "@/lib/products";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const brand = searchParams.get("brand") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const offset = Number(searchParams.get("offset") ?? "0") || 0;

  const { items, hasMore } = await getProducts({ q, brand, category, offset, limit: PAGE_SIZE });

  return NextResponse.json({ items, hasMore });
}
