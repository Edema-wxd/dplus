import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRecentSyncLog } from "@/lib/amrod/sync/log";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getRecentSyncLog(20);
  return NextResponse.json(data);
}
