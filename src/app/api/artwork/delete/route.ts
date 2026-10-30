import { NextResponse } from "next/server";
import { verifyArtworkKey } from "@/lib/artwork-token";
import { getArtworkKeysInOrders } from "@/lib/orders";
import { deleteUploadedFiles } from "@/lib/uploadthing";

const MAX_FILES = 25;

/**
 * Deletes artwork a shopper removed from their basket. Each file needs the
 * delete token its upload returned, and files already attached to a submitted
 * order are kept whatever the token says.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const files: unknown = body?.files;

  if (!Array.isArray(files) || files.length === 0 || files.length > MAX_FILES) {
    return NextResponse.json({ error: `files must be 1-${MAX_FILES} items` }, { status: 400 });
  }

  const keys: string[] = [];
  for (const f of files) {
    const key = typeof f?.key === "string" ? f.key : "";
    const token = typeof f?.token === "string" ? f.token : "";
    if (!key || !token || !verifyArtworkKey(key, token)) {
      return NextResponse.json({ error: "Invalid file or token" }, { status: 403 });
    }
    keys.push(key);
  }

  const inOrders = await getArtworkKeysInOrders(keys);
  const deletable = keys.filter((k) => !inOrders.has(k));
  await deleteUploadedFiles(deletable);

  return NextResponse.json({ deleted: deletable.length, kept: keys.length - deletable.length });
}
