/*
 * Migration — run once against your database:
 *
 * CREATE TABLE IF NOT EXISTS contact_submissions (
 *   id          SERIAL PRIMARY KEY,
 *   name        TEXT        NOT NULL,
 *   email       TEXT        NOT NULL,
 *   phone       TEXT,
 *   company     TEXT,
 *   message     TEXT        NOT NULL,
 *   details     JSONB,
 *   created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  // extra form fields stored in details / included in notification email
  position?: string;
  service?: string;
  budget?: string;
  timeline?: string;
  location?: string;
  inspiration?: string;
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

async function sendNotification(data: ContactPayload): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;

  const html = `
    <h2>New Project Inquiry - De-Sign Plus</h2>
    <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <tr><td><strong>Name</strong></td><td>${esc(data.name)}</td></tr>
      <tr><td><strong>Email</strong></td><td>${esc(data.email)}</td></tr>
      ${data.phone ? `<tr><td><strong>Phone</strong></td><td>${esc(data.phone)}</td></tr>` : ""}
      ${data.company ? `<tr><td><strong>Company</strong></td><td>${esc(data.company)}</td></tr>` : ""}
      ${data.position ? `<tr><td><strong>Position</strong></td><td>${esc(data.position)}</td></tr>` : ""}
      ${data.service ? `<tr><td><strong>Service</strong></td><td>${esc(data.service)}</td></tr>` : ""}
      ${data.budget ? `<tr><td><strong>Budget</strong></td><td>${esc(data.budget)}</td></tr>` : ""}
      ${data.timeline ? `<tr><td><strong>Timeline</strong></td><td>${esc(data.timeline)}</td></tr>` : ""}
      ${data.location ? `<tr><td><strong>Location</strong></td><td>${esc(data.location)}</td></tr>` : ""}
    </table>
    <h3 style="margin-top:20px">Project Objectives</h3>
    <p style="white-space:pre-wrap">${esc(data.message)}</p>
    ${data.inspiration ? `<h3>Inspiration &amp; References</h3><p style="white-space:pre-wrap">${esc(data.inspiration)}</p>` : ""}
  `;

  if (!resendKey) {
    console.log("[contact] No email transport configured. Inquiry received:", {
      name: data.name,
      email: data.email,
      company: data.company,
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
      subject: `New Inquiry from ${data.name}${data.company ? ` - ${data.company}` : ""}`,
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

  const details = {
    position: data.position || null,
    service: data.service || null,
    budget: data.budget || null,
    timeline: data.timeline || null,
    location: data.location || null,
    inspiration: data.inspiration || null,
  };

  await pool.query(
    `INSERT INTO contact_submissions (name, email, phone, company, message, details)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [name, email, phone, company, message, JSON.stringify(details)]
  );

  // Fire-and-forget — don't let email failure break the 200 response
  sendNotification({ ...data, name, email, phone: phone ?? undefined, company: company ?? undefined, message }).catch(
    (err) => console.error("[contact] sendNotification threw:", err)
  );

  return NextResponse.json({ ok: true });
}
