import { SITE_URL } from "@/lib/seo";

/**
 * What each upload form may send. Shared by the browser (to check files before
 * sending them) and the upload route (which enforces it).
 *
 * Files are saved under the extension listed here for their type, never the
 * name the browser sent, so nothing uploaded can run as a script on the server.
 */
const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
} as const;

const MB = 1024 * 1024;

export type UploadSlot = {
  /** MIME type → saved file extension. */
  types: Record<string, string>;
  maxBytes: number;
  maxFiles: number;
  /** Admin-only slots need a signed-in session; the rest are rate limited per IP. */
  adminOnly: boolean;
};

export const UPLOAD_SLOTS = {
  // Logos and graphics shoppers attach to basket items for the printers.
  customerArtwork: {
    types: {
      ...IMAGE_TYPES,
      "image/svg+xml": "svg",
      "application/pdf": "pdf",
      "application/postscript": "eps",
      "application/illustrator": "ai",
    },
    maxBytes: 16 * MB,
    maxFiles: 5,
    adminOnly: false,
  },
  // Brochure page images, already optimised before they reach here.
  brochurePage: { types: IMAGE_TYPES, maxBytes: 8 * MB, maxFiles: 60, adminOnly: true },
  // Hamper presentation pages.
  hamperPage: { types: IMAGE_TYPES, maxBytes: 8 * MB, maxFiles: 40, adminOnly: true },
  // Portfolio project photos, sent one per request from /admin/content.
  portfolioImage: { types: IMAGE_TYPES, maxBytes: 10 * MB, maxFiles: 1, adminOnly: true },
  // The PDFs people download.
  brochurePdf: { types: { "application/pdf": "pdf" }, maxBytes: 32 * MB, maxFiles: 1, adminOnly: true },
  hamperPdf: { types: { "application/pdf": "pdf" }, maxBytes: 32 * MB, maxFiles: 1, adminOnly: true },
} satisfies Record<string, UploadSlot>;

export type UploadSlotName = keyof typeof UPLOAD_SLOTS;

export function isUploadSlotName(name: string): name is UploadSlotName {
  return Object.hasOwn(UPLOAD_SLOTS, name);
}

/** What the upload route returns for each saved file. */
export type UploadedFile = { url: string; key: string; name: string; size: number };

/** Uploaded files are served from here, straight off the web server's disk. */
export const UPLOADS_URL = `${SITE_URL}/uploads`;

/** Keys look like `brochurePage/2026/11/<uuid>.webp`. */
export const UPLOAD_KEY_PATTERN = /^[A-Za-z]+\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.[a-z0-9]+$/;

/** Artwork must be a file we stored, not an arbitrary link. */
export function isUploadedFileUrl(url: string): boolean {
  const prefix = `${UPLOADS_URL}/`;
  return url.startsWith(prefix) && UPLOAD_KEY_PATTERN.test(url.slice(prefix.length));
}
