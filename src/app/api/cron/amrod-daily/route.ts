import { NextRequest, NextResponse } from "next/server";
import { withSyncLog } from "@/lib/amrod/sync/log";
import { invalidateProductCache } from "@/lib/products";
import { revalidateCatalogue } from "@/lib/revalidate";
import { syncUpdatedProducts } from "@/lib/amrod/sync/products";
import { syncStock, syncPrices } from "@/lib/amrod/sync/stockAndPrices";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = {
      products: await withSyncLog("products", "updated", syncUpdatedProducts),
      stock: await withSyncLog("stock", "updated", () => syncStock(true)),
      prices: await withSyncLog("prices", "updated", () => syncPrices(true)),
    };

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    // Returned, not thrown: Next discards revalidatePath calls from a handler
    // that throws, which would leave stale catalogue pages cached.
    console.error("[cron] amrod sync failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  } finally {
    // Even a partial sync has written new rows, so drop the cached catalogue.
    await invalidateProductCache();
    revalidateCatalogue();
  }
}
