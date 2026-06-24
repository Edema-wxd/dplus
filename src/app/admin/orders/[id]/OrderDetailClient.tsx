"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { VALID_STATUSES, type OrderStatus } from "@/lib/order-constants";
import type { Order } from "@/lib/orders";

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

export default function OrderDetailClient({ order }: { order: Order }) {
  const [status, setStatus] = useState<string>(order.status);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  async function handleStatusChange(next: OrderStatus) {
    if (next === status || updating) return;
    setUpdating(true);
    const prev = status;
    setStatus(next); // optimistic

    const res = await fetch(`/api/admin/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (!res.ok) {
      setStatus(prev);
      toast.error("Failed to update status");
    } else {
      toast.success(`Order #${order.id} marked as ${STATUS_LABEL[next]}`);
      router.refresh();
    }
    setUpdating(false);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Current status badge */}
      <span
        className={cn(
          "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
          STATUS_CLASSES[status] ?? "bg-muted text-muted-foreground"
        )}
      >
        {STATUS_LABEL[status] ?? status}
      </span>

      {/* Pill group to change status */}
      <div className="flex flex-wrap justify-end gap-1.5">
        {VALID_STATUSES.map((s) => (
          <button
            key={s}
            disabled={updating}
            onClick={() => handleStatusChange(s)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
              status === s
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
  );
}
