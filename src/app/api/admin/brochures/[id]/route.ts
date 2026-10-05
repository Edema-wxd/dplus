import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  deleteBrochure,
  getBrochureById,
  updateBrochure,
  type UpdateBrochureInput,
} from "@/lib/brochures";
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

  const existing = await getBrochureById(id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const patch: UpdateBrochureInput = {};

  if (body.name !== undefined) patch.name = String(body.name).trim();
  if (body.edition !== undefined) patch.edition = body.edition || null;
  if (body.description !== undefined)
    patch.description = body.description || null;
  if (body.pageRatio !== undefined) patch.pageRatio = Number(body.pageRatio);
  if (body.pages !== undefined) patch.pages = body.pages;
  if (body.pdfUrl !== undefined) patch.pdfUrl = body.pdfUrl || null;
  if (body.pdfKey !== undefined) patch.pdfKey = body.pdfKey || null;
  if (body.pdfSizeBytes !== undefined) patch.pdfSizeBytes = body.pdfSizeBytes;
  if (body.pdfPageCount !== undefined) patch.pdfPageCount = body.pdfPageCount;
  if (body.isPublished !== undefined)
    patch.isPublished = Boolean(body.isPublished);
  if (body.sortOrder !== undefined) patch.sortOrder = Number(body.sortOrder);

  if (patch.name === "") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Files dropped from the brochure are removed from UploadThing too, so the
  // account doesn't fill with orphans.
  const orphans: string[] = [];
  if (patch.pages) {
    const kept = new Set(patch.pages.map((p) => p.key));
    orphans.push(...existing.pages.map((p) => p.key).filter((k) => k && !kept.has(k)));
  }
  if (patch.pdfKey !== undefined && existing.pdfKey && patch.pdfKey !== existing.pdfKey) {
    orphans.push(existing.pdfKey);
  }

  const brochure = await updateBrochure(id, patch);
  if (orphans.length) await deleteUploadedFiles(orphans);

  return NextResponse.json(brochure);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = await parseId(ctx);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const removed = await deleteBrochure(id);
  if (!removed)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteUploadedFiles([
    ...removed.pages.map((p) => p.key),
    ...(removed.pdfKey ? [removed.pdfKey] : []),
  ]);

  return NextResponse.json({ ok: true });
}
