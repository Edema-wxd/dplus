"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Search, X } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import type { BrandOption, CategoryOption, ProductListItem, SortOption } from "@/lib/products";

const SORT_LABELS: Record<SortOption, string> = {
  relevance: "Relevance",
  name_asc: "Name A–Z",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
};

export default function ProductsClient({
  initialItems,
  initialHasMore,
  initialTotal,
  brands,
  categories,
}: {
  initialItems: ProductListItem[];
  initialHasMore: boolean;
  initialTotal: number;
  brands: BrandOption[];
  categories: CategoryOption[];
}) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortOption>("name_asc");
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(initialItems.length);
  const filtersRef = useRef({ q: "", brand: "", category: "", sort: "name_asc" as SortOption });

  const hasActiveFilters = Boolean(query || brand || category || sort !== "name_asc");

  const clearFilters = () => {
    setQuery("");
    setBrand("");
    setCategory("");
    setSort("name_asc");
  };

  const fetchPage = useCallback(
    async (
      filters: { q: string; brand: string; category: string; sort: SortOption },
      offset: number
    ) => {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.brand) params.set("brand", filters.brand);
      if (filters.category) params.set("category", filters.category);
      params.set("sort", filters.sort);
      params.set("offset", String(offset));
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load products");
      return (await res.json()) as { items: ProductListItem[]; hasMore: boolean; total: number };
    },
    []
  );

  // Debounced search + filters
  useEffect(() => {
    const handle = setTimeout(() => {
      const filters = { q: query, brand, category, sort };
      filtersRef.current = filters;
      offsetRef.current = 0;
      setLoading(true);
      startTransition(() => {
        fetchPage(filters, 0)
          .then(({ items, hasMore, total }) => {
            setItems(items);
            setHasMore(hasMore);
            setTotal(total);
            offsetRef.current = items.length;
          })
          .finally(() => setLoading(false));
      });
    }, 350);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, brand, category, sort]);

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
          .then(({ items: more, hasMore: nextHasMore, total: nextTotal }) => {
            setItems((prev) => [...prev, ...more]);
            setHasMore(nextHasMore);
            setTotal(nextTotal);
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
      {/* Filters row */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
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

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className={selectClass}
        >
          {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Result count + clear */}
      <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground">
        {loading || isPending ? (
          <span>Searching…</span>
        ) : (
          <span>
            {total.toLocaleString()} {total === 1 ? "product" : "products"} found
          </span>
        )}
        {hasActiveFilters && !loading && !isPending && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs hover:bg-muted transition-colors"
          >
            <X className="size-3" />
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {items.length === 0 && !loading ? (
        <p className="text-muted-foreground">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((product) => (
            <ProductCard key={product.simpleCode} product={product} />
          ))}
        </div>
      )}

      {/* Sentinel / footer */}
      <div ref={sentinelRef} className="flex justify-center py-10">
        {(loading || isPending) && (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        )}
        {!hasMore && items.length > 0 && !loading && !isPending && (
          <p className="text-sm text-muted-foreground">No more products</p>
        )}
      </div>
    </div>
  );
}
