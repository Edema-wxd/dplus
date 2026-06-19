/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { PATCH } from "../[id]/status/route";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/orders", () => ({
  VALID_STATUSES: ["new", "reviewing", "confirmed", "cancelled"],
  updateOrderStatus: jest.fn(),
}));

import { auth } from "@/lib/auth";
import { updateOrderStatus, VALID_STATUSES } from "@/lib/orders";

const mockAuth = auth as jest.MockedFunction<() => Promise<unknown>>;
const mockUpdateOrderStatus = updateOrderStatus as jest.MockedFunction<typeof updateOrderStatus>;

function makeReq(id: string, body: unknown, invalidJson = false) {
  return new NextRequest(`http://localhost/api/admin/orders/${id}/status`, {
    method: "PATCH",
    body: invalidJson ? "not-json{{{" : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("PATCH /api/admin/orders/[id]/status", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when no session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PATCH(makeReq("1", { status: "new" }), params("1"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when id is a non-integer string", async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);
    const res = await PATCH(makeReq("abc", { status: "new" }), params("abc"));
    expect(res.status).toBe(400);
  });

  it('returns 400 when id is "0"', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);
    const res = await PATCH(makeReq("0", { status: "new" }), params("0"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when id is negative", async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);
    const res = await PATCH(makeReq("-5", { status: "new" }), params("-5"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when status is not in VALID_STATUSES", async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);
    const res = await PATCH(makeReq("1", { status: "shipped" }), params("1"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when request body is invalid JSON", async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);
    const res = await PATCH(makeReq("1", null, true), params("1"));
    expect(res.status).toBe(400);
  });

  it.each(VALID_STATUSES)(
    "calls updateOrderStatus and returns updated order for status=%s",
    async (status) => {
      mockAuth.mockResolvedValue({ user: {} } as never);
      const mockOrder = { id: 42, status };
      mockUpdateOrderStatus.mockResolvedValue(mockOrder as never);

      const res = await PATCH(makeReq("42", { status }), params("42"));

      expect(mockUpdateOrderStatus).toHaveBeenCalledWith(42, status);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(mockOrder);
    }
  );
});
