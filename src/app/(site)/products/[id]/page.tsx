import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { pageMetadata } from "@/lib/seo";
import { getProductDetail, getRelatedProducts } from "@/lib/products";
import ProductDetailClient from "@/components/products/ProductDetailClient";
import ProductCard from "@/components/products/ProductCard";
import BackButton from "@/components/products/BackButton";

// Cached for a day; the Amrod sync and pricing edits refresh it on demand
// (see src/lib/revalidate.ts).
export const revalidate = 86400;

/**
 * Without this the route renders on every request; an empty list caches each
 * product the first time it is visited.
 */
export async function generateStaticParams() {
  return [];
}

/** Shared by generateMetadata and the page, so the product is read once. */
const getProduct = cache(async (id: string) => getProductDetail(id));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product)
    return { title: "Product not found", robots: { index: false, follow: false } };

  const description =
    product.description?.trim().replace(/\s+/g, " ").slice(0, 300) ||
    `${product.productName} — available for custom branding from De-Sign Plus.`;

  const image =
    product.images.find((i) => i.isDefault) ?? product.images[0];
  const ogImage = image?.urls?.length
    ? [...image.urls].sort((a, b) => b.width - a.width)[0].url
    : null;

  return pageMetadata({
    title: product.brandName
      ? `${product.productName} — ${product.brandName}`
      : product.productName,
    description,
    path: `/products/${id}`,
    noindex: true,
    images: ogImage ? [ogImage] : undefined,
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

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
