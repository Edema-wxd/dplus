"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/orders";

// ── constants ─────────────────────────────────────────────

const PAGE_SIZE = 20;
const STATUSES = ["new", "reviewing", "confirmed", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  reviewing: "Reviewing",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

const STATUS_CLASSES: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  reviewing: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  confirmed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
};

const NGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// ── page ──────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "">("");
  const [page, setPage] = useState(0);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOrders = useCallback(
    async (q: string, status: Status | "", pg: number) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (status) params.set("status", status);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(pg * PAGE_SIZE));

      const res = await fetch(`/api/admin/orders?${params}`);
      if (!res.ok) {
        toast.error("Failed to load orders");
        setLoading(false);
        return;
      }
      const data: { orders: Order[]; total: number } = await res.json();
      setOrders(data.orders);
      setTotal(data.total);
      setLoading(false);
    },
    []
  );

  // Re-fetch when filter/page changes (search is debounced separately)
  useEffect(() => {
    fetchOrders(search, statusFilter, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchOrders(value, statusFilter, 0);
    }, 300);
  }

  function handleStatusFilter(s: Status | "") {
    setStatusFilter(s);
    setPage(0);
    setExpandedId(null);
  }

  async function handleStatusChange(orderId: number, newStatus: Status) {
    setUpdatingId(orderId);
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      toast.error("Failed to update status");
      // Roll back by refetching
      fetchOrders(search, statusFilter, page);
    } else {
      const updated: Order = await res.json();
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );
      toast.success(`Order #${orderId} marked as ${STATUS_LABEL[newStatus]}`);
    }
    setUpdatingId(null);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage and update customer orders
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-border"
          />
        </div>

        {/* Result count */}
        {!loading && total > 0 && (
          <p className="text-sm text-muted-foreground shrink-0">
            Showing {start}–{end} of {total} order{total !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {([["", "All"]] as [Status | "", string][])
          .concat(STATUSES.map((s) => [s, STATUS_LABEL[s]]))
          .map(([val, label]) => (
            <button
              key={val}
              onClick={() => handleStatusFilter(val)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors border",
                statusFilter === val
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
      </div>

      {/* Order list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-border bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-background py-16 text-center">
          <p className="text-sm text-muted-foreground">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              updating={updatingId === order.id}
              onToggle={() =>
                setExpandedId(expandedId === order.id ? null : order.id)
              }
              onStatusChange={(s) => handleStatusChange(order.id, s)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground disabled:opacity-40 hover:bg-muted transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground disabled:opacity-40 hover:bg-muted transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ── OrderCard ─────────────────────────────────────────────

function OrderCard({
  order,
  expanded,
  updating,
  onToggle,
  onStatusChange,
}: {
  order: Order;
  expanded: boolean;
  updating: boolean;
  onToggle: () => void;
  onStatusChange: (s: Status) => void;
}) {
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-muted/40 transition-colors"
      >
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-1 sm:gap-x-6">
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">
              {order.customerName}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {order.customerEmail}
              {order.customerPhone && (
                <span className="ml-2 text-muted-foreground/70">
                  · {order.customerPhone}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <StatusBadge status={order.status} />
            <span className="text-muted-foreground tabular-nums">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </span>
            <span className="font-medium text-foreground tabular-nums">
              {NGN.format(order.total)}
            </span>
            <span className="text-muted-foreground hidden md:inline">
              {new Date(order.createdAt).toLocaleDateString("en-ZA", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
        <span className="shrink-0 text-muted-foreground mt-0.5">
          {expanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          {/* Status control */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Update status:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  disabled={updating}
                  onClick={() => onStatusChange(s)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                    order.status === s
                      ? `${STATUS_CLASSES[s]} border-transparent`
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    updating && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Notes: </span>
              {order.notes}
            </div>
          )}

          {/* Item list */}
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-4 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {item.productName}
                  </p>
                  {(item.variantLabel || item.brandingLabel) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[item.variantLabel, item.brandingLabel]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right tabular-nums">
                  <p className="text-foreground">
                    {item.quantity} × {NGN.format(item.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {NGN.format(item.quantity * item.price)}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
              <span className="text-sm font-medium text-foreground">Total</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {NGN.format(order.total)}
              </span>
            </div>
          </div>

          {/* Meta */}
          <p className="text-xs text-muted-foreground">
            Order #{order.id} · placed{" "}
            {new Date(order.createdAt).toLocaleString("en-ZA", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      )}
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_CLASSES[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
