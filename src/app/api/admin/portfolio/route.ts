import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPortfolioItems, createPortfolioItem } from "@/lib/portfolio";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await getPortfolioItems({ includeUnpublished: true });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, client, description, tags, images, isPublished } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const item = await createPortfolioItem({ title, client, description, tags, images, isPublished });
  return NextResponse.json(item, { status: 201 });
}
