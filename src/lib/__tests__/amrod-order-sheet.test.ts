import { amrodSheetCsv, amrodSheetRows } from "@/lib/amrod-order-sheet";
import type { OrderItem } from "@/lib/orders";

const shirt: OrderItem = {
  simpleCode: "ABC",
  fullCode: "ABC-RED-L",
  productName: "T-Shirt",
  image: null,
  variantLabel: "Red / L",
  brandingLabel: "Front - Screen Print (1 colour)",
  quantity: 50,
  price: 2000,
  brandings: [
    { positionCode: "F", positionName: "Front", brandingCode: "SP-1", brandingName: "Screen Print", colours: 1, breaks: [] },
    { positionCode: "B", positionName: "Back", brandingCode: "EMB-A", brandingName: "Embroidery", colours: null, breaks: [] },
  ],
  artwork: [{ url: "https://x.ufs.sh/f/k", key: "k", name: "logo.png" }],
  note: 'Logo 8cm, "centred"',
};

const pen: OrderItem = {
  simpleCode: "PEN",
  fullCode: "PEN-BLU",
  productName: "Pen",
  image: null,
  variantLabel: null,
  brandingLabel: null,
  quantity: 100,
  price: 300,
};

describe("amrodSheetRows", () => {
  it("emits one row per print position, repeating the variant", () => {
    const rows = amrodSheetRows([shirt]);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.brandingCode)).toEqual(["SP-1", "EMB-A"]);
    expect(rows.every((r) => r.fullCode === "ABC-RED-L" && r.quantity === 50)).toBe(true);
  });

  it("marks unbranded items", () => {
    expect(amrodSheetRows([pen])[0]).toMatchObject({ method: "Unbranded", brandingCode: "" });
  });
});

describe("amrodSheetCsv", () => {
  it("quotes cells with commas and quotes", () => {
    const csv = amrodSheetCsv([shirt]);
    expect(csv.split("\r\n")).toHaveLength(3);
    expect(csv).toContain('"Logo 8cm, ""centred"""');
  });

  it("neutralises spreadsheet formulas", () => {
    const csv = amrodSheetCsv([{ ...pen, note: "=HYPERLINK(\"x\")" }]);
    expect(csv).toContain("'=HYPERLINK");
  });
});
