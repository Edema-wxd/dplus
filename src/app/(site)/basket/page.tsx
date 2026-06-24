"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/cart-context";
import type { CartItem } from "@/context/cart-context";

const ngn = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

// ─── Quantity stepper ─────────────────────────────────────────────────────────

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="inline-flex items-center h-8 rounded-full border border-border bg-muted/40">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-8 h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-l-full"
        aria-label="Decrease quantity"
      >
        <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor">
          <rect width="10" height="2" rx="1" />
        </svg>
      </button>
      <span className="w-8 text-center text-sm font-medium tabular-nums select-none">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-8 h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-r-full"
        aria-label="Increase quantity"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <rect x="4" y="0" width="2" height="10" rx="1" />
          <rect x="0" y="4" width="10" height="2" rx="1" />
        </svg>
      </button>
    </div>
  );
}

// ─── Single cart item ─────────────────────────────────────────────────────────

function CartRow({
  item,
  onRemove,
  onQty,
}: {
  item: CartItem;
  onRemove: () => void;
  onQty: (v: number) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, height: 0, marginBottom: 0, paddingBottom: 0 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="flex gap-4 py-5 border-b border-border last:border-0 overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative h-[88px] w-[88px] flex-shrink-0 rounded-xl overflow-hidden bg-muted">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.productName}
            fill
            sizes="88px"
            className="object-contain p-2"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
              <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.5" />
              <path d="M21 15l-5-5L5 21" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
        <div>
          <p className="text-sm font-medium leading-snug line-clamp-2">{item.productName}</p>
          {(item.variantLabel || item.brandingLabel) && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {[item.variantLabel, item.brandingLabel].filter(Boolean).join("  ·  ")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Stepper value={item.quantity} onChange={onQty} />
          <button
            type="button"
            onClick={onRemove}
            className="text-[11px] text-muted-foreground/50 hover:text-destructive transition-colors tracking-wide"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 flex flex-col items-end justify-between">
        <span className="text-sm font-semibold tabular-nums">
          {ngn.format(item.price * item.quantity)}
        </span>
        {item.quantity > 1 && (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {ngn.format(item.price)} ea.
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="relative w-24 h-24 text-border">
        <svg viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path
            d="M16 24h64l-8 44a4 4 0 01-4 4H28a4 4 0 01-4-4L16 24z"
            strokeLinejoin="round"
          />
          <path d="M36 24v-4a12 12 0 0124 0v4" strokeLinecap="round" />
          <circle cx="40" cy="50" r="3" fill="currentColor" stroke="none" opacity=".4" />
          <circle cx="56" cy="50" r="3" fill="currentColor" stroke="none" opacity=".4" />
        </svg>
      </div>
      <div>
        <h1
          className="text-3xl font-bold tracking-tight mb-2"
          style={{ fontFamily: "var(--font-sarlotte)" }}
        >
          Nothing here yet
        </h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          Browse our catalogue and add items to get started on your custom order.
        </p>
      </div>
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm font-medium border border-foreground rounded-full px-6 py-2.5 hover:bg-foreground hover:text-background transition-colors"
      >
        Browse products
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 6h8M6 2l4 4-4 4" />
        </svg>
      </Link>
    </div>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessState({ orderId }: { orderId: number | null }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-20 h-20 rounded-full border-2 border-foreground flex items-center justify-center"
      >
        <motion.svg
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 16l8 8 12-12" />
        </motion.svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <h1
          className="text-3xl font-bold tracking-tight mb-2"
          style={{ fontFamily: "var(--font-sarlotte)" }}
        >
          Request received
        </h1>
        {orderId && (
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Reference <span className="text-foreground">#{orderId}</span>
          </p>
        )}
        <p className="text-muted-foreground text-sm max-w-sm">
          Our team will review your selection and be in touch within 24 hours to confirm details and pricing.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-medium border border-foreground rounded-full px-6 py-2.5 hover:bg-foreground hover:text-background transition-colors"
        >
          Continue browsing
        </Link>
      </motion.div>
    </div>
  );
}

// ─── Form field ───────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-dsp-red">*</span>}
      </label>
      {children}
    </div>
  );
}

const fieldClass =
  "w-full border-b border-border bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground transition-colors";

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BasketPage() {
  const { items, removeItem, updateQuantity, clear, total } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
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
        body: JSON.stringify({ ...form, items, total }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      clear();
      setOrderId(data?.order?.id ?? null);
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return <SuccessState orderId={orderId} />;
  if (!items.length) return <EmptyState />;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 lg:py-16">
      {/* Page heading */}
      <div className="mb-10 flex items-baseline justify-between">
        <h1
          className="text-4xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-sarlotte)" }}
        >
          Your Basket
        </h1>
        <span className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* ── Left: item list ─────────────────────────────────────────────── */}
        <div>
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <CartRow
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.id)}
                onQty={(v) => updateQuantity(item.id, v)}
              />
            ))}
          </AnimatePresence>

          {/* Subtotal row */}
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => clear()}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors underline underline-offset-2"
            >
              Clear all
            </button>
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-2xl font-bold tabular-nums" style={{ fontFamily: "var(--font-sarlotte)" }}>
                {ngn.format(total)}
              </span>
            </div>
          </div>

          <p className="mt-2 text-right text-[11px] text-muted-foreground/60">
            Final pricing confirmed on order review
          </p>
        </div>

        {/* ── Right: quote form (sticky) ───────────────────────────────────── */}
        <div className="lg:sticky lg:top-6">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2
              className="text-xl font-bold mb-6 tracking-tight"
              style={{ fontFamily: "var(--font-sarlotte)" }}
            >
              Request a Quote
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Field label="Full name" required>
                <input
                  required
                  placeholder="Jane Doe"
                  value={form.customerName}
                  onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                  className={fieldClass}
                />
              </Field>

              <Field label="Email address" required>
                <input
                  required
                  type="email"
                  placeholder="jane@company.com"
                  value={form.customerEmail}
                  onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                  className={fieldClass}
                />
              </Field>

              <Field label="Phone number">
                <input
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={form.customerPhone}
                  onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                  className={fieldClass}
                />
              </Field>

              <Field label="Notes / requirements">
                <textarea
                  rows={3}
                  placeholder="Branding colours, deadlines, quantities…"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className={`${fieldClass} resize-none`}
                />
              </Field>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full h-12 rounded-full bg-foreground text-background text-sm font-semibold tracking-wide hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity=".25" />
                      <path d="M12 2a10 10 0 0110 10" strokeLinecap="round" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  <>
                    Send Quote Request
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                      <path d="M2 7h10M7 2l5 5-5 5" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Trust note */}
            <p className="mt-4 text-center text-[11px] text-muted-foreground/60 leading-relaxed">
              No payment required. Our team will contact you within 24 hours to confirm your order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
