import { NextResponse } from "next/server";
import { createOrder, type OrderItem } from "@/lib/orders";
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

  const invalidItem = items.findIndex(
    (i) =>
      typeof i !== "object" ||
      i === null ||
      !Number.isInteger((i as Record<string, unknown>).quantity) ||
      ((i as Record<string, unknown>).quantity as number) < 1 ||
      typeof (i as Record<string, unknown>).price !== "number" ||
      ((i as Record<string, unknown>).price as number) <= 0
  );

  if (invalidItem !== -1) {
    return NextResponse.json(
      { error: `Item at index ${invalidItem} has invalid quantity or price` },
      { status: 400 }
    );
  }

  const validatedItems = items as OrderItem[];
  const total = validatedItems.reduce((sum, i) => sum + i.quantity * i.price, 0);

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
