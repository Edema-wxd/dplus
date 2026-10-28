"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import type { ProductDetail, ProductImage } from "@/lib/products";
import {
  brandingCost,
  brandingLabel,
  colourOptions,
  findBreak,
  lineTotals,
  type BrandingPriceBreak,
  type SelectedBranding,
} from "@/lib/branding-pricing";

const currency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

/** Per position: the chosen branding code and colour count. */
type PositionChoice = { brandingCode: string; colours: number | null };

function stockLabel(units: number | undefined) {
  if (units === undefined) return null;
  return units > 0 ? `${units.toLocaleString()} in stock` : "Out of stock";
}

function quantityRange(b: BrandingPriceBreak) {
  return b.maxQuantity > 0 ? `${b.minQuantity}-${b.maxQuantity}` : `${b.minQuantity}+`;
}

function pickGallery(
  images: ProductImage[],
  selectedColour: string | null,
  hasBranding: boolean
): ProductImage[] {
  if (!images.length) return [];

  // Find images matching this colour (name contains "-COLOUR-" pattern)
  const colourImages = selectedColour
    ? images.filter((img) =>
        img.name.toUpperCase().includes(`-${selectedColour.toUpperCase()}-`)
      )
    : [];

  const pool = colourImages.length ? colourImages : images;

  // Sort so the most relevant image for current state is first
  return [...pool].sort((a, b) => {
    if (hasBranding) {
      // show logo versions first when branding is selected
      if (a.hasLogo && !b.hasLogo) return -1;
      if (!a.hasLogo && b.hasLogo) return 1;
    } else {
      // default/no-logo first when no branding
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      if (!a.hasLogo && b.hasLogo) return -1;
      if (a.hasLogo && !b.hasLogo) return 1;
    }
    return 0;
  });
}

export default function ProductDetailClient({ product }: { product: ProductDetail }) {
  const { addItem } = useCart();
  const { stock, swatches, brandingPrices } = product;
  const hasStockData = Object.keys(stock).length > 0;

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
  const [positionChoices, setPositionChoices] = useState<Record<string, PositionChoice>>({});
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const hasBranding = Object.keys(positionChoices).length > 0;

  const gallery = useMemo(
    () => pickGallery(product.images, selectedColour, hasBranding),
    [product.images, selectedColour, hasBranding]
  );

  // Reset to first image whenever the gallery changes (colour / branding switch)
  useEffect(() => {
    setActiveImageIdx(0);
  }, [gallery]);

  const activeImage = gallery[activeImageIdx] ?? gallery[0] ?? null;
  const mainImageUrl = activeImage?.urls?.[0]?.url ?? null;

  const selectedVariant = useMemo(
    () =>
      product.variants.find(
        (v) =>
          (!selectedColour || v.codeColour === selectedColour) &&
          (!selectedSize || v.codeSize === selectedSize)
      ) ?? product.variants[0],
    [product.variants, selectedColour, selectedSize]
  );

  const fullCode = selectedVariant?.fullCode ?? product.simpleCode;

  const price = useMemo(() => {
    if (fullCode && product.prices[fullCode] != null) return product.prices[fullCode];
    const values = Object.values(product.prices);
    return values.length ? Math.min(...values) : null;
  }, [product.prices, fullCode]);

  /** Price and stock for each colour, at the selected size where there is one. */
  const colourInfo = useMemo(() => {
    const info: Record<string, { price: number | null; stock: number | undefined }> = {};
    for (const [code] of colours) {
      const ofColour = product.variants.filter((v) => v.codeColour === code);
      const match = ofColour.find((v) => !selectedSize || v.codeSize === selectedSize) ?? ofColour[0];
      const units = ofColour
        .filter((v) => !selectedSize || v.codeSize === selectedSize)
        .map((v) => stock[v.fullCode])
        .filter((n): n is number => n !== undefined);
      info[code] = {
        price: match ? product.prices[match.fullCode] ?? null : null,
        stock: units.length ? units.reduce((a, b) => a + b, 0) : undefined,
      };
    }
    return info;
  }, [colours, product.variants, product.prices, selectedSize, stock]);

  const variantStock = hasStockData ? stock[fullCode] ?? 0 : undefined;

  /** Positions that have at least one method, with the method's price breaks. */
  const positions = useMemo(
    () =>
      product.brandings
        .map((b) => ({
          code: b.positionCode,
          name: b.positionName,
          methods: (b.method ?? []).map((m) => ({
            code: m.brandingCode,
            name: m.brandingName,
            breaks: brandingPrices[m.brandingCode] ?? [],
          })),
        }))
        .filter((p) => p.methods.length > 0),
    [product.brandings, brandingPrices]
  );

  const selectedBrandings: SelectedBranding[] = useMemo(
    () =>
      positions.flatMap((pos) => {
        const choice = positionChoices[pos.code];
        const method = choice && pos.methods.find((m) => m.code === choice.brandingCode);
        if (!method) return [];
        return [
          {
            positionCode: pos.code,
            positionName: pos.name,
            brandingCode: method.code,
            brandingName: method.name,
            colours: choice.colours,
            breaks: method.breaks,
          },
        ];
      }),
    [positions, positionChoices]
  );

  const totals = lineTotals({ price: price ?? 0, quantity, brandings: selectedBrandings });

  const choosePosition = (positionCode: string, brandingCode: string | null) => {
    setPositionChoices((prev) => {
      const next = { ...prev };
      if (!brandingCode) {
        delete next[positionCode];
        return next;
      }
      const breaks = brandingPrices[brandingCode] ?? [];
      next[positionCode] = { brandingCode, colours: colourOptions(breaks)[0] ?? null };
      return next;
    });
  };

  const setPositionColours = (positionCode: string, colours: number) => {
    setPositionChoices((prev) => ({
      ...prev,
      [positionCode]: { ...prev[positionCode], colours },
    }));
  };

  const handleAddToBasket = () => {
    const variantLabel =
      [selectedVariant?.codeColourName, selectedVariant?.codeSizeName]
        .filter(Boolean)
        .join(" / ") || null;

    addItem({
      simpleCode: product.simpleCode,
      fullCode,
      productName: product.productName,
      image: mainImageUrl,
      variantLabel,
      brandingLabel: selectedBrandings.map(brandingLabel).join("; ") || null,
      quantity,
      price: price ?? 0,
      brandings: selectedBrandings,
    });

    toast.success("Added to basket", {
      description: hasBranding ? "Upload your logo and printing notes at checkout." : undefined,
    });
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* ── Image panel ── */}
      <div className="flex flex-col gap-3 md:sticky md:top-6 md:self-start">
        {/* Main image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
          {mainImageUrl ? (
            <Image
              key={mainImageUrl}
              src={mainImageUrl}
              alt={product.productName}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain p-6 transition-opacity duration-200"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {gallery.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {gallery.map((img, idx) => {
              const thumbUrl = img.urls?.[0]?.url;
              if (!thumbUrl) return null;
              return (
                <button
                  key={img.name + idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 bg-muted transition-colors ${
                    idx === activeImageIdx
                      ? "border-foreground"
                      : "border-transparent hover:border-foreground/40"
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <Image
                    src={thumbUrl}
                    alt=""
                    fill
                    loading={idx === 0 ? "eager" : "lazy"}
                    sizes="64px"
                    className="object-contain p-1"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Details panel ── */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          {product.brandName && (
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {product.brandName}
            </span>
          )}
          <h1 className="text-2xl font-semibold">{product.productName}</h1>
          <p className="font-mono text-xs text-muted-foreground">{fullCode}</p>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold">
              {price != null ? currency.format(price) : "Price on request"}
            </span>
            {price != null && <span className="text-sm text-muted-foreground">per unit, unbranded</span>}
          </div>

          <div className="text-sm">
            {variantStock !== undefined ? (
              <span className={variantStock > 0 ? "text-green-600" : "text-muted-foreground"}>
                {stockLabel(variantStock)}
              </span>
            ) : product.inStock ? (
              <span className="text-green-600">In stock</span>
            ) : (
              <span className="text-muted-foreground">Stock on request</span>
            )}
          </div>
        </div>

        {product.description && (
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        )}

        {colours.length > 0 && (
          <section>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-medium">
                Colour
                <span className="ml-2 font-normal text-muted-foreground">
                  {colours.find(([code]) => code === selectedColour)?.[1]}
                </span>
              </h2>
              <span className="text-xs text-muted-foreground">
                {colours.length} {colours.length === 1 ? "colour" : "colours"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {colours.map(([code, name]) => {
                const info = colourInfo[code];
                const selected = code === selectedColour;
                const hex = swatches[code];
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setSelectedColour(code)}
                    aria-pressed={selected}
                    className={`flex items-center gap-2 rounded-md border p-2 text-left transition-colors ${
                      selected
                        ? "border-foreground bg-muted/60"
                        : "border-border hover:border-foreground/40"
                    }`}
                  >
                    <span
                      className="size-6 flex-shrink-0 rounded-full border border-black/10 dark:border-white/20"
                      style={{
                        background:
                          hex ??
                          "repeating-linear-gradient(45deg, var(--muted), var(--muted) 3px, transparent 3px, transparent 6px)",
                      }}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium">{name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {info?.price != null ? currency.format(info.price) : "On request"}
                      </span>
                      {info?.stock !== undefined && (
                        <span
                          className={`block text-[11px] ${
                            info.stock > 0 ? "text-green-600" : "text-muted-foreground"
                          }`}
                        >
                          {stockLabel(info.stock)}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {sizes.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-medium">Size</h2>
            <div className="flex flex-wrap gap-2">
              {sizes.map(([code, name]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedSize(code)}
                  aria-pressed={code === selectedSize}
                  className={`min-w-11 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    code === selectedSize
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground/40"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <label htmlFor="quantity" className="mb-2 block text-sm font-medium">
            Quantity
          </label>
          <input
            id="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.floor(Number(e.target.value)) || 1))}
            className="w-28 rounded-md border bg-background text-foreground px-3 py-2 text-sm"
          />
          {variantStock !== undefined && quantity > variantStock && (
            <p className="mt-1 text-xs text-amber-600">
              More than we currently have in stock for this colour. We&apos;ll confirm lead time.
            </p>
          )}
        </section>

        {positions.length > 0 && (
          <section>
            <h2 className="text-sm font-medium">Printing options</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Pick a print method for each position you want branded. You can upload your logo at
              checkout.
            </p>
            <div className="flex flex-col gap-3">
              {positions.map((pos) => {
                const choice = positionChoices[pos.code];
                return (
                  <fieldset key={pos.code} className="rounded-md border p-3">
                    <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {pos.name}
                    </legend>
                    <div className="flex flex-col gap-1.5">
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={`pos-${pos.code}`}
                          checked={!choice}
                          onChange={() => choosePosition(pos.code, null)}
                        />
                        No print
                      </label>
                      {pos.methods.map((m) => {
                        const selected = choice?.brandingCode === m.code;
                        const brk = findBreak(m.breaks, quantity, selected ? choice.colours : null);
                        const colourChoices = colourOptions(m.breaks);
                        return (
                          <div key={m.code}>
                            <label className="flex cursor-pointer items-start gap-2 text-sm">
                              <input
                                type="radio"
                                className="mt-1"
                                name={`pos-${pos.code}`}
                                checked={selected}
                                onChange={() => choosePosition(pos.code, m.code)}
                              />
                              <span className="flex-1">
                                {m.name}
                                <span className="block text-xs text-muted-foreground">
                                  {brk
                                    ? `${currency.format(brk.price)}/unit + ${currency.format(brk.setup)} setup`
                                    : "Price on request"}
                                </span>
                              </span>
                            </label>

                            {selected && (
                              <div className="ml-6 mt-2 flex flex-col gap-2">
                                {colourChoices.length > 1 && (
                                  <label className="flex items-center gap-2 text-xs">
                                    Print colours
                                    <select
                                      className="rounded-md border bg-background px-2 py-1 text-xs"
                                      value={choice.colours ?? ""}
                                      onChange={(e) =>
                                        setPositionColours(pos.code, Number(e.target.value))
                                      }
                                    >
                                      {colourChoices.map((n) => (
                                        <option key={n} value={n}>
                                          {n}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                )}
                                {m.breaks.length > 0 && (
                                  <table className="w-full text-[11px] tabular-nums">
                                    <thead className="text-muted-foreground">
                                      <tr>
                                        <th className="text-left font-medium">Qty</th>
                                        <th className="text-right font-medium">Per unit</th>
                                        <th className="text-right font-medium">Setup</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {m.breaks
                                        .filter(
                                          (b) =>
                                            choice.colours == null ||
                                            b.numberOfColours === choice.colours ||
                                            !colourChoices.includes(choice.colours)
                                        )
                                        .sort((a, b) => a.minQuantity - b.minQuantity)
                                        .map((b, i) => (
                                          <tr
                                            key={i}
                                            className={b === brk ? "font-semibold text-foreground" : ""}
                                          >
                                            <td>{quantityRange(b)}</td>
                                            <td className="text-right">{currency.format(b.price)}</td>
                                            <td className="text-right">{currency.format(b.setup)}</td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
            </div>
          </section>
        )}

        {/* Estimate */}
        <section className="rounded-md border bg-muted/30 p-4 text-sm">
          <h2 className="mb-2 font-medium">Estimate</h2>
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 tabular-nums">
            <dt className="text-muted-foreground">
              Product ({quantity} × {currency.format(totals.productUnit)})
            </dt>
            <dd className="text-right">{currency.format(totals.productUnit * quantity)}</dd>
            {selectedBrandings.map((b) => {
              const cost = brandingCost(b, quantity);
              return (
                <div key={b.positionCode} className="contents">
                  <dt className="text-muted-foreground">
                    {brandingLabel(b)} ({quantity} × {currency.format(cost.unit)} +{" "}
                    {currency.format(cost.setup)} setup)
                  </dt>
                  <dd className="text-right">{currency.format(cost.total)}</dd>
                </div>
              );
            })}
            <dt className="mt-1 border-t pt-1 font-semibold">Total</dt>
            <dd className="mt-1 border-t pt-1 text-right font-semibold">
              {currency.format(totals.total)}
            </dd>
            <dt className="text-xs text-muted-foreground">Per unit, all in</dt>
            <dd className="text-right text-xs text-muted-foreground">
              {currency.format(totals.total / quantity)}
            </dd>
          </dl>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Estimate only. Final pricing is confirmed when we review your order.
          </p>
        </section>

        <Button size="lg" onClick={handleAddToBasket}>
          Add to Basket
        </Button>
      </div>
    </div>
  );
}
