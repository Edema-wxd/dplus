/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET } from "../route";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/orders", () => ({ getOrders: jest.fn() }));

import { auth } from "@/lib/auth";
import { getOrders } from "@/lib/orders";

const mockAuth = auth as unknown as jest.Mock;
const mockGetOrders = getOrders as jest.MockedFunction<typeof getOrders>;

function makeReq(search = "") {
  return new NextRequest(`http://localhost/api/admin/orders${search}`);
}

describe("GET /api/admin/orders", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when auth() returns null", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("calls getOrders with correct params when all query params are provided", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } } as never);
    mockGetOrders.mockResolvedValue([] as never);

    await GET(makeReq("?status=reviewing&search=acme&limit=5&offset=10"));

    expect(mockGetOrders).toHaveBeenCalledWith({
      status: "reviewing",
      search: "acme",
      limit: 5,
      offset: 10,
    });
  });

  it("uses defaults (limit=20, offset=0) when params are absent", async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);
    mockGetOrders.mockResolvedValue([] as never);

    await GET(makeReq());

    expect(mockGetOrders).toHaveBeenCalledWith({
      status: undefined,
      search: undefined,
      limit: 20,
      offset: 0,
    });
  });

  it("returns JSON result from getOrders on success", async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);
    const mockResult = { items: [{ id: 1, customerName: "Alice" }], total: 1, hasMore: false };
    mockGetOrders.mockResolvedValue(mockResult as never);

    const res = await GET(makeReq());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockResult);
  });
});
