import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";

const f = createUploadthing();

/** Only signed-in admins may put files in the account. */
async function requireAdmin() {
  const session = await auth();
  if (!session) throw new UploadThingError("Unauthorized");
  return { userId: session.user?.email ?? "admin" };
}

export const uploadRouter = {
  // Brochure page images, already optimised before they reach here.
  brochurePage: f({
    image: { maxFileSize: "8MB", maxFileCount: 60 },
  })
    .middleware(requireAdmin)
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl, key: file.key })),

  // The brochure PDF people download.
  brochurePdf: f({
    pdf: { maxFileSize: "32MB", maxFileCount: 1 },
  })
    .middleware(requireAdmin)
    .onUploadComplete(({ file }) => ({
      url: file.ufsUrl,
      key: file.key,
      size: file.size,
    })),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
