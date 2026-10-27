import { NextRequest, NextResponse } from "next/server";
import { withSyncLog } from "@/lib/amrod/sync/log";
import { invalidateProductCache } from "@/lib/products";
import { revalidateCatalogue } from "@/lib/revalidate";
import { syncCategories } from "@/lib/amrod/sync/categories";
import { syncBrands } from "@/lib/amrod/sync/brands";
import {
  syncBrandingDepartments,
  syncInclusiveBrandings,
  syncBrandingPrices,
  syncColourSwatches,
} from "@/lib/amrod/sync/brandingLookups";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = {
      categories: await withSyncLog("categories", "full", syncCategories),
      brands: await withSyncLog("brands", "full", syncBrands),
      brandingDepartments: await withSyncLog("branding_departments", "full", syncBrandingDepartments),
      inclusiveBrandings: await withSyncLog("inclusive_brandings", "full", syncInclusiveBrandings),
      brandingPrices: await withSyncLog("branding_prices", "full", syncBrandingPrices),
      colourSwatches: await withSyncLog("colour_swatches", "full", syncColourSwatches),
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
    // Brand and category names feed the catalogue filters and cards.
    await invalidateProductCache();
    revalidateCatalogue();
  }
}
