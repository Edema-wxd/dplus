import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  UPLOAD_KEY_PATTERN,
  UPLOADS_URL,
  type UploadedFile,
  type UploadSlotName,
} from "@/lib/upload-slots";

/**
 * Uploaded files live on the server's disk. In production UPLOADS_DIR is
 * `public_html/uploads`, which the web server serves directly at /uploads;
 * locally they land in ./uploads and src/app/uploads serves them.
 */
function filePath(key: string) {
  if (!UPLOAD_KEY_PATTERN.test(key)) throw new Error(`Invalid upload key: ${key}`);
  return path.join(path.resolve(process.env.UPLOADS_DIR || "uploads"), key);
}

/** Saves one file under a fresh key and returns where it can be fetched. */
export async function saveUpload(
  slot: UploadSlotName,
  data: Uint8Array,
  ext: string,
  name: string
): Promise<UploadedFile> {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const key = `${slot}/${now.getUTCFullYear()}/${month}/${randomUUID()}.${ext}`;
  const dest = filePath(key);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, data);
  return { url: `${UPLOADS_URL}/${key}`, key, name, size: data.byteLength };
}

/** Reads a stored file, or returns null if the key is invalid or gone. */
export async function readUpload(key: string): Promise<Buffer | null> {
  if (!UPLOAD_KEY_PATTERN.test(key)) return null;
  return readFile(filePath(key)).catch(() => null);
}

/** Deletes stored files, ignoring keys that are already gone or not ours. */
export async function deleteUploadedFiles(keys: string[]) {
  const ours = keys.filter((k) => UPLOAD_KEY_PATTERN.test(k));
  await Promise.all(ours.map((k) => rm(filePath(k), { force: true })));
}
