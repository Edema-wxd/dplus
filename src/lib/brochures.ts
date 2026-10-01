import fs from "fs";
import path from "path";

/**
 * Brochures are file-driven: drop the page images (and the PDF) into
 * `public/brochures/<slug>/` and they appear on /brochures automatically.
 * Images are ordered by filename, so prefix them `01-`, `02-`, ...
 */
const BROCHURE_META = [
  {
    slug: "corporate-christmas-2026",
    // Trim ratio of the printed page (width / height) — A4 landscape here.
    pageRatio: 1.414,
    // Set as two stacked lines in the page head, roman over italic.
    name: "Corporate Christmas",
    edition: "Two thousand and twenty-six",
    title: "2026 Corporate Christmas Brochure",
    description:
      "Executive gift sets, hampers, branded keepsakes and custom packaging for the 2026 festive season. Every item can carry your logo, and anything here can be quoted in the quantities you need.",
  },
] as const;

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|avif)$/i;

export type Brochure = {
  slug: string;
  pageRatio: number;
  name: string;
  edition: string;
  title: string;
  description: string;
  images: string[];
  pdfUrl: string | null;
  pdfSizeLabel: string | null;
};

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function readAssets(slug: string) {
  const dir = path.join(process.cwd(), "public", "brochures", slug);

  let entries: string[] = [];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return { images: [], pdfUrl: null, pdfSizeLabel: null };
  }

  const images = entries
    .filter((file) => IMAGE_EXTENSIONS.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((file) => `/brochures/${slug}/${encodeURIComponent(file)}`);

  const pdf = entries
    .filter((file) => file.toLowerCase().endsWith(".pdf"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];

  if (!pdf) return { images, pdfUrl: null, pdfSizeLabel: null };

  let pdfSizeLabel: string | null = null;
  try {
    pdfSizeLabel = formatBytes(fs.statSync(path.join(dir, pdf)).size);
  } catch {
    pdfSizeLabel = null;
  }

  return {
    images,
    pdfUrl: `/brochures/${slug}/${encodeURIComponent(pdf)}`,
    pdfSizeLabel,
  };
}

export function getBrochures(): Brochure[] {
  return BROCHURE_META.map((meta) => ({ ...meta, ...readAssets(meta.slug) }));
}
