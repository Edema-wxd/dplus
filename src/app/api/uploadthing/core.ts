import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { signArtworkKey } from "@/lib/artwork-token";

const f = createUploadthing();

/** Only signed-in admins may put files in the account. */
async function requireAdmin() {
  const session = await auth();
  if (!session) throw new UploadThingError("Unauthorized");
  return { userId: session.user?.email ?? "admin" };
}

const ARTWORK_UPLOADS_PER_HOUR = 30;

/**
 * Artwork uploads are open to shoppers, so cap them per IP to stop someone
 * using the account as free file hosting. Skipped when Redis isn't configured.
 */
async function limitArtworkUploads({ req, files }: { req: Request; files: readonly unknown[] }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (redis) {
    const key = `ratelimit:artwork:${ip}`;
    const count = await redis.incrby(key, files.length);
    if (count === files.length) await redis.expire(key, 60 * 60);
    if (count > ARTWORK_UPLOADS_PER_HOUR) {
      throw new UploadThingError("Too many uploads, please try again later");
    }
  }
  return { uploadedBy: ip };
}

export const uploadRouter = {
  // Logos and graphics shoppers attach to basket items for the printers.
  customerArtwork: f({
    image: { maxFileSize: "16MB", maxFileCount: 5 },
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
    "application/postscript": { maxFileSize: "16MB", maxFileCount: 5 },
  })
    .middleware(limitArtworkUploads)
    .onUploadComplete(({ file }) => ({
      url: file.ufsUrl,
      key: file.key,
      name: file.name,
      deleteToken: signArtworkKey(file.key),
    })),

  // Brochure page images, already optimised before they reach here.
  brochurePage: f({
    image: { maxFileSize: "8MB", maxFileCount: 60 },
  })
    .middleware(requireAdmin)
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl, key: file.key })),

  // Hamper presentation pages.
  hamperPage: f({
    image: { maxFileSize: "8MB", maxFileCount: 40 },
  })
    .middleware(requireAdmin)
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl, key: file.key })),

  // The hamper PDF people download.
  hamperPdf: f({
    pdf: { maxFileSize: "32MB", maxFileCount: 1 },
  })
    .middleware(requireAdmin)
    .onUploadComplete(({ file }) => ({
      url: file.ufsUrl,
      key: file.key,
      size: file.size,
    })),

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
