import { NextResponse } from "next/server";
import { createOrder, type OrderItem } from "@/lib/orders";

export async function POST(req: Request) {
  const body = await req.json();

  const { customerName, customerEmail, customerPhone, notes, items, total } = body as {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    notes?: string;
    items?: OrderItem[];
    total?: number;
  };

  if (!customerName || !customerEmail || !items || !items.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const order = await createOrder({
    customerName,
    customerEmail,
    customerPhone,
    notes,
    items,
    total: total ?? items.reduce((sum, i) => sum + i.quantity * i.price, 0),
  });

  return NextResponse.json({ order });
}
