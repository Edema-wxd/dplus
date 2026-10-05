import { UTApi } from "uploadthing/server";

/** Server-side UploadThing client. Reads UPLOADTHING_TOKEN from the env. */
export const utapi = new UTApi();

/** Deletes files from UploadThing, ignoring keys that are already gone. */
export async function deleteUploadedFiles(keys: string[]) {
  const present = keys.filter(Boolean);
  if (!present.length) return;
  await utapi.deleteFiles(present);
}
