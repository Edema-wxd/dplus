import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || (body.job !== "daily" && body.job !== "weekly")) {
    return NextResponse.json({ error: "Invalid job. Must be 'daily' or 'weekly'" }, { status: 400 });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const host = req.headers.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const baseUrl = process.env.NEXTAUTH_URL ?? `${protocol}://${host}`;
  const endpoint = `${baseUrl}/api/cron/amrod-${body.job}`;

  const cronRes = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${cronSecret}` },
  });

  const data = await cronRes.json().catch(() => ({ ok: cronRes.ok }));
  return NextResponse.json(data, { status: cronRes.status });
}
