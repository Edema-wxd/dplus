import { NextRequest, NextResponse } from "next/server";
import { withSyncLog } from "@/lib/amrod/sync/log";
import { syncUpdatedProducts } from "@/lib/amrod/sync/products";
import { syncStock, syncPrices } from "@/lib/amrod/sync/stockAndPrices";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    products: await withSyncLog("products", "updated", syncUpdatedProducts),
    stock: await withSyncLog("stock", "updated", () => syncStock(true)),
    prices: await withSyncLog("prices", "updated", () => syncPrices(true)),
  };

  return NextResponse.json({ ok: true, results });
}
