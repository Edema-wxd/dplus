import type { OrderItem } from "@/lib/orders";

/**
 * Turns a customer order into the lines staff key into Amrod's cart: one row
 * per product variant, plus the print position, branding code, artwork and
 * printer notes to pass on. Amrod's vendor API has no ordering endpoint, so
 * this is the hand-off.
 */
export type AmrodSheetRow = {
  fullCode: string;
  product: string;
  variant: string;
  quantity: number;
  position: string;
  brandingCode: string;
  method: string;
  colours: string;
  artwork: string;
  note: string;
};

export const SHEET_COLUMNS: { key: keyof AmrodSheetRow; label: string }[] = [
  { key: "fullCode", label: "Item code" },
  { key: "product", label: "Product" },
  { key: "variant", label: "Colour / size" },
  { key: "quantity", label: "Qty" },
  { key: "position", label: "Print position" },
  { key: "brandingCode", label: "Branding code" },
  { key: "method", label: "Method" },
  { key: "colours", label: "Print colours" },
  { key: "artwork", label: "Artwork" },
  { key: "note", label: "Printer note" },
];

export function amrodSheetRows(items: OrderItem[]): AmrodSheetRow[] {
  return items.flatMap((item) => {
    const base = {
      fullCode: item.fullCode,
      product: item.productName,
      variant: item.variantLabel ?? "",
      quantity: item.quantity,
      artwork: (item.artwork ?? []).map((a) => a.url).join(" "),
      note: item.note ?? "",
    };
    const brandings = item.brandings ?? [];
    if (!brandings.length) {
      return [
        {
          ...base,
          position: "",
          brandingCode: "",
          method: item.brandingLabel ?? "Unbranded",
          colours: "",
        },
      ];
    }
    return brandings.map((b) => ({
      ...base,
      position: b.positionName,
      brandingCode: b.brandingCode,
      method: b.brandingName,
      colours: b.colours != null ? String(b.colours) : "",
    }));
  });
}

function csvCell(value: string | number): string {
  const s = String(value);
  // Leading =, +, -, @ would run as a formula when opened in a spreadsheet.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function amrodSheetCsv(items: OrderItem[]): string {
  const rows = amrodSheetRows(items);
  return [
    SHEET_COLUMNS.map((c) => csvCell(c.label)).join(","),
    ...rows.map((r) => SHEET_COLUMNS.map((c) => csvCell(r[c.key])).join(",")),
  ].join("\r\n");
}
