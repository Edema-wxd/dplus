"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PricingConfig, PricingPreview } from "@/lib/pricing";

const ngn = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" });

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

          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <label className="text-sm font-medium">Exchange Rate</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.0001"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">ZAR &rarr; NGN</span>
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
        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-medium">Preview (before saving)</h2>

          <div className="mt-3 grid gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total variants affected</span>
              <span>{preview.impact.totalVariants.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price range</span>
              <span>
                {ngn.format(preview.impact.minPriceNgn)} &ndash; {ngn.format(preview.impact.maxPriceNgn)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average price</span>
              <span>{ngn.format(preview.impact.avgPriceNgn)}</span>
            </div>
          </div>

          {preview.impact.sampleProducts.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-muted-foreground">Sample changes</h3>
              <div className="mt-2 flex flex-col gap-1">
                {preview.impact.sampleProducts.map((sample) => (
                  <div key={sample.fullCode} className="flex justify-between text-sm">
                    <span>{sample.fullCode}</span>
                    <span>
                      {ngn.format(sample.currentNgn)} &rarr; {ngn.format(sample.newNgn)}{" "}
                      <span className={sample.changePct >= 0 ? "text-green-600" : "text-red-600"}>
                        ({sample.changePct >= 0 ? "+" : ""}
                        {sample.changePct.toFixed(2)}%)
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
