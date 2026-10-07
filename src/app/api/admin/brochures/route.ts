import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createBrochure,
  getBrochures,
  reorderBrochures,
  slugify,
} from "@/lib/brochures";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(await getBrochures({ includeUnpublished: true }));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = slugify(body.slug || name);
  if (!slug) {
    return NextResponse.json(
      { error: "Name must contain letters or numbers" },
      { status: 400 }
    );
  }

  try {
    const brochure = await createBrochure({
      slug,
      name,
      edition: body.edition || null,
      description: body.description || null,
      pageRatio: Number(body.pageRatio) || 1.414,
      pages: Array.isArray(body.pages)
        ? body.pages.map((p: Record<string, unknown>) => ({
            url: String(p?.url ?? ""),
            key: String(p?.key ?? ""),
            alt: typeof p?.alt === "string" ? p.alt.trim() : "",
          }))
        : [],
      pdfUrl: body.pdfUrl || null,
      pdfKey: body.pdfKey || null,
      pdfSizeBytes: body.pdfSizeBytes ?? null,
      pdfPageCount: body.pdfPageCount ?? null,
      isPublished: Boolean(body.isPublished),
      sortOrder: Number(body.sortOrder) || 0,
    });
    return NextResponse.json(brochure, { status: 201 });
  } catch (err) {
    if (err instanceof Error && /unique/i.test(err.message)) {
      return NextResponse.json(
        { error: `A brochure with the address "${slug}" already exists` },
        { status: 409 }
      );
    }
    throw err;
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.ids)) {
    return NextResponse.json(
      { error: "Expected an array of brochure ids" },
      { status: 400 }
    );
  }

  const ids = body.ids
    .map((v: unknown) => Number(v))
    .filter((n: number) => Number.isInteger(n) && n > 0);

  if (ids.length !== body.ids.length) {
    return NextResponse.json({ error: "Invalid brochure id" }, { status: 400 });
  }

  return NextResponse.json(await reorderBrochures(ids));
}
