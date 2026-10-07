import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  deleteHamper,
  getHamperById,
  slugifyHamper,
  updateHamper,
  type UpdateHamperInput,
} from "@/lib/hampers";
import { deleteUploadedFiles } from "@/lib/uploadthing";

type Ctx = { params: Promise<{ id: string }> };

async function parseId(ctx: Ctx) {
  const { id } = await ctx.params;
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = await parseId(ctx);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await getHamperById(id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const patch: UpdateHamperInput = {};

  if (body.name !== undefined) patch.name = String(body.name).trim();
  // Changing the slug changes a published URL, so it is deliberate and checked.
  if (body.slug !== undefined) patch.slug = slugifyHamper(String(body.slug));
  if (body.tagline !== undefined) patch.tagline = body.tagline || null;
  if (body.description !== undefined) patch.description = body.description || null;
  if (body.leadTimeDays !== undefined)
    patch.leadTimeDays = body.leadTimeDays ? Number(body.leadTimeDays) : null;
  if (body.contents !== undefined) patch.contents = body.contents;
  if (body.pageRatio !== undefined) patch.pageRatio = Number(body.pageRatio) || 1.414;
  if (body.pages !== undefined) patch.pages = body.pages;
  if (body.pdfUrl !== undefined) patch.pdfUrl = body.pdfUrl || null;
  if (body.pdfKey !== undefined) patch.pdfKey = body.pdfKey || null;
  if (body.pdfSizeBytes !== undefined) patch.pdfSizeBytes = body.pdfSizeBytes;
  if (body.pdfPageCount !== undefined) patch.pdfPageCount = body.pdfPageCount;
  if (body.faqs !== undefined) patch.faqs = body.faqs;
  if (body.occasions !== undefined) patch.occasions = body.occasions;
  if (body.metaTitle !== undefined) patch.metaTitle = body.metaTitle || null;
  if (body.metaDescription !== undefined)
    patch.metaDescription = body.metaDescription || null;
  if (body.isPublished !== undefined) patch.isPublished = Boolean(body.isPublished);
  if (body.sortOrder !== undefined) patch.sortOrder = Number(body.sortOrder) || 0;

  if (patch.name === "") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (patch.slug === "") {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  // Files dropped from the hamper leave UploadThing too.
  const orphans: string[] = [];
  if (patch.pages) {
    const kept = new Set(patch.pages.map((p) => p.key));
    orphans.push(
      ...existing.pages.map((p) => p.key).filter((k) => k && !kept.has(k))
    );
  }
  if (patch.pdfKey !== undefined && existing.pdfKey && patch.pdfKey !== existing.pdfKey) {
    orphans.push(existing.pdfKey);
  }

  try {
    const hamper = await updateHamper(id, patch);
    if (orphans.length) await deleteUploadedFiles(orphans);
    return NextResponse.json(hamper);
  } catch (err) {
    if (err instanceof Error && /unique/i.test(err.message)) {
      return NextResponse.json(
        { error: "Another hamper already uses that address" },
        { status: 409 }
      );
    }
    throw err;
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = await parseId(ctx);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const removed = await deleteHamper(id);
  if (!removed)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteUploadedFiles([
    ...removed.pages.map((p) => p.key),
    ...(removed.pdfKey ? [removed.pdfKey] : []),
  ]);
  return NextResponse.json({ ok: true });
}
