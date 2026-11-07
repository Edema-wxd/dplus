import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { isUploadSlotName, UPLOAD_SLOTS, type UploadedFile } from "@/lib/upload-slots";
import { saveUpload } from "@/lib/uploads";

const ARTWORK_UPLOADS_PER_HOUR = 30;

/**
 * Artwork uploads are open to shoppers, so cap them per IP to stop someone
 * using the server as free file hosting. Skipped when Redis isn't configured.
 */
async function overArtworkLimit(req: NextRequest, count: number) {
  if (!redis) return false;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `ratelimit:artwork:${ip}`;
  const total = await redis.incrby(key, count);
  if (total === count) await redis.expire(key, 60 * 60);
  return total > ARTWORK_UPLOADS_PER_HOUR;
}

/**
 * Saves the files in a multipart `files` field for one upload slot. The
 * browser sends a few files per request (see use-upload.ts), so a 60-page
 * brochure doesn't arrive as one huge body.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ slot: string }> }) {
  const { slot: slotName } = await ctx.params;
  if (!isUploadSlotName(slotName)) {
    return NextResponse.json({ error: "Unknown upload type" }, { status: 404 });
  }
  const slot = UPLOAD_SLOTS[slotName];

  if (slot.adminOnly && !(await auth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const files = (form?.getAll("files") ?? []).filter((f): f is File => typeof f !== "string");
  if (!files.length) {
    return NextResponse.json({ error: "No files sent" }, { status: 400 });
  }
  if (files.length > slot.maxFiles) {
    return NextResponse.json({ error: `At most ${slot.maxFiles} files` }, { status: 400 });
  }

  const types: Record<string, string> = slot.types;
  for (const file of files) {
    if (!Object.hasOwn(types, file.type)) {
      return NextResponse.json({ error: `${file.name}: file type not allowed` }, { status: 400 });
    }
    if (file.size > slot.maxBytes) {
      const mb = Math.round(slot.maxBytes / 1024 / 1024);
      return NextResponse.json({ error: `${file.name} is larger than ${mb} MB` }, { status: 400 });
    }
  }

  if (!slot.adminOnly && (await overArtworkLimit(req, files.length))) {
    return NextResponse.json(
      { error: "Too many uploads, please try again later" },
      { status: 429 }
    );
  }

  const saved: UploadedFile[] = [];
  for (const file of files) {
    const data = new Uint8Array(await file.arrayBuffer());
    saved.push(await saveUpload(slotName, data, types[file.type], file.name.slice(0, 200)));
  }
  return NextResponse.json(saved);
}
