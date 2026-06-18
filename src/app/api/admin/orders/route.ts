import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrders } from "@/lib/orders";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;
  const limit = Number(searchParams.get("limit") ?? "20");
  const offset = Number(searchParams.get("offset") ?? "0");

  const result = await getOrders({ status, search, limit, offset });
  return NextResponse.json(result);
}
