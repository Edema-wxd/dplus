import {
  brandingCost,
  colourOptions,
  findBreak,
  lineTotals,
  type BrandingPriceBreak,
  type SelectedBranding,
} from "@/lib/branding-pricing";

const screenPrint: BrandingPriceBreak[] = [
  { minQuantity: 1, maxQuantity: 99, numberOfColours: 1, setup: 1000, price: 50 },
  { minQuantity: 100, maxQuantity: -1, numberOfColours: 1, setup: 1000, price: 30 },
  { minQuantity: 1, maxQuantity: 99, numberOfColours: 2, setup: 2000, price: 80 },
  { minQuantity: 100, maxQuantity: -1, numberOfColours: 2, setup: 2000, price: 60 },
];

const embroidery: BrandingPriceBreak[] = [
  { minQuantity: 20, maxQuantity: 99, numberOfColours: -2, setup: 500, price: 15 },
  { minQuantity: 100, maxQuantity: -1, numberOfColours: -2, setup: 500, price: 12 },
];

function selection(breaks: BrandingPriceBreak[], colours: number | null): SelectedBranding {
  return {
    positionCode: "FRONT",
    positionName: "Front",
    brandingCode: "SP",
    brandingName: "Screen Print",
    colours,
    breaks,
  };
}

describe("colourOptions", () => {
  it("lists distinct positive colour counts in order", () => {
    expect(colourOptions(screenPrint)).toEqual([1, 2]);
  });

  it("is empty for methods not priced by colour", () => {
    expect(colourOptions(embroidery)).toEqual([]);
  });
});

describe("findBreak", () => {
  it("picks the break for the quantity and colour count", () => {
    expect(findBreak(screenPrint, 50, 2)?.price).toBe(80);
    expect(findBreak(screenPrint, 150, 1)?.price).toBe(30);
  });

  it("treats a max of -1 as open ended", () => {
    expect(findBreak(screenPrint, 100000, 1)?.price).toBe(30);
  });

  it("ignores the colour count when the method isn't priced by colour", () => {
    expect(findBreak(embroidery, 150, 3)?.price).toBe(12);
  });

  it("falls back to the smallest break below the first minimum", () => {
    expect(findBreak(embroidery, 5, null)?.price).toBe(15);
  });

  it("returns null without breaks", () => {
    expect(findBreak([], 10, null)).toBeNull();
  });
});

describe("brandingCost / lineTotals", () => {
  it("adds setup once and the print price per unit", () => {
    expect(brandingCost(selection(screenPrint, 1), 10)).toEqual({
      setup: 1000,
      unit: 50,
      total: 1500,
    });
  });

  it("totals product and every branding position", () => {
    const totals = lineTotals({
      price: 200,
      quantity: 100,
      brandings: [selection(screenPrint, 2), { ...selection(embroidery, null), positionCode: "BACK" }],
    });
    expect(totals).toEqual({
      productUnit: 200,
      brandingUnit: 72, // 60 + 12
      setup: 2500, // 2000 + 500
      total: (200 + 72) * 100 + 2500,
    });
  });

  it("is just price × quantity without branding", () => {
    expect(lineTotals({ price: 99.5, quantity: 3 }).total).toBe(298.5);
  });
});
