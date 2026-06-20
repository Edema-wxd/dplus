"use client";

import { useRouter } from "next/navigation";
import type { Order } from "@/lib/orders";

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  reviewing: "Reviewing",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

const STATUS_CLASSES: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  reviewing: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  confirmed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function formatNGN(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function OrderRow({ order }: { order: Order }) {
  const router = useRouter();
  return (
    <tr
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => router.push("/admin/orders")}
    >
      <td className="px-5 py-3.5 font-medium text-foreground whitespace-nowrap">
        {order.customerName}
      </td>
      <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell truncate max-w-[180px]">
        {order.customerEmail}
      </td>
      <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
        {order.items.reduce((s, i) => s + i.quantity, 0)}
      </td>
      <td className="px-5 py-3.5 text-right tabular-nums font-medium text-foreground whitespace-nowrap">
        {formatNGN(order.total)}
      </td>
      <td className="px-5 py-3.5">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            STATUS_CLASSES[order.status] ?? "bg-muted text-muted-foreground"
          }`}
        >
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </td>
      <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap hidden md:table-cell">
        {new Date(order.createdAt).toLocaleDateString("en-ZA", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </td>
    </tr>
  );
}
