import { NextRequest, NextResponse } from "next/server";
import { UPLOAD_SLOTS } from "@/lib/upload-slots";
import { readUpload } from "@/lib/uploads";

const CONTENT_TYPES: Record<string, string> = Object.fromEntries(
  Object.values(UPLOAD_SLOTS).flatMap((slot) =>
    Object.entries(slot.types).map(([type, ext]) => [ext, type])
  )
);

/**
 * Serves uploaded files. On the shared server the web server answers /uploads
 * from public_html before a request reaches Node, so this mostly runs locally.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ key: string[] }> }) {
  const key = (await ctx.params).key.join("/");
  const data = await readUpload(key);
  if (!data) return new NextResponse("Not found", { status: 404 });

  const ext = key.split(".").pop() ?? "";
  const headers: Record<string, string> = {
    "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
  // Shopper SVGs could carry scripts; never let one run on our origin. (Not on
  // everything: a sandboxed PDF won't open in Chrome's viewer.)
  if (ext === "svg") {
    headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
  }
  return new NextResponse(new Uint8Array(data), { headers });
}
