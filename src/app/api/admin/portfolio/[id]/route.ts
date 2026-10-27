import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updatePortfolioItem, deletePortfolioItem } from "@/lib/portfolio";
import { revalidatePortfolio } from "@/lib/revalidate";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  try {
    const item = await updatePortfolioItem(Number(id), body);
    revalidatePortfolio();
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deletePortfolioItem(Number(id));
  revalidatePortfolio();
  return new NextResponse(null, { status: 204 });
}
