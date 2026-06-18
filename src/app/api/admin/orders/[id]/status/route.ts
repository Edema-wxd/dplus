import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateOrderStatus, VALID_STATUSES, type OrderStatus } from "@/lib/orders";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId < 1) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const status: unknown = body?.status;

  if (!VALID_STATUSES.includes(status as OrderStatus)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const order = await updateOrderStatus(orderId, status as OrderStatus);
  return NextResponse.json(order);
}
