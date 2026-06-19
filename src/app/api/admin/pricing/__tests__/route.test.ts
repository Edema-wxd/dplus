/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET, PATCH } from "../route";
import { GET as previewGET } from "../preview/route";
import { auth } from "@/lib/auth";
import { getPricingConfig, updatePricingConfig, getPricingPreview } from "@/lib/pricing";
import { pool } from "@/lib/db";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));

jest.mock("@/lib/pricing", () => ({
  getPricingConfig: jest.fn(),
  updatePricingConfig: jest.fn(),
  getPricingPreview: jest.fn(),
}));

jest.mock("@/lib/db", () => ({ pool: { query: jest.fn() } }));

const mockAuth = jest.mocked(auth);
const mockGetConfig = jest.mocked(getPricingConfig);
const mockUpdateConfig = jest.mocked(updatePricingConfig);
const mockGetPreview = jest.mocked(getPricingPreview);
const mockQuery = jest.mocked(pool.query);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SESSION = { user: { email: "admin@example.com" } };

const MOCK_CONFIG = {
  vatRate: 0.15,
  markupPercent: 30,
  exchangeRate: 18.5,
  exchangeNote: null,
  updatedAt: "2024-01-01T00:00:00Z",
  updatedBy: null,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function patchReq(body: unknown) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  return new NextRequest("http://localhost/api/admin/pricing", {
    method: "PATCH",
    body: raw,
    headers: { "Content-Type": "application/json" },
  });
}

function previewReq(params?: Record<string, string>) {
  const url = new URL("http://localhost/api/admin/pricing/preview");
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return new NextRequest(url);
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue(SESSION as never);
  mockGetConfig.mockResolvedValue(MOCK_CONFIG);
  mockUpdateConfig.mockResolvedValue(MOCK_CONFIG);
  mockGetPreview.mockResolvedValue({ samples: [] } as never);
  mockQuery.mockResolvedValue({ rows: [{ id: "admin-user-id" }] } as never);
});

// ── GET /api/admin/pricing ────────────────────────────────────────────────────

describe("GET /api/admin/pricing", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns pricing config when authenticated", async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(MOCK_CONFIG);
    expect(mockGetConfig).toHaveBeenCalledTimes(1);
  });
});

// ── PATCH /api/admin/pricing ──────────────────────────────────────────────────

describe("PATCH /api/admin/pricing", () => {
  it("returns 401 when no session", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(patchReq({ vatRate: 0.15 }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when session has no email", async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);

    const res = await PATCH(patchReq({ vatRate: 0.15 }));

    expect(res.status).toBe(401);
  });

  it("returns 400 when body is not valid JSON", async () => {
    const res = await PATCH(patchReq("not { valid json"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid request body" });
  });

  it("returns 400 when body is null JSON", async () => {
    const res = await PATCH(patchReq("null"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid request body" });
  });

  it("returns 400 with vatRate error when vatRate > 1", async () => {
    const res = await PATCH(patchReq({ vatRate: 1.5 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors.vatRate).toMatch(/between 0 and 1/);
  });

  it("returns 400 with vatRate error when vatRate is negative", async () => {
    const res = await PATCH(patchReq({ vatRate: -0.1 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors.vatRate).toBeDefined();
  });

  it("returns 400 with vatRate error when vatRate is not a number", async () => {
    const res = await PATCH(patchReq({ vatRate: "high" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors.vatRate).toBeDefined();
  });

  it("returns 400 with markupPercent error when markupPercent > 500", async () => {
    const res = await PATCH(patchReq({ markupPercent: 501 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors.markupPercent).toMatch(/between 0 and 500/);
  });

  it("returns 400 with markupPercent error when markupPercent is negative", async () => {
    const res = await PATCH(patchReq({ markupPercent: -1 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors.markupPercent).toBeDefined();
  });

  it("returns 400 with exchangeRate error when exchangeRate is 0", async () => {
    const res = await PATCH(patchReq({ exchangeRate: 0 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors.exchangeRate).toMatch(/greater than 0/);
  });

  it("returns 400 with exchangeRate error when exchangeRate is negative", async () => {
    const res = await PATCH(patchReq({ exchangeRate: -5 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors.exchangeRate).toBeDefined();
  });

  it("returns 400 with exchangeNote error when exchangeNote is not a string", async () => {
    const res = await PATCH(patchReq({ exchangeNote: 42 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors.exchangeNote).toMatch(/must be a string/);
  });

  it("returns 400 when body has no recognised fields", async () => {
    const res = await PATCH(patchReq({ unknownField: "value" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors._).toMatch(/At least one field/);
  });

  it("returns 400 when body is empty object", async () => {
    const res = await PATCH(patchReq({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors._).toBeDefined();
  });

  it("calls updatePricingConfig with correct patch and user id on valid input", async () => {
    const res = await PATCH(patchReq({ vatRate: 0.15, markupPercent: 30, exchangeRate: 18.5 }));

    expect(res.status).toBe(200);
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      { vatRate: 0.15, markupPercent: 30, exchangeRate: 18.5 },
      "admin-user-id"
    );
    expect(await res.json()).toEqual(MOCK_CONFIG);
  });

  it("looks up user by lowercased email", async () => {
    mockAuth.mockResolvedValue({ user: { email: "Admin@Example.COM" } } as never);

    await PATCH(patchReq({ markupPercent: 50 }));

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("select id"),
      ["admin@example.com"]
    );
  });

  it("partial update: only sends markupPercent in patch", async () => {
    await PATCH(patchReq({ markupPercent: 75 }));

    expect(mockUpdateConfig).toHaveBeenCalledWith({ markupPercent: 75 }, "admin-user-id");
  });

  it("partial update: only sends exchangeNote in patch", async () => {
    await PATCH(patchReq({ exchangeNote: "Market rate" }));

    expect(mockUpdateConfig).toHaveBeenCalledWith({ exchangeNote: "Market rate" }, "admin-user-id");
  });

  it("uses null updatedBy when user is not found in db", async () => {
    mockQuery.mockResolvedValue({ rows: [] } as never);

    await PATCH(patchReq({ vatRate: 0.2 }));

    expect(mockUpdateConfig).toHaveBeenCalledWith({ vatRate: 0.2 }, null);
  });
});

// ── GET /api/admin/pricing/preview ────────────────────────────────────────────

describe("GET /api/admin/pricing/preview", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await previewGET(previewReq());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when vat is out of range (> 1)", async () => {
    const res = await previewGET(previewReq({ vat: "1.5" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/vat.*between 0 and 1/);
  });

  it("returns 400 when vat is negative", async () => {
    const res = await previewGET(previewReq({ vat: "-0.1" }));

    expect(res.status).toBe(400);
  });

  it("returns 400 when vat is not a number", async () => {
    const res = await previewGET(previewReq({ vat: "banana" }));

    expect(res.status).toBe(400);
  });

  it("returns 400 when markup is out of range (> 500)", async () => {
    const res = await previewGET(previewReq({ markup: "501" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/markup.*between 0 and 500/);
  });

  it("returns 400 when markup is negative", async () => {
    const res = await previewGET(previewReq({ markup: "-1" }));

    expect(res.status).toBe(400);
  });

  it("returns 400 when rate is 0", async () => {
    const res = await previewGET(previewReq({ rate: "0" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/rate.*greater than 0/);
  });

  it("returns 400 when rate is negative", async () => {
    const res = await previewGET(previewReq({ rate: "-5" }));

    expect(res.status).toBe(400);
  });

  it("passes parsed overrides to getPricingPreview when all params are valid", async () => {
    const res = await previewGET(previewReq({ vat: "0.2", markup: "40", rate: "19" }));

    expect(res.status).toBe(200);
    expect(mockGetPreview).toHaveBeenCalledWith({
      vatRate: 0.2,
      markupPercent: 40,
      exchangeRate: 19,
    });
  });

  it("calls getPricingPreview with empty overrides when no params provided", async () => {
    const res = await previewGET(previewReq());

    expect(res.status).toBe(200);
    expect(mockGetPreview).toHaveBeenCalledWith({});
  });

  it("passes partial overrides when only some params are provided", async () => {
    await previewGET(previewReq({ markup: "25" }));

    expect(mockGetPreview).toHaveBeenCalledWith({ markupPercent: 25 });
  });

  it("returns the preview payload from getPricingPreview", async () => {
    const preview = { samples: [{ rawZar: 100, zarFinal: 115, priceNgn: 2185 }] };
    mockGetPreview.mockResolvedValue(preview as never);

    const res = await previewGET(previewReq({ rate: "19" }));

    expect(await res.json()).toEqual(preview);
  });
});
