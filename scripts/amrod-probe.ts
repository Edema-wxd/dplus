import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { getAmrodToken, amrodFetch } = await import("../src/lib/amrod/auth");

  const token = await getAmrodToken();
  console.log("Token acquired:", token.slice(0, 20) + "...");

  const endpoints = [
    "/api/v1/Products/GetUpdatedProductsAndBranding",
    "/api/v1/Stock/GetUpdated",
    "/api/v1/Prices/GetUpdated",
    "/api/v1/Brands/",
  ];

  for (const path of endpoints) {
    const res = await amrodFetch(path);
    const text = await res.text();
    console.log(`\n=== ${path} ===`);
    console.log("status:", res.status, "length:", text.length);
    console.log("sample:", text.slice(0, 1500));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
