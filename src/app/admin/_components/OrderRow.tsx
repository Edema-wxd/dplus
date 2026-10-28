"use client";

import { useRouter } from "next/navigation";
import type { Order } from "@/lib/orders";
import { STATUS_CLASSES, STATUS_LABELS } from "@/lib/order-constants";

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
      onClick={() => router.push(`/admin/orders/${order.id}`)}
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
