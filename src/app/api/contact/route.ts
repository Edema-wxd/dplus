// Schema: docs/contact-schema.sql — apply with `npm run contact:schema`.

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { scoreLead } from "@/lib/lead-score";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  // the brief, stored in details and shown in the notification email
  service?: string;
  headcount?: number;
  neededBy?: string;
  role?: string;
  budget?: string;
  branding?: string;
  hamper?: string;
  // spam guards, never stored
  website?: string;
  elapsedMs?: number;
}

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

// ── Validation ────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(body: Record<string, unknown>): FieldErrors {
  const errors: FieldErrors = {};

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    errors.name = "Name is required";
  }

  if (!body.email || typeof body.email !== "string" || !EMAIL_RE.test(body.email.trim())) {
    errors.email = "A valid email address is required";
  }

  if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
    errors.message = "Please describe your project objectives";
  }

  return errors;
}

// ── Email notification ────────────────────────────────────────────────────────

async function sendNotification(
  data: ContactPayload,
  lead: ReturnType<typeof scoreLead>
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;

  const row = (label: string, value?: string | number | null) =>
    value === undefined || value === null || value === ""
      ? ""
      : `<tr><td style="padding:6px 12px 6px 0"><strong>${esc(label)}</strong></td><td style="padding:6px 0">${esc(String(value))}</td></tr>`;

  const html = `
    <p style="font-family:sans-serif;font-size:13px;margin:0 0 4px">
      <strong>${lead.tier.toUpperCase()}</strong> — lead score ${lead.score}/100
    </p>
    ${
      lead.signals.length
        ? `<p style="font-family:sans-serif;font-size:13px;color:#555;margin:0 0 18px">${lead.signals
            .map(esc)
            .join(" &middot; ")}</p>`
        : ""
    }
    <h2 style="font-family:sans-serif">New brief from ${esc(data.name)}</h2>
    <table cellpadding="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      ${row("Email", data.email)}
      ${row("Phone", data.phone)}
      ${row("Company", data.company)}
      ${row("Signs off", data.role)}
      ${row("Needs", data.service)}
      ${row("Headcount", data.headcount)}
      ${row("Needed by", data.neededBy)}
      ${row("Budget", data.budget)}
      ${row("Branding", data.branding)}
      ${row("From hamper", data.hamper)}
    </table>
    <h3 style="font-family:sans-serif;margin-top:20px">The brief</h3>
    <p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap">${esc(data.message)}</p>
  `;

  if (!resendKey) {
    console.log("[contact] No email transport configured. Brief received:", {
      name: data.name,
      email: data.email,
      tier: lead.tier,
      score: lead.score,
    });
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "notifications@de-signplus.com",
      to: "hello@de-signplus.com",
      reply_to: data.email,
      subject: `[${lead.tier.toUpperCase()} ${lead.score}] ${data.name}${
        data.company ? ` — ${data.company}` : ""
      }${data.headcount ? ` — ${data.headcount} people` : ""}`,
      html,
    }),
  });

  if (!res.ok) {
    console.error("[contact] Resend delivery failed:", res.status, await res.text().catch(() => ""));
  }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Bots fill hidden fields and submit instantly; people do neither.
  const probe = body as Record<string, unknown>;
  if (typeof probe.website === "string" && probe.website.trim()) {
    return NextResponse.json({ ok: true });
  }
  if (typeof probe.elapsedMs === "number" && probe.elapsedMs < 2000) {
    return NextResponse.json({ ok: true });
  }

  const errors = validate(body as Record<string, unknown>);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const data = body as ContactPayload;
  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  const phone = data.phone?.trim() || null;
  const company = data.company?.trim() || null;
  const message = data.message.trim();

  const headcount =
    typeof data.headcount === "number" && Number.isFinite(data.headcount)
      ? Math.max(0, Math.round(data.headcount))
      : null;

  const lead = scoreLead({
    headcount,
    budget: data.budget,
    neededBy: data.neededBy,
    role: data.role,
    company,
    phone,
  });

  const details = {
    service: data.service || null,
    headcount,
    neededBy: data.neededBy || null,
    role: data.role || null,
    budget: data.budget || null,
    branding: data.branding || null,
    hamper: data.hamper || null,
    leadScore: lead.score,
    leadTier: lead.tier,
    leadSignals: lead.signals,
  };

  await pool.query(
    `INSERT INTO contact_submissions (name, email, phone, company, message, details)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [name, email, phone, company, message, JSON.stringify(details)]
  );

  // Fire-and-forget — don't let email failure break the 200 response
  sendNotification(
    { ...data, name, email, phone: phone ?? undefined, company: company ?? undefined, message },
    lead
  ).catch(
    (err) => console.error("[contact] sendNotification threw:", err)
  );

  return NextResponse.json({ ok: true });
}
