/**
 * Branding (printing) price maths shared by the product page, the basket and
 * the orders API. Pure functions only, so it is safe to import on the client.
 *
 * Amrod's BrandingPrices endpoint gives, per branding code, a list of price
 * breaks by quantity and number of colours, each with a once-off setup fee and
 * a per-unit print price. `maxQuantity` of -1 means "and above"; a negative
 * `numberOfColours` means the method isn't priced by colour (e.g. embroidery).
 * Prices here are already converted to NGN by `calcPrice()` on the server.
 */

export type BrandingPriceBreak = {
  minQuantity: number;
  maxQuantity: number;
  numberOfColours: number;
  setup: number;
  price: number;
};

/** A print method the customer picked for one position on a product. */
export type SelectedBranding = {
  positionCode: string;
  positionName: string;
  brandingCode: string;
  brandingName: string;
  /** Number of print colours, or null when the method isn't priced by colour. */
  colours: number | null;
  breaks: BrandingPriceBreak[];
};

/** The distinct colour counts a method can be printed in, smallest first. */
export function colourOptions(breaks: BrandingPriceBreak[]): number[] {
  return [...new Set(breaks.map((b) => b.numberOfColours).filter((n) => n > 0))].sort(
    (a, b) => a - b
  );
}

/** The price break that applies to `quantity` printed in `colours` colours. */
export function findBreak(
  breaks: BrandingPriceBreak[],
  quantity: number,
  colours: number | null
): BrandingPriceBreak | null {
  if (!breaks.length) return null;

  const byColour =
    colours != null && breaks.some((b) => b.numberOfColours === colours)
      ? breaks.filter((b) => b.numberOfColours === colours)
      : breaks;

  const inRange = byColour.find(
    (b) => quantity >= b.minQuantity && (b.maxQuantity <= 0 || quantity <= b.maxQuantity)
  );
  if (inRange) return inRange;

  // Below the first break (or a gap in the table): use the smallest break.
  return [...byColour].sort((a, b) => a.minQuantity - b.minQuantity)[0];
}

export type BrandingCost = { setup: number; unit: number; total: number };

export function brandingCost(branding: SelectedBranding, quantity: number): BrandingCost {
  const brk = findBreak(branding.breaks, quantity, branding.colours);
  if (!brk) return { setup: 0, unit: 0, total: 0 };
  return { setup: brk.setup, unit: brk.price, total: round2(brk.setup + brk.price * quantity) };
}

export type LineTotals = {
  /** Product only, per unit. */
  productUnit: number;
  /** All print positions, per unit. */
  brandingUnit: number;
  /** All once-off setup fees for the line. */
  setup: number;
  total: number;
};

/** Totals for one basket line: product + every branding position. */
export function lineTotals(line: {
  price: number;
  quantity: number;
  brandings?: SelectedBranding[] | null;
}): LineTotals {
  let brandingUnit = 0;
  let setup = 0;
  for (const b of line.brandings ?? []) {
    const cost = brandingCost(b, line.quantity);
    brandingUnit += cost.unit;
    setup += cost.setup;
  }
  return {
    productUnit: line.price,
    brandingUnit: round2(brandingUnit),
    setup: round2(setup),
    total: round2((line.price + brandingUnit) * line.quantity + setup),
  };
}

/** Short human label, e.g. "Front - Screen Print (2 colours)". */
export function brandingLabel(b: Pick<SelectedBranding, "positionName" | "brandingName" | "colours">) {
  const colours = b.colours != null ? ` (${b.colours} colour${b.colours === 1 ? "" : "s"})` : "";
  return `${b.positionName} - ${b.brandingName}${colours}`;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
