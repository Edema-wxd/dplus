import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPricingPreview } from "@/lib/pricing";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const markup = searchParams.get("markup");
  const rate = searchParams.get("rate");
  const vat = searchParams.get("vat");

  const overrides: { vatRate?: number; markupPercent?: number; exchangeRate?: number } = {};

  if (markup !== null) {
    const value = Number(markup);
    if (Number.isNaN(value) || value < 0 || value > 500) {
      return NextResponse.json({ error: "markup must be a number between 0 and 500" }, { status: 400 });
    }
    overrides.markupPercent = value;
  }

  if (rate !== null) {
    const value = Number(rate);
    if (Number.isNaN(value) || value <= 0) {
      return NextResponse.json({ error: "rate must be a number greater than 0" }, { status: 400 });
    }
    overrides.exchangeRate = value;
  }

  if (vat !== null) {
    const value = Number(vat);
    if (Number.isNaN(value) || value < 0 || value > 1) {
      return NextResponse.json({ error: "vat must be a number between 0 and 1" }, { status: 400 });
    }
    overrides.vatRate = value;
  }

  const preview = await getPricingPreview(overrides);
  return NextResponse.json(preview);
}
