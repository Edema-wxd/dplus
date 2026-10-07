import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteUploadedFiles } from "@/lib/uploadthing";

/**
 * Drops files from UploadThing by key. Used when an editor uploads pages and
 * then abandons the edit, so the account doesn't fill with files no row owns.
 */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const keys = Array.isArray(body?.keys)
    ? body.keys.filter((k: unknown): k is string => typeof k === "string" && !!k)
    : [];

  if (!keys.length) return NextResponse.json({ ok: true, deleted: 0 });

  await deleteUploadedFiles(keys);
  return NextResponse.json({ ok: true, deleted: keys.length });
}
