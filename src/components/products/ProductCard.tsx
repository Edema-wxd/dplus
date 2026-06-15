import Image from "next/image";
import type { ProductListItem } from "@/lib/products";

export default function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      <div className="relative aspect-square w-full bg-muted">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.productName}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className="object-contain p-4 transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.brandName && (
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {product.brandName}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          {product.productName}
        </h3>
        <div className="mt-auto pt-2 text-sm font-semibold">
          {product.price != null
            ? new Intl.NumberFormat("en-ZA", {
                style: "currency",
                currency: "ZAR",
              }).format(product.price)
            : "Price on request"}
        </div>
      </div>
    </div>
  );
}
