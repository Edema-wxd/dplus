"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";

const currency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

export default function BasketPage() {
  const { items, removeItem, updateQuantity, clear, total } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items,
          total,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit order");

      clear();
      setSubmitted(true);
      toast.success("Order submitted! We'll be in touch soon.");
    } catch {
      toast.error("Something went wrong submitting your order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">Thank you!</h1>
        <p className="text-muted-foreground mb-6">
          Your order has been submitted. Our team will contact you shortly to confirm
          details and pricing.
        </p>
        <Button asChild>
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">Your basket is empty</h1>
        <p className="text-muted-foreground mb-6">
          Browse our products and add items to your basket.
        </p>
        <Button asChild>
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Your Basket</h1>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 rounded-lg border bg-card p-4"
          >
            <div className="relative h-20 w-20 flex-shrink-0 rounded bg-muted">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.productName}
                  fill
                  className="object-contain p-2"
                  sizes="80px"
                />
              ) : null}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <h3 className="text-sm font-medium">{item.productName}</h3>
              {item.variantLabel && (
                <span className="text-xs text-muted-foreground">{item.variantLabel}</span>
              )}
              {item.brandingLabel && (
                <span className="text-xs text-muted-foreground">{item.brandingLabel}</span>
              )}
              <div className="mt-auto flex items-center gap-3">
                <label className="text-xs text-muted-foreground">Qty</label>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(item.id, Number(e.target.value) || 1)
                  }
                  className="w-16 rounded-md border bg-background text-foreground px-2 py-1 text-sm"
                />
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="text-sm font-semibold whitespace-nowrap">
              {currency.format(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end text-lg font-semibold">
        Total: {currency.format(total)}
      </div>

      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4 max-w-md">
        <h2 className="text-lg font-semibold">Your details</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            required
            value={form.customerName}
            onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
            className="w-full rounded-md border bg-background text-foreground px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            required
            type="email"
            value={form.customerEmail}
            onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
            className="w-full rounded-md border bg-background text-foreground px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            value={form.customerPhone}
            onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
            className="w-full rounded-md border bg-background text-foreground px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            className="w-full rounded-md border bg-background text-foreground px-3 py-2 text-sm"
          />
        </div>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Order"}
        </Button>
      </form>
    </div>
  );
}
