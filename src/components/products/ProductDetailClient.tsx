"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import type { ProductDetail } from "@/lib/products";

const currency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

export default function ProductDetailClient({ product }: { product: ProductDetail }) {
  const { addItem } = useCart();

  const colours = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of product.variants) {
      if (v.codeColour) map.set(v.codeColour, v.codeColourName ?? v.codeColour);
    }
    return Array.from(map.entries());
  }, [product.variants]);

  const sizes = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of product.variants) {
      if (v.codeSize) map.set(v.codeSize, v.codeSizeName ?? v.codeSize);
    }
    return Array.from(map.entries());
  }, [product.variants]);

  const [selectedColour, setSelectedColour] = useState<string | null>(
    colours.length ? colours[0][0] : null
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.length ? sizes[0][0] : null
  );
  const [selectedBranding, setSelectedBranding] = useState<string>("none");
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = useMemo(() => {
    return (
      product.variants.find(
        (v) =>
          (!selectedColour || v.codeColour === selectedColour) &&
          (!selectedSize || v.codeSize === selectedSize)
      ) ?? product.variants[0]
    );
  }, [product.variants, selectedColour, selectedSize]);

  const fullCode = selectedVariant?.fullCode ?? product.simpleCode;

  const price = useMemo(() => {
    if (fullCode && product.prices[fullCode] != null) return product.prices[fullCode];
    const values = Object.values(product.prices);
    return values.length ? Math.min(...values) : null;
  }, [product.prices, fullCode]);

  const image = useMemo(() => {
    if (!product.images.length) return null;
    if (selectedColour) {
      const match = product.images.find(
        (img) => img.hasLogo && img.name.includes(`-${selectedColour}-`)
      );
      if (match?.urls?.[0]?.url) return match.urls[0].url;
      const matchNoLogo = product.images.find((img) =>
        img.name.includes(`-${selectedColour}-`)
      );
      if (matchNoLogo?.urls?.[0]?.url) return matchNoLogo.urls[0].url;
    }
    const def = product.images.find((img) => img.isDefault) ?? product.images[0];
    return def?.urls?.[0]?.url ?? null;
  }, [product.images, selectedColour]);

  const brandingOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    for (const branding of product.brandings) {
      for (const method of branding.method) {
        opts.push({
          value: `${branding.positionCode}:${method.brandingCode}`,
          label: `${branding.positionName} - ${method.brandingName}`,
        });
      }
    }
    return opts;
  }, [product.brandings]);

  const handleAddToBasket = () => {
    const variantLabel = [selectedVariant?.codeColourName, selectedVariant?.codeSizeName]
      .filter(Boolean)
      .join(" / ") || null;

    const brandingOption = brandingOptions.find((o) => o.value === selectedBranding);

    addItem({
      simpleCode: product.simpleCode,
      fullCode,
      productName: product.productName,
      image,
      variantLabel,
      brandingLabel: brandingOption?.label ?? null,
      quantity,
      price: price ?? 0,
    });

    toast.success("Added to basket");
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="relative aspect-square w-full rounded-lg border bg-muted">
        {image ? (
          <Image
            src={image}
            alt={product.productName}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-6"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {product.brandName && (
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {product.brandName}
          </span>
        )}
        <h1 className="text-2xl font-semibold">{product.productName}</h1>

        <div className="text-xl font-semibold">
          {price != null ? currency.format(price) : "Price on request"}
        </div>

        <div className="text-sm">
          {product.inStock ? (
            <span className="text-green-600">In stock</span>
          ) : (
            <span className="text-muted-foreground">Stock on request</span>
          )}
        </div>

        {product.description && (
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        )}

        {colours.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">Colour</label>
            <select
              className="w-full rounded-md border bg-background text-foreground px-3 py-2 text-sm"
              value={selectedColour ?? ""}
              onChange={(e) => setSelectedColour(e.target.value)}
            >
              {colours.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}

        {sizes.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">Size</label>
            <select
              className="w-full rounded-md border bg-background text-foreground px-3 py-2 text-sm"
              value={selectedSize ?? ""}
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              {sizes.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}

        {brandingOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">Branding</label>
            <select
              className="w-full rounded-md border bg-background text-foreground px-3 py-2 text-sm"
              value={selectedBranding}
              onChange={(e) => setSelectedBranding(e.target.value)}
            >
              <option value="none">No branding</option>
              {brandingOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            className="w-24 rounded-md border bg-background text-foreground px-3 py-2 text-sm"
          />
        </div>

        <Button size="lg" onClick={handleAddToBasket} className="mt-2">
          Add to Basket
        </Button>
      </div>
    </div>
  );
}
