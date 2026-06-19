// Mock next/server so we don't need a real Next.js runtime in tests.
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: () => Promise.resolve(body),
    })),
  },
}));

// Mock the orders lib so the route is tested in isolation.
jest.mock("@/lib/orders", () => ({
  createOrder: jest.fn(),
}));

import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { POST } from "@/app/api/orders/route";
import type { Order } from "@/lib/orders";

const mockCreateOrder = createOrder as jest.Mock;
const mockNextResponseJson = NextResponse.json as jest.Mock;

// Minimal helper — the route only calls req.json()
function makeRequest(body: unknown): Request {
  return { json: () => Promise.resolve(body) } as unknown as Request;
}

const validItem = {
  simpleCode: "ABC",
  fullCode: "ABC-RED-LG",
  productName: "T-Shirt",
  image: null,
  variantLabel: "Red / Large",
  brandingLabel: null,
  quantity: 2,
  price: 5000,
};

const fakeOrder: Order = {
  id: 1,
  customerName: "Jane Doe",
  customerEmail: "jane@example.com",
  customerPhone: null,
  notes: null,
  items: [validItem],
  total: 10000,
  status: "new",
  createdAt: "2024-01-15T10:00:00.000Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateOrder.mockResolvedValue(fakeOrder);
  // Default mock: just pass through status / body
  mockNextResponseJson.mockImplementation(
    (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: () => Promise.resolve(body),
    })
  );
});

// ── validation ────────────────────────────────────────────

describe("POST /api/orders — validation", () => {
  it("returns 400 when customerName is missing", async () => {
    const req = makeRequest({
      customerEmail: "jane@example.com",
      items: [validItem],
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 400 when customerEmail is missing", async () => {
    const req = makeRequest({
      customerName: "Jane Doe",
      items: [validItem],
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 400 when items is an empty array", async () => {
    const req = makeRequest({
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      items: [],
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 400 when items is missing entirely", async () => {
    const req = makeRequest({
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ── success ───────────────────────────────────────────────

describe("POST /api/orders — success", () => {
  it("returns 200 with { order } when all required fields are present", async () => {
    const req = makeRequest({
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      items: [validItem],
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("order");
    expect(body.order.id).toBe(1);
  });

  it("calculates total from items when total is omitted", async () => {
    const req = makeRequest({
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      items: [validItem], // quantity=2, price=5000 → total=10000
    });

    await POST(req);

    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({ total: 10000 })
    );
  });

  it("uses the provided total when supplied", async () => {
    const req = makeRequest({
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      items: [validItem],
      total: 9999,
    });

    await POST(req);

    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({ total: 9999 })
    );
  });

  it("passes customerName and customerEmail through to createOrder", async () => {
    const req = makeRequest({
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      items: [validItem],
    });

    await POST(req);

    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: "Jane Doe",
        customerEmail: "jane@example.com",
      })
    );
  });
});
