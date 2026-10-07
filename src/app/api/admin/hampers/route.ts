import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createHamper, getHampers, slugifyHamper } from "@/lib/hampers";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(await getHampers({ includeUnpublished: true }));
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

  const slug = slugifyHamper(body.slug || name);
  if (!slug) {
    return NextResponse.json(
      { error: "Name must contain letters or numbers" },
      { status: 400 }
    );
  }

  try {
    const hamper = await createHamper({
      slug,
      name,
      tagline: body.tagline || null,
      description: body.description || null,
      leadTimeDays: body.leadTimeDays ? Number(body.leadTimeDays) : null,
      contents: Array.isArray(body.contents) ? body.contents : [],
      pageRatio: Number(body.pageRatio) || 1.414,
      pages: Array.isArray(body.pages) ? body.pages : [],
      pdfUrl: body.pdfUrl || null,
      pdfKey: body.pdfKey || null,
      pdfSizeBytes: body.pdfSizeBytes ?? null,
      pdfPageCount: body.pdfPageCount ?? null,
      faqs: Array.isArray(body.faqs) ? body.faqs : [],
      occasions: Array.isArray(body.occasions) ? body.occasions : [],
      metaTitle: body.metaTitle || null,
      metaDescription: body.metaDescription || null,
      isPublished: Boolean(body.isPublished),
      sortOrder: Number(body.sortOrder) || 0,
    });
    return NextResponse.json(hamper, { status: 201 });
  } catch (err) {
    if (err instanceof Error && /unique/i.test(err.message)) {
      return NextResponse.json(
        { error: `A hamper already uses the address "${slug}"` },
        { status: 409 }
      );
    }
    throw err;
  }
}
