/*
 * Migration — run once against your database:
 *
 * CREATE TABLE IF NOT EXISTS newsletter_subscribers (
 *   email          TEXT        PRIMARY KEY,
 *   subscribed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.email !== "string" || !EMAIL_RE.test(body.email.trim())) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();

  await pool.query(
    `INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
    [email]
  );

  return NextResponse.json({ ok: true });
}
