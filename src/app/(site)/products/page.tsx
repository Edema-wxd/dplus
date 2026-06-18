import { getProducts, getBrandOptions, getTopCategoryOptions, PAGE_SIZE } from "@/lib/products";
import ProductsClient from "@/components/products/ProductsClient";

export const metadata = {
  title: "Products | De-Sign Plus",
};

export const revalidate = 0;

export default async function ProductsPage() {
  const [{ items, hasMore, total }, brands, categories] = await Promise.all([
    getProducts({ offset: 0, limit: PAGE_SIZE }),
    getBrandOptions(),
    getTopCategoryOptions(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold sm:text-4xl">Our Products</h1>
        <p className="mt-2 text-muted-foreground">
          Browse our full catalogue of brandable products.
        </p>
      </div>
      <ProductsClient
        initialItems={items}
        initialHasMore={hasMore}
        initialTotal={total}
        brands={brands}
        categories={categories}
      />
    </div>
  );
}
