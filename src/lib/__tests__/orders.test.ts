// Mock the db module before any imports so every import of @/lib/db
// gets the mock, not the real pg pool.
jest.mock("@/lib/db", () => ({
  pool: { query: jest.fn() },
}));

import { pool } from "@/lib/db";
import {
  createOrder,
  getOrders,
  getNewOrderCount,
  getOrderStats,
  updateOrderStatus,
  type OrderItem,
} from "@/lib/orders";

const mockQuery = pool.query as jest.Mock;

// Shared fake row for a single order
const fakeRow = {
  id: 1,
  customer_name: "Jane Doe",
  customer_email: "jane@example.com",
  customer_phone: "+2348012345678",
  notes: "Please gift-wrap",
  items: [
    {
      simpleCode: "ABC",
      fullCode: "ABC-RED-LG",
      productName: "T-Shirt",
      image: null,
      variantLabel: "Red / Large",
      brandingLabel: "Screen print",
      quantity: 2,
      price: 5000,
    },
  ],
  total: "10000",
  status: "new",
  created_at: "2024-01-15T10:00:00.000Z",
};

beforeEach(() => {
  mockQuery.mockReset();
});

// ── createOrder ───────────────────────────────────────────

describe("createOrder", () => {
  it("calls pool.query with correct positional parameters", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow] });

    const items: OrderItem[] = [fakeRow.items[0]];
    await createOrder({
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      customerPhone: "+2348012345678",
      notes: "Please gift-wrap",
      items,
      total: 10000,
    });

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [, params] = mockQuery.mock.calls[0];
    expect(params[0]).toBe("Jane Doe");
    expect(params[1]).toBe("jane@example.com");
    expect(params[2]).toBe("+2348012345678");
    expect(params[3]).toBe("Please gift-wrap");
    expect(params[4]).toBe(JSON.stringify(items));
    expect(params[5]).toBe(10000);
  });

  it("returns a correctly mapped Order with numeric total", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow] });

    const order = await createOrder({
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      items: [fakeRow.items[0]],
      total: 10000,
    });

    expect(order.id).toBe(1);
    expect(order.customerName).toBe("Jane Doe");
    expect(order.customerEmail).toBe("jane@example.com");
    expect(order.total).toBe(10000);
    expect(typeof order.total).toBe("number");
    expect(order.status).toBe("new");
    expect(order.createdAt).toBe(fakeRow.created_at);
  });

  it("passes null for optional phone and notes when omitted", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ ...fakeRow, customer_phone: null, notes: null }] });

    await createOrder({
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      items: [fakeRow.items[0]],
      total: 10000,
    });

    const [, params] = mockQuery.mock.calls[0];
    expect(params[2]).toBeNull(); // phone
    expect(params[3]).toBeNull(); // notes
  });
});

// ── getOrders ─────────────────────────────────────────────

describe("getOrders", () => {
  function setupQueryMocks(countValue: number, rows: typeof fakeRow[] = []) {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: String(countValue) }] }) // count
      .mockResolvedValueOnce({ rows });                                  // select
  }

  it("runs queries with no WHERE clause when no opts provided", async () => {
    setupQueryMocks(0);

    await getOrders();

    const [countSql] = mockQuery.mock.calls[0];
    const [selectSql] = mockQuery.mock.calls[1];
    expect(countSql).not.toContain("where");
    expect(selectSql).not.toContain("where");
  });

  it("adds status filter to both queries when status provided", async () => {
    setupQueryMocks(3, [fakeRow]);

    await getOrders({ status: "new" });

    const [countSql, countParams] = mockQuery.mock.calls[0];
    const [selectSql, selectParams] = mockQuery.mock.calls[1];

    expect(countSql).toContain("where");
    expect(countSql).toContain("status = $1");
    expect(countParams[0]).toBe("new");

    expect(selectSql).toContain("status = $1");
    expect(selectParams[0]).toBe("new");
  });

  it("adds ILIKE search on name and email when search provided", async () => {
    setupQueryMocks(1, [fakeRow]);

    await getOrders({ search: "jane" });

    const [countSql, countParams] = mockQuery.mock.calls[0];
    const [selectSql] = mockQuery.mock.calls[1];

    expect(countSql).toContain("ILIKE");
    expect(countSql).toContain("customer_name");
    expect(countSql).toContain("customer_email");
    expect(countParams[0]).toBe("%jane%");

    expect(selectSql).toContain("ILIKE");
  });

  it("returns the total from the count query as a number", async () => {
    setupQueryMocks(42, []);

    const result = await getOrders();

    expect(result.total).toBe(42);
    expect(typeof result.total).toBe("number");
  });

  it("forwards limit and offset correctly", async () => {
    setupQueryMocks(100, []);

    await getOrders({ limit: 10, offset: 30 });

    const [, selectParams] = mockQuery.mock.calls[1];
    // Without other filters, limit and offset are the only params
    expect(selectParams).toContain(10);
    expect(selectParams).toContain(30);
  });

  it("defaults to limit=20, offset=0 when not provided", async () => {
    setupQueryMocks(0, []);

    await getOrders();

    const [, selectParams] = mockQuery.mock.calls[1];
    expect(selectParams).toContain(20);
    expect(selectParams).toContain(0);
  });

  it("maps returned rows into Order objects", async () => {
    setupQueryMocks(1, [fakeRow]);

    const result = await getOrders();

    expect(result.orders).toHaveLength(1);
    expect(result.orders[0].customerName).toBe("Jane Doe");
    expect(typeof result.orders[0].total).toBe("number");
  });
});

// ── updateOrderStatus ─────────────────────────────────────

describe("updateOrderStatus", () => {
  it("returns the mapped Order on success", async () => {
    const updatedRow = { ...fakeRow, status: "confirmed" };
    mockQuery.mockResolvedValueOnce({ rows: [updatedRow] });

    const order = await updateOrderStatus(1, "confirmed");

    expect(order.id).toBe(1);
    expect(order.status).toBe("confirmed");
    expect(typeof order.total).toBe("number");
  });

  it("throws 'Order X not found' when no row is returned", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(updateOrderStatus(99, "confirmed")).rejects.toThrow(
      "Order 99 not found"
    );
  });
});

// ── getNewOrderCount ──────────────────────────────────────

describe("getNewOrderCount", () => {
  it("returns a number, not a string", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ count: "7" }] });

    const count = await getNewOrderCount();

    expect(count).toBe(7);
    expect(typeof count).toBe("number");
  });
});

// ── getOrderStats ─────────────────────────────────────────

describe("getOrderStats", () => {
  it("returns correct total and byStatus aggregation", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { status: "new", count: "5" },
        { status: "confirmed", count: "12" },
        { status: "cancelled", count: "3" },
      ],
    });

    const stats = await getOrderStats();

    expect(stats.total).toBe(20);
    expect(stats.byStatus).toEqual({ new: 5, confirmed: 12, cancelled: 3 });
  });

  it("returns total of 0 and empty byStatus when no orders exist", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const stats = await getOrderStats();

    expect(stats.total).toBe(0);
    expect(stats.byStatus).toEqual({});
  });
});
