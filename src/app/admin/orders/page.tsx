import { getOrders } from "@/lib/orders";

const currency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Orders</h1>

      {orders.length === 0 ? (
        <p className="mt-2 text-muted-foreground">Customer orders will appear here.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{order.customerName}</div>
                  <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                  {order.customerPhone && (
                    <div className="text-sm text-muted-foreground">{order.customerPhone}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm font-medium capitalize">{order.status}</div>
                </div>
              </div>

              {order.notes && (
                <p className="mt-2 text-sm text-muted-foreground">Notes: {order.notes}</p>
              )}

              <div className="mt-4 flex flex-col gap-2">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm border-t pt-2"
                  >
                    <div>
                      <div>{item.productName}</div>
                      <div className="text-muted-foreground text-xs">
                        {[item.variantLabel, item.brandingLabel].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <div>
                        {item.quantity} x {currency.format(item.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-end text-sm font-semibold">
                Total: {currency.format(order.total)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
