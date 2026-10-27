import type { BrandingPriceBreak, SelectedBranding } from "@/lib/branding-pricing";
import type { ArtworkFile } from "@/context/cart-context";
import type { OrderItem } from "@/lib/orders";

export const MAX_NOTE_LENGTH = 1000;
export const MAX_ARTWORK_FILES = 5;
const MAX_BRANDINGS = 10;

/** Artwork must live in our UploadThing app, not an arbitrary link. */
export function isUploadedFileUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return (
      protocol === "https:" &&
      (hostname === "utfs.io" || hostname.endsWith(".ufs.sh") || hostname === "ufs.sh")
    );
  } catch {
    return false;
  }
}

type Raw = Record<string, unknown>;

const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 300): string | null =>
  typeof v === "string" ? v.trim().slice(0, max) : null;
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

function parseBreak(raw: unknown): BrandingPriceBreak | null {
  if (!isObj(raw)) return null;
  const b = {
    minQuantity: num(raw.minQuantity),
    maxQuantity: num(raw.maxQuantity),
    numberOfColours: num(raw.numberOfColours),
    setup: num(raw.setup),
    price: num(raw.price),
  };
  if (Object.values(b).some((v) => v === null) || b.setup! < 0 || b.price! < 0) return null;
  return b as BrandingPriceBreak;
}

function parseBranding(raw: unknown): SelectedBranding | null {
  if (!isObj(raw) || !Array.isArray(raw.breaks)) return null;
  const positionCode = str(raw.positionCode);
  const brandingCode = str(raw.brandingCode);
  if (!positionCode || !brandingCode) return null;
  const breaks = raw.breaks.slice(0, 50).map(parseBreak);
  if (breaks.some((b) => b === null)) return null;
  return {
    positionCode,
    positionName: str(raw.positionName) || positionCode,
    brandingCode,
    brandingName: str(raw.brandingName) || brandingCode,
    colours: raw.colours == null ? null : num(raw.colours),
    breaks: breaks as BrandingPriceBreak[],
  };
}

function parseArtwork(raw: unknown): ArtworkFile | null {
  if (!isObj(raw)) return null;
  const url = str(raw.url, 2000);
  const key = str(raw.key);
  if (!url || !key || !isUploadedFileUrl(url)) return null;
  return { url, key, name: str(raw.name) || "artwork" };
}

/**
 * Validates one basket line from the client and keeps only known fields.
 * Returns an error message instead when the line can't be accepted.
 */
export function parseOrderItem(raw: unknown): OrderItem | string {
  if (!isObj(raw)) return "is not an object";

  const quantity = raw.quantity;
  if (!Number.isInteger(quantity) || (quantity as number) < 1) return "has invalid quantity";
  const price = num(raw.price);
  if (price === null || price <= 0) return "has invalid price";

  const fullCode = str(raw.fullCode);
  const productName = str(raw.productName);
  if (!fullCode || !productName) return "is missing a product code or name";

  const brandings: SelectedBranding[] = [];
  if (raw.brandings != null) {
    if (!Array.isArray(raw.brandings) || raw.brandings.length > MAX_BRANDINGS)
      return "has invalid branding";
    for (const b of raw.brandings) {
      const parsed = parseBranding(b);
      if (!parsed) return "has invalid branding";
      brandings.push(parsed);
    }
  }

  const artwork: ArtworkFile[] = [];
  if (raw.artwork != null) {
    if (!Array.isArray(raw.artwork) || raw.artwork.length > MAX_ARTWORK_FILES)
      return `can have at most ${MAX_ARTWORK_FILES} artwork files`;
    for (const a of raw.artwork) {
      const parsed = parseArtwork(a);
      if (!parsed) return "has an invalid artwork file";
      artwork.push(parsed);
    }
  }

  let note: string | undefined;
  if (raw.note != null) {
    if (typeof raw.note !== "string") return "has an invalid note";
    if (raw.note.length > MAX_NOTE_LENGTH)
      return `note is longer than ${MAX_NOTE_LENGTH} characters`;
    note = raw.note.trim() || undefined;
  }

  return {
    simpleCode: str(raw.simpleCode) || fullCode,
    fullCode,
    productName,
    image: str(raw.image, 2000),
    variantLabel: str(raw.variantLabel),
    brandingLabel: str(raw.brandingLabel),
    quantity: quantity as number,
    price,
    ...(brandings.length ? { brandings } : {}),
    ...(artwork.length ? { artwork } : {}),
    ...(note ? { note } : {}),
  };
}
