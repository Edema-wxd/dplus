import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { syncCategories } = await import("../src/lib/amrod/sync/categories");
  const { syncBrands } = await import("../src/lib/amrod/sync/brands");
  const {
    syncBrandingDepartments,
    syncInclusiveBrandings,
    syncBrandingPrices,
    syncColourSwatches,
  } = await import("../src/lib/amrod/sync/brandingLookups");
  const { seedProducts } = await import("../src/lib/amrod/sync/products");
  const { syncStock, syncPrices } = await import("../src/lib/amrod/sync/stockAndPrices");
  const { pool } = await import("../src/lib/db");

  console.log("Syncing lookup tables...");
  console.log("categories:", await syncCategories());
  console.log("brands:", await syncBrands());
  console.log("branding departments:", await syncBrandingDepartments());
  console.log("inclusive brandings:", await syncInclusiveBrandings());
  console.log("branding prices:", await syncBrandingPrices());
  console.log("colour swatches:", await syncColourSwatches());

  console.log("\nSeeding full product catalogue (this may take a while)...");
  const productCount = await seedProducts();
  console.log("products:", productCount);

  console.log("\nSyncing stock and prices...");
  console.log("stock:", await syncStock(false));
  console.log("prices:", await syncPrices(false));

  await pool.end();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
