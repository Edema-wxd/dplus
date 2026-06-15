"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import type { BrandOption, CategoryOption, ProductListItem } from "@/lib/products";

export default function ProductsClient({
  initialItems,
  initialHasMore,
  brands,
  categories,
}: {
  initialItems: ProductListItem[];
  initialHasMore: boolean;
  brands: BrandOption[];
  categories: CategoryOption[];
}) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(initialItems.length);
  const filtersRef = useRef({ q: "", brand: "", category: "" });

  const fetchPage = useCallback(
    async (filters: { q: string; brand: string; category: string }, offset: number) => {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.brand) params.set("brand", filters.brand);
      if (filters.category) params.set("category", filters.category);
      params.set("offset", String(offset));
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load products");
      return (await res.json()) as { items: ProductListItem[]; hasMore: boolean };
    },
    []
  );

  // Debounced search + filters
  useEffect(() => {
    const handle = setTimeout(() => {
      const filters = { q: query, brand, category };
      filtersRef.current = filters;
      offsetRef.current = 0;
      setLoading(true);
      startTransition(() => {
        fetchPage(filters, 0)
          .then(({ items, hasMore }) => {
            setItems(items);
            setHasMore(hasMore);
            offsetRef.current = items.length;
          })
          .finally(() => setLoading(false));
      });
    }, 350);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, brand, category]);

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (loading || isPending || !hasMore) return;

        setLoading(true);
        fetchPage(filtersRef.current, offsetRef.current)
          .then(({ items: more, hasMore: nextHasMore }) => {
            setItems((prev) => [...prev, ...more]);
            setHasMore(nextHasMore);
            offsetRef.current += more.length;
          })
          .finally(() => setLoading(false));
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchPage, hasMore, loading, isPending]);

  const selectClass =
    "h-9 rounded-md border bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products or brands..."
            className="pl-9"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={selectClass}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className={selectClass}
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.code} value={b.code}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {items.length === 0 && !loading ? (
        <p className="text-muted-foreground">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((product) => (
            <ProductCard key={product.simpleCode} product={product} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="flex justify-center py-10">
        {(loading || isPending) && (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        )}
        {!hasMore && items.length > 0 && !loading && (
          <p className="text-sm text-muted-foreground">No more products</p>
        )}
      </div>
    </div>
  );
}
