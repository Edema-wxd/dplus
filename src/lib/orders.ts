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

export async function getOrders(opts?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ orders: Order[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (opts?.status) {
    params.push(opts.status);
    conditions.push(`status = $${params.length}`);
  }

  if (opts?.search) {
    params.push(`%${opts.search}%`);
    conditions.push(
      `(customer_name ILIKE $${params.length} OR customer_email ILIKE $${params.length})`
    );
  }

  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";

  const countResult = await pool.query<{ count: string }>(
    `select count(*) from orders ${where}`,
    params
  );
  const total = Number(countResult.rows[0].count);

  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;
  params.push(limit, offset);

  const { rows } = await pool.query<OrderRow>(
    `select * from orders ${where} order by created_at desc limit $${params.length - 1} offset $${params.length}`,
    params
  );

  return { orders: rows.map(mapRow), total };
}

export async function getOrderById(id: number): Promise<Order | null> {
  const { rows } = await pool.query<OrderRow>(
    `select * from orders where id = $1`,
    [id]
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export { VALID_STATUSES, type OrderStatus } from "@/lib/order-constants";
import { type OrderStatus } from "@/lib/order-constants";

export async function updateOrderStatus(
  id: number,
  status: OrderStatus
): Promise<Order> {
  const { rows } = await pool.query<OrderRow>(
    `update orders set status = $1 where id = $2 returning *`,
    [status, id]
  );
  if (!rows[0]) throw new Error(`Order ${id} not found`);
  return mapRow(rows[0]);
}

export async function getNewOrderCount(): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `select count(*) from orders where status = 'new'`
  );
  return Number(rows[0].count);
}

export type OrderStats = {
  total: number;
  byStatus: Record<string, number>;
};

export async function getOrderStats(): Promise<OrderStats> {
  const { rows } = await pool.query<{ status: string; count: string }>(
    `select status, count(*) from orders group by status`
  );
  const byStatus: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    byStatus[row.status] = Number(row.count);
    total += Number(row.count);
  }
  return { total, byStatus };
}

export async function getRecentOrders(limit = 5): Promise<Order[]> {
  const { rows } = await pool.query<OrderRow>(
    `select * from orders order by created_at desc limit $1`,
    [limit]
  );
  return rows.map(mapRow);
}
