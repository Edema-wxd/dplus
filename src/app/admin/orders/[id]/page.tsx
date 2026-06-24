import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getOrderById } from "@/lib/orders";
import OrderDetailClient from "./OrderDetailClient";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = Number(id);

  if (!Number.isInteger(orderId) || orderId < 1) notFound();

  const order = await getOrderById(orderId);
  if (!order) notFound();

  const NGN = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        All orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Order #{order.id}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed{" "}
            {new Date(order.createdAt).toLocaleString("en-ZA", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        {/* Status pill + updater (client island) */}
        <OrderDetailClient order={order} />
      </div>

      {/* Customer */}
      <section className="rounded-xl border border-border bg-background p-5 space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Customer
        </h2>
        <div className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1.5 text-sm">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium text-foreground">{order.customerName}</span>
          <span className="text-muted-foreground">Email</span>
          <a
            href={`mailto:${order.customerEmail}`}
            className="text-foreground hover:underline"
          >
            {order.customerEmail}
          </a>
          {order.customerPhone && (
            <>
              <span className="text-muted-foreground">Phone</span>
              <a
                href={`tel:${order.customerPhone}`}
                className="text-foreground hover:underline"
              >
                {order.customerPhone}
              </a>
            </>
          )}
        </div>
      </section>

      {/* Notes */}
      {order.notes && (
        <section className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            Notes
          </h2>
          <p className="text-sm text-foreground whitespace-pre-wrap">{order.notes}</p>
        </section>
      )}

      {/* Items */}
      <section className="rounded-xl border border-border bg-background overflow-hidden">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-5 py-3 border-b border-border">
          Items
        </h2>
        <div className="divide-y divide-border">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{item.productName}</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{item.fullCode}</p>
                {(item.variantLabel || item.brandingLabel) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {[item.variantLabel, item.brandingLabel].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right tabular-nums">
                <p className="text-sm text-foreground">
                  {item.quantity} × {NGN.format(item.price)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {NGN.format(item.quantity * item.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-5 py-3">
          <span className="text-sm font-medium text-foreground">Total</span>
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {NGN.format(order.total)}
          </span>
        </div>
      </section>
    </div>
  );
}
