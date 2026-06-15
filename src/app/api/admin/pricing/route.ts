import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { getPricingConfig, updatePricingConfig } from "@/lib/pricing";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await getPricingConfig();
  return NextResponse.json(config);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { vatRate, markupPercent, exchangeRate, exchangeNote } = body as Record<string, unknown>;
  const patch: { vatRate?: number; markupPercent?: number; exchangeRate?: number; exchangeNote?: string } = {};
  const errors: Record<string, string> = {};

  if (vatRate !== undefined) {
    if (typeof vatRate !== "number" || vatRate < 0 || vatRate > 1) {
      errors.vatRate = "vatRate must be a number between 0 and 1";
    } else {
      patch.vatRate = vatRate;
    }
  }

  if (markupPercent !== undefined) {
    if (typeof markupPercent !== "number" || markupPercent < 0 || markupPercent > 500) {
      errors.markupPercent = "markupPercent must be a number between 0 and 500";
    } else {
      patch.markupPercent = markupPercent;
    }
  }

  if (exchangeRate !== undefined) {
    if (typeof exchangeRate !== "number" || exchangeRate <= 0) {
      errors.exchangeRate = "exchangeRate must be a number greater than 0";
    } else {
      patch.exchangeRate = exchangeRate;
    }
  }

  if (exchangeNote !== undefined) {
    if (typeof exchangeNote !== "string") {
      errors.exchangeNote = "exchangeNote must be a string";
    } else {
      patch.exchangeNote = exchangeNote;
    }
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ errors: { _: "At least one field must be present" } }, { status: 400 });
  }

  const { rows } = await pool.query<{ id: string }>(
    "select id from admin_users where email = $1",
    [session.user.email.toLowerCase()]
  );
  const updatedBy = rows[0]?.id ?? null;

  const config = await updatePricingConfig(patch, updatedBy);
  return NextResponse.json(config);
}
