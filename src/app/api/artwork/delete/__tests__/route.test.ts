/**
 * @jest-environment node
 */
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: () => Promise.resolve(body),
    })),
  },
}));
jest.mock("@/lib/orders", () => ({ getArtworkKeysInOrders: jest.fn() }));
jest.mock("@/lib/uploadthing", () => ({ deleteUploadedFiles: jest.fn() }));

import { POST } from "@/app/api/artwork/delete/route";
import { getArtworkKeysInOrders } from "@/lib/orders";
import { deleteUploadedFiles } from "@/lib/uploadthing";
import { signArtworkKey } from "@/lib/artwork-token";

const mockInOrders = getArtworkKeysInOrders as jest.Mock;
const mockDelete = deleteUploadedFiles as jest.Mock;

function request(body: unknown): Request {
  return { json: () => Promise.resolve(body) } as unknown as Request;
}

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret";
});

beforeEach(() => {
  jest.clearAllMocks();
  mockInOrders.mockResolvedValue(new Set());
});

it("deletes files with valid tokens", async () => {
  const res = await POST(
    request({ files: [{ key: "k1", token: signArtworkKey("k1") }, { key: "k2", token: signArtworkKey("k2") }] })
  );
  expect(res.status).toBe(200);
  expect(mockDelete).toHaveBeenCalledWith(["k1", "k2"]);
});

it("keeps files attached to a submitted order", async () => {
  mockInOrders.mockResolvedValue(new Set(["k1"]));
  const res = await POST(
    request({ files: [{ key: "k1", token: signArtworkKey("k1") }, { key: "k2", token: signArtworkKey("k2") }] })
  );
  expect(mockDelete).toHaveBeenCalledWith(["k2"]);
  expect(await res.json()).toEqual({ deleted: 1, kept: 1 });
});

it("refuses the whole request if any token is wrong", async () => {
  const res = await POST(
    request({ files: [{ key: "k1", token: signArtworkKey("k1") }, { key: "k2", token: signArtworkKey("k1") }] })
  );
  expect(res.status).toBe(403);
  expect(mockDelete).not.toHaveBeenCalled();
});

it.each([[{}], [{ files: [] }], [{ files: Array(26).fill({ key: "k", token: "t" }) }], [null]])(
  "rejects a bad body %#",
  async (body) => {
    const res = await POST(request(body));
    expect(res.status).toBe(400);
    expect(mockDelete).not.toHaveBeenCalled();
  }
);
