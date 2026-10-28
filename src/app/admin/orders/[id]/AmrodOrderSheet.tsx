"use client";

import { toast } from "sonner";
import type { OrderItem } from "@/lib/orders";
import { amrodSheetCsv, amrodSheetRows, SHEET_COLUMNS } from "@/lib/amrod-order-sheet";

export default function AmrodOrderSheet({
  orderId,
  items,
}: {
  orderId: number;
  items: OrderItem[];
}) {
  const rows = amrodSheetRows(items);

  async function copyCodes() {
    // One line per variant: "CODE<TAB>QTY", ready to paste into a quick-order form.
    const totals = new Map<string, number>();
    for (const item of items) totals.set(item.fullCode, (totals.get(item.fullCode) ?? 0) + item.quantity);
    const text = [...totals].map(([code, qty]) => `${code}\t${qty}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Item codes and quantities copied");
    } catch {
      toast.error("Couldn't access the clipboard");
    }
  }

  function downloadCsv() {
    const blob = new Blob([amrodSheetCsv(items)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-${orderId}-amrod.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-border">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Amrod order sheet
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add these to the Amrod cart, then mark the order &ldquo;Placed with Amrod&rdquo;.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyCodes}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
          >
            Copy codes + qty
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
          >
            Download CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/30 text-muted-foreground">
            <tr>
              {SHEET_COLUMNS.filter((c) => c.key !== "artwork" && c.key !== "note").map((c) => (
                <th key={c.key} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="px-3 py-2 font-mono whitespace-nowrap">{r.fullCode}</td>
                <td className="px-3 py-2">{r.product}</td>
                <td className="px-3 py-2">{r.variant}</td>
                <td className="px-3 py-2 tabular-nums">{r.quantity}</td>
                <td className="px-3 py-2">{r.position}</td>
                <td className="px-3 py-2 font-mono whitespace-nowrap">{r.brandingCode}</td>
                <td className="px-3 py-2">{r.method}</td>
                <td className="px-3 py-2 tabular-nums">{r.colours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
