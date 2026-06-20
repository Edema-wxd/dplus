"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PricingConfig, PricingPreview } from "@/lib/pricing";

const ngn = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" });
const zar = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });

function BreakdownRow({
  step,
  label,
  sublabel,
  value,
  delta,
  currency,
  isFirst,
  isLast,
}: {
  step: number;
  label: string;
  sublabel: string;
  value: string;
  delta?: number;
  currency?: string;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className={`flex items-stretch gap-3 ${!isLast ? "pb-0" : ""}`}>
      {/* Connector line + step number */}
      <div className="flex flex-col items-center w-6 shrink-0">
        <div className={`w-6 h-6 rounded-full border-2 border-border bg-background flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 z-10 ${isLast ? "border-foreground text-foreground" : ""}`}>
          {step}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-0.5" />}
      </div>

      {/* Content */}
      <div className={`flex items-start justify-between flex-1 gap-2 ${!isLast ? "pb-3" : ""}`}>
        <div>
          <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-sm font-semibold ${isLast ? "text-foreground" : "text-muted-foreground"}`}>
            {value}
          </p>
          {delta !== undefined && (
            <p className="text-xs text-muted-foreground mt-0.5">
              +{currency === "ZAR"
                ? new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(delta)
                : delta.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PricingForm({
  config,
  updatedByName,
}: {
  config: PricingConfig;
  updatedByName: string | null;
}) {
  const [vatPercent, setVatPercent] = useState(String(config.vatRate * 100));
  const [markupPercent, setMarkupPercent] = useState(String(config.markupPercent));
  const [exchangeRate, setExchangeRate] = useState(String(config.exchangeRate));
  const [exchangeNote, setExchangeNote] = useState(config.exchangeNote ?? "");

  const [preview, setPreview] = useState<PricingPreview | null>(null);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [savedAt, setSavedAt] = useState(config.updatedAt);
  const [savedBy, setSavedBy] = useState(updatedByName);

  async function handlePreview() {
    setPreviewing(true);
    try {
      const params = new URLSearchParams({
        markup: markupPercent,
        rate: exchangeRate,
        vat: String(Number(vatPercent) / 100),
      });
      const res = await fetch(`/api/admin/pricing/preview?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to load preview");
        return;
      }
      const data: PricingPreview = await res.json();
      setPreview(data);
      setHasPreviewed(true);
    } finally {
      setPreviewing(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vatRate: Number(vatPercent) / 100,
          markupPercent: Number(markupPercent),
          exchangeRate: Number(exchangeRate),
          exchangeNote,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.errors ? Object.values(data.errors).join(", ") : "Failed to save");
        return;
      }
      const data: PricingConfig = await res.json();
      setSavedAt(data.updatedAt);
      setSavedBy("you");
      setHasPreviewed(false);
      setPreview(null);
      toast.success("Pricing configuration saved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border bg-card p-4">
        <h2 className="font-medium">Pricing Configuration</h2>

        <div className="mt-4 grid gap-4">
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <label className="text-sm font-medium">VAT Rate</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                value={vatPercent}
                onChange={(e) => setVatPercent(e.target.value)}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <label className="text-sm font-medium">Markup</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(e.target.value)}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] items-start gap-3">
            <div>
              <label className="text-sm font-medium">Exchange Rate</label>
              <p className="mt-0.5 text-xs text-muted-foreground">How many NGN one South African Rand buys</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground font-medium">1 ZAR =</span>
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="w-28"
              />
              <span className="text-muted-foreground font-medium">NGN</span>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_2fr] items-center gap-3">
            <label className="text-sm font-medium">Note</label>
            <Input
              type="text"
              value={exchangeNote}
              onChange={(e) => setExchangeNote(e.target.value)}
              placeholder="e.g. Rate updated 2026-06-15"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={previewing}>
            {previewing ? "Previewing…" : "Preview Impact"}
          </Button>
          <Button onClick={handleSave} disabled={!hasPreviewed || saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Last updated {new Date(savedAt).toLocaleString()}
          {savedBy ? ` by ${savedBy}` : ""}
        </p>
      </div>

      {preview && (
        <div className="rounded-lg border bg-card p-4 space-y-5">
          <h2 className="font-medium">Preview (before saving)</h2>

          {/* ── Step-by-step breakdown ── */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
              How the average product price is built
            </p>

            <div className="space-y-0">
              {/* Base price */}
              <BreakdownRow
                step={1}
                label="Base price (ex-VAT)"
                sublabel="Raw supplier price in ZAR"
                value={zar.format(preview.breakdown.avgRawZar)}
                isFirst
              />

              {/* VAT */}
              <BreakdownRow
                step={2}
                label={`VAT +${(preview.inputs.vatRate * 100).toFixed(2)}%`}
                sublabel={`× ${(1 + preview.inputs.vatRate).toFixed(4)}`}
                value={zar.format(preview.breakdown.afterVat)}
                delta={preview.breakdown.afterVat - preview.breakdown.avgRawZar}
                currency="ZAR"
              />

              {/* Markup */}
              <BreakdownRow
                step={3}
                label={`Markup +${preview.inputs.markupPercent.toFixed(2)}%`}
                sublabel={`× ${(1 + preview.inputs.markupPercent / 100).toFixed(4)}`}
                value={zar.format(preview.breakdown.afterMarkup)}
                delta={preview.breakdown.afterMarkup - preview.breakdown.afterVat}
                currency="ZAR"
              />

              {/* Exchange */}
              <BreakdownRow
                step={4}
                label={`Exchange rate × ${preview.inputs.exchangeRate}`}
                sublabel="1 ZAR → NGN"
                value={ngn.format(preview.breakdown.finalNgn)}
                isLast
              />
            </div>
          </div>

          {/* ── Catalogue impact ── */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
              Catalogue impact ({preview.impact.totalVariants.toLocaleString()} variants)
            </p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Min</p>
                <p className="font-medium mt-0.5">{ngn.format(preview.impact.minPriceNgn)}</p>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Average</p>
                <p className="font-medium mt-0.5">{ngn.format(preview.impact.avgPriceNgn)}</p>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Max</p>
                <p className="font-medium mt-0.5">{ngn.format(preview.impact.maxPriceNgn)}</p>
              </div>
            </div>
          </div>

          {/* ── Sample products ── */}
          {preview.impact.sampleProducts.length > 0 && (
            <div className="border-t border-border pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                Sample product changes
              </p>
              <div className="space-y-1.5">
                {preview.impact.sampleProducts.map((sample) => (
                  <div key={sample.fullCode} className="flex items-baseline justify-between text-sm gap-4">
                    <span className="text-muted-foreground truncate font-mono text-xs">{sample.fullCode}</span>
                    <span className="shrink-0 flex items-baseline gap-2">
                      <span className="text-muted-foreground">{ngn.format(sample.currentNgn)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{ngn.format(sample.newNgn)}</span>
                      <span className={`text-xs font-medium ${sample.changePct >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {sample.changePct >= 0 ? "+" : ""}{sample.changePct.toFixed(2)}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
