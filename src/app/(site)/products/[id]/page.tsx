import { notFound } from "next/navigation";
import { getProductDetail, getRelatedProducts } from "@/lib/products";
import ProductDetailClient from "@/components/products/ProductDetailClient";
import ProductCard from "@/components/products/ProductCard";
import BackButton from "@/components/products/BackButton";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductDetail(id);

  if (!product) notFound();

  const categoryIds = product.categories.map((c) => c.id);
  const related = await getRelatedProducts(product.simpleCode, categoryIds, 8);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <BackButton />
      <ProductDetailClient product={product} />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-semibold mb-4">Related products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.simpleCode} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
