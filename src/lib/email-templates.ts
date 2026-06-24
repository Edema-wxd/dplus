import type { Order, OrderItem } from "@/lib/orders";

// ── shared helpers ────────────────────────────────────────

function formatNGN(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function itemLabel(item: OrderItem): string {
  const parts = [item.productName];
  if (item.variantLabel) parts.push(item.variantLabel);
  if (item.brandingLabel) parts.push(item.brandingLabel);
  return parts.join(" · ");
}

function itemsTableHtml(items: OrderItem[]): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#374151;">
          ${itemLabel(item)}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;color:#374151;">
          ${item.quantity}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#374151;">
          ${formatNGN(item.price)}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:#111827;">
          ${formatNGN(item.quantity * item.price)}
        </td>
      </tr>`
    )
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border-collapse:collapse;margin:24px 0;font-size:14px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;
                     text-transform:uppercase;letter-spacing:.05em;
                     color:#6b7280;font-weight:600;">Item</th>
          <th style="padding:10px 12px;text-align:center;font-size:12px;
                     text-transform:uppercase;letter-spacing:.05em;
                     color:#6b7280;font-weight:600;">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;
                     text-transform:uppercase;letter-spacing:.05em;
                     color:#6b7280;font-weight:600;">Unit</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;
                     text-transform:uppercase;letter-spacing:.05em;
                     color:#6b7280;font-weight:600;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function wrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;background:#ffffff;border-radius:8px;
                      overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
          <!-- header -->
          <tr>
            <td style="background:#1a1a1a;padding:24px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;
                           letter-spacing:-.02em;">De-Sign Plus</span>
            </td>
          </tr>
          <!-- body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e5e7eb;
                       font-size:12px;color:#9ca3af;text-align:center;">
              De-Sign Plus · Nigeria's Premier Corporate Gifting Partner
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── customer receipt ──────────────────────────────────────

export function orderReceiptHtml(order: Order): string {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
      Thank you, ${order.customerName}!
    </h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
      We've received your quote request and will be in touch shortly to confirm
      the details.
    </p>

    <p style="margin:0 0 4px;font-size:13px;font-weight:600;
              text-transform:uppercase;letter-spacing:.05em;color:#6b7280;">
      Order reference
    </p>
    <p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#111827;">
      #${order.id}
    </p>

    ${itemsTableHtml(order.items)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      <tr>
        <td style="font-size:15px;font-weight:700;color:#111827;">Total</td>
        <td style="font-size:15px;font-weight:700;color:#111827;text-align:right;">
          ${formatNGN(order.total)}
        </td>
      </tr>
    </table>

    <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;">

    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
      A member of our team will contact you at
      <strong style="color:#374151;">${order.customerEmail}</strong>
      ${order.customerPhone ? `or <strong style="color:#374151;">${order.customerPhone}</strong> ` : ""}
      to confirm availability, finalise branding details, and issue a formal
      proforma invoice.
    </p>`;

  return wrapper(content);
}

// ── admin alert ───────────────────────────────────────────

export function orderAlertHtml(order: Order): string {
  const content = `
    <h1 style="margin:0 0 24px;font-size:20px;font-weight:700;color:#111827;">
      New order #${order.id}
    </h1>

    <table cellpadding="0" cellspacing="0"
           style="font-size:14px;margin-bottom:24px;line-height:1.8;">
      <tr>
        <td style="color:#6b7280;padding-right:16px;white-space:nowrap;">Customer</td>
        <td style="color:#111827;font-weight:600;">${order.customerName}</td>
      </tr>
      <tr>
        <td style="color:#6b7280;padding-right:16px;">Email</td>
        <td style="color:#111827;">${order.customerEmail}</td>
      </tr>
      ${
        order.customerPhone
          ? `<tr>
               <td style="color:#6b7280;padding-right:16px;">Phone</td>
               <td style="color:#111827;">${order.customerPhone}</td>
             </tr>`
          : ""
      }
      ${
        order.notes
          ? `<tr>
               <td style="color:#6b7280;padding-right:16px;vertical-align:top;">Notes</td>
               <td style="color:#111827;">${order.notes}</td>
             </tr>`
          : ""
      }
    </table>

    ${itemsTableHtml(order.items)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      <tr>
        <td style="font-size:15px;font-weight:700;color:#111827;">Total</td>
        <td style="font-size:15px;font-weight:700;color:#111827;text-align:right;">
          ${formatNGN(order.total)}
        </td>
      </tr>
    </table>`;

  return wrapper(content);
}
