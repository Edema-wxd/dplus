import { NextResponse } from "next/server";
import { createOrder, type OrderItem } from "@/lib/orders";
import { parseOrderItem } from "@/lib/order-items";
import { lineTotals } from "@/lib/branding-pricing";
import { sendEmail } from "@/lib/email";
import { orderReceiptHtml, orderAlertHtml } from "@/lib/email-templates";

export async function POST(req: Request) {
  const body = await req.json();

  const { customerName, customerEmail, customerPhone, notes, items } = body as {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    notes?: string;
    items?: unknown[];
  };

  if (!customerName || !customerEmail || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validatedItems: OrderItem[] = [];
  for (const [index, raw] of items.entries()) {
    const parsed = parseOrderItem(raw);
    if (typeof parsed === "string") {
      return NextResponse.json({ error: `Item at index ${index} ${parsed}` }, { status: 400 });
    }
    validatedItems.push(parsed);
  }

  // Includes branding setup fees and per-unit print costs.
  const total = validatedItems.reduce((sum, i) => sum + lineTotals(i).total, 0);

  const order = await createOrder({
    customerName,
    customerEmail,
    customerPhone,
    notes,
    items: validatedItems,
    total,
  });

  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.NOTIFY_EMAIL;

  await Promise.allSettled([
    sendEmail({
      to: order.customerEmail,
      subject: `Your De-Sign Plus quote request (#${order.id})`,
      html: orderReceiptHtml(order),
    }),
    ...(adminEmail
      ? [
          sendEmail({
            to: adminEmail,
            subject: `New order #${order.id} from ${order.customerName}`,
            html: orderAlertHtml(order),
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ order });
}
