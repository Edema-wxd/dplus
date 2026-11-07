// Schema: docs/contact-schema.sql — apply with `npm run contact:schema`.

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { CAPTCHA_ERROR, CAPTCHA_FIELD, verifyCaptcha } from "@/lib/captcha";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.email !== "string" || !EMAIL_RE.test(body.email.trim())) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }

  if (!(await verifyCaptcha(body[CAPTCHA_FIELD]))) {
    return NextResponse.json({ error: CAPTCHA_ERROR }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();

  await pool.query(
    `INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
    [email]
  );

  return NextResponse.json({ ok: true });
}
