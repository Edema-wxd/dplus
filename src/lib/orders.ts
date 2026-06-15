import { pool } from "@/lib/db";

export type OrderItem = {
  simpleCode: string;
  fullCode: string;
  productName: string;
  image: string | null;
  variantLabel: string | null;
  brandingLabel: string | null;
  quantity: number;
  price: number;
};

export type Order = {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  notes: string | null;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
};

type OrderRow = {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  notes: string | null;
  items: OrderItem[];
  total: string;
  status: string;
  created_at: string;
};

function mapRow(row: OrderRow): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    notes: row.notes,
    items: row.items,
    total: Number(row.total),
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function createOrder(input: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  notes?: string | null;
  items: OrderItem[];
  total: number;
}): Promise<Order> {
  const { rows } = await pool.query<OrderRow>(
    `
    insert into orders (customer_name, customer_email, customer_phone, notes, items, total)
    values ($1, $2, $3, $4, $5, $6)
    returning *
    `,
    [
      input.customerName,
      input.customerEmail,
      input.customerPhone || null,
      input.notes || null,
      JSON.stringify(input.items),
      input.total,
    ]
  );
  return mapRow(rows[0]);
}

export async function getOrders(): Promise<Order[]> {
  const { rows } = await pool.query<OrderRow>(
    `select * from orders order by created_at desc`
  );
  return rows.map(mapRow);
}
