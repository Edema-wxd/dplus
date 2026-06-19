/**
 * @jest-environment node
 *
 * Tests for src/lib/amrod/auth.ts
 *
 * Module isolation strategy: jest.resetModules() + require() in beforeEach so
 * that the module-level cachedToken / cachedAt start fresh for every test.
 * fetch is mocked via jest.spyOn(global, 'fetch').
 */

// ─── types (import-type only, never triggers module loading) ─────────────────

type GetAmrodToken = (forceRefresh?: boolean) => Promise<string>;
type AmrodFetch = (path: string, init?: RequestInit, retry?: boolean) => Promise<Response>;

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Build a minimal Response-shaped mock. */
function mockRes(
  body: unknown,
  { ok = true, status = 200 }: { ok?: boolean; status?: number } = {}
): Response {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(typeof body === "string" ? body : JSON.stringify(body)),
  } as unknown as Response;
}

const LOGIN_URL = "https://identity.test/VendorLogin";
const TTL_MS = 55 * 60 * 1_000;

// ─── shared setup ────────────────────────────────────────────────────────────

let getAmrodToken: GetAmrodToken;
let amrodFetch: AmrodFetch;
let fetchSpy: jest.SpyInstance;

beforeEach(() => {
  // Fresh module instance → cachedToken = null, cachedAt = 0
  jest.resetModules();

  process.env.AMROD_IDENTITY_URL = "https://identity.test";
  process.env.AMROD_API_URL = "https://api.test";
  process.env.AMROD_USERNAME = "testuser";
  process.env.AMROD_PASSWORD = "testpass";
  process.env.AMROD_CUSTOMER_CODE = "TEST123";

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("../auth");
  getAmrodToken = mod.getAmrodToken;
  amrodFetch = mod.amrodFetch;

  fetchSpy = jest.spyOn(global, "fetch");
});

afterEach(() => {
  fetchSpy.mockRestore();
  jest.restoreAllMocks();
});

// ─── getAmrodToken ───────────────────────────────────────────────────────────

describe("getAmrodToken", () => {
  test("first call: POSTs to the correct URL with credentials from env", async () => {
    fetchSpy.mockResolvedValueOnce(mockRes({ token: "tok-abc" }));

    const token = await getAmrodToken();

    expect(token).toBe("tok-abc");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      LOGIN_URL,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          UserName: "testuser",
          Password: "testpass",
          CustomerCode: "TEST123",
        }),
      })
    );
  });

  test("reads token from data.Token (capital T)", async () => {
    fetchSpy.mockResolvedValueOnce(mockRes({ Token: "cap-tok" }));

    const token = await getAmrodToken();
    expect(token).toBe("cap-tok");
  });

  test("reads token from data.access_token", async () => {
    fetchSpy.mockResolvedValueOnce(mockRes({ access_token: "access-tok" }));

    const token = await getAmrodToken();
    expect(token).toBe("access-tok");
  });

  test("throws with status when response is not ok", async () => {
    // Use mockResolvedValue (not Once) so both expect chains share the same mock
    fetchSpy.mockResolvedValue(mockRes("Unauthorized", { ok: false, status: 401 }));

    await expect(getAmrodToken()).rejects.toThrow("Amrod auth failed: 401");
  });

  test("error message includes the HTTP status code", async () => {
    fetchSpy.mockResolvedValue(mockRes("Server Error", { ok: false, status: 500 }));

    await expect(getAmrodToken()).rejects.toThrow("Amrod auth failed: 500");
  });

  test("throws when response is ok but contains no recognised token field", async () => {
    fetchSpy.mockResolvedValueOnce(mockRes({ session_id: "xxx", expires_in: 3600 }));

    await expect(getAmrodToken()).rejects.toThrow("missing token");
  });

  test("second call within TTL returns cached token without fetching again", async () => {
    fetchSpy.mockResolvedValue(mockRes({ token: "cached-tok" }));

    const first = await getAmrodToken();
    const second = await getAmrodToken();

    expect(first).toBe("cached-tok");
    expect(second).toBe("cached-tok");
    expect(fetchSpy).toHaveBeenCalledTimes(1); // only one network call
  });

  test("call within TTL window (one ms before expiry) still uses cache", async () => {
    const BASE = 5_000_000;
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(BASE);
    fetchSpy.mockResolvedValue(mockRes({ token: "still-valid" }));

    await getAmrodToken(); // populates cache at BASE

    nowSpy.mockReturnValue(BASE + TTL_MS - 1); // one ms before expiry
    await getAmrodToken();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test("call after TTL expires fetches a fresh token", async () => {
    const BASE = 5_000_000;
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(BASE);

    fetchSpy.mockResolvedValueOnce(mockRes({ token: "old-tok" }));
    const first = await getAmrodToken();
    expect(first).toBe("old-tok");
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Advance past TTL
    nowSpy.mockReturnValue(BASE + TTL_MS + 1);
    fetchSpy.mockResolvedValueOnce(mockRes({ token: "new-tok" }));

    const second = await getAmrodToken();
    expect(second).toBe("new-tok");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  test("forceRefresh=true bypasses valid cache and updates the stored token", async () => {
    fetchSpy.mockResolvedValueOnce(mockRes({ token: "old-tok" }));
    await getAmrodToken(); // populates cache
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fetchSpy.mockResolvedValueOnce(mockRes({ token: "forced-tok" }));
    const fresh = await getAmrodToken(true);

    expect(fresh).toBe("forced-tok");
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    // Confirm the cache was updated: next plain call should return forced-tok
    // without a third fetch
    const cached = await getAmrodToken();
    expect(cached).toBe("forced-tok");
    expect(fetchSpy).toHaveBeenCalledTimes(2); // still only 2
  });
});

// ─── amrodFetch ──────────────────────────────────────────────────────────────

describe("amrodFetch", () => {
  test("attaches Authorization: Bearer <token> header to the API request", async () => {
    fetchSpy
      .mockResolvedValueOnce(mockRes({ token: "bearer-tok" })) // login
      .mockResolvedValueOnce(mockRes({}, { status: 200 })); // API

    await amrodFetch("/products");

    // Second call is the actual API request
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://api.test/products",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer bearer-tok" }),
      })
    );
  });

  test("merges caller-supplied headers with the Authorization header", async () => {
    fetchSpy
      .mockResolvedValueOnce(mockRes({ token: "tok" }))
      .mockResolvedValueOnce(mockRes({}, { status: 200 }));

    await amrodFetch("/products", { headers: { "X-Custom": "yes" } });

    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://api.test/products",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer tok",
          "X-Custom": "yes",
        }),
      })
    );
  });

  test("on 401: refreshes token (force) and retries the request exactly once", async () => {
    fetchSpy
      .mockResolvedValueOnce(mockRes({ token: "tok-v1" })) // #1 initial login
      .mockResolvedValueOnce(mockRes(null, { ok: false, status: 401 })) // #2 API → 401
      .mockResolvedValueOnce(mockRes({ token: "tok-v2" })) // #3 forced re-login
      .mockResolvedValueOnce(mockRes({}, { status: 200 })); // #4 API retry → 200

    const res = await amrodFetch("/protected");

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(4);

    // #3 must be a login call (force-refresh)
    expect(fetchSpy).toHaveBeenNthCalledWith(3, LOGIN_URL, expect.anything());

    // #4 must use the refreshed token
    expect(fetchSpy).toHaveBeenNthCalledWith(
      4,
      "https://api.test/protected",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer tok-v2" }),
      })
    );
  });

  test("on second 401 (retry=false): returns the 401 response without further retries", async () => {
    fetchSpy
      .mockResolvedValueOnce(mockRes({ token: "tok" })) // login
      .mockResolvedValueOnce(mockRes(null, { ok: false, status: 401 })); // API → 401

    const res = await amrodFetch("/protected", {}, false); // retry disabled

    expect(res.status).toBe(401);
    // Only 2 fetches: login + 1 API call; no force-refresh, no retry
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  test("non-401 error responses are returned as-is without retrying", async () => {
    fetchSpy
      .mockResolvedValueOnce(mockRes({ token: "tok" }))
      .mockResolvedValueOnce(mockRes(null, { ok: false, status: 500 }));

    const res = await amrodFetch("/broken");

    expect(res.status).toBe(500);
    expect(fetchSpy).toHaveBeenCalledTimes(2); // no third fetch
  });

  test("non-401 success response (e.g. 204) is returned as-is", async () => {
    fetchSpy
      .mockResolvedValueOnce(mockRes({ token: "tok" }))
      .mockResolvedValueOnce(mockRes(null, { ok: true, status: 204 }));

    const res = await amrodFetch("/sync");
    expect(res.status).toBe(204);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  test("prefixes the path with AMROD_API_URL when building the request URL", async () => {
    fetchSpy
      .mockResolvedValueOnce(mockRes({ token: "tok" }))
      .mockResolvedValueOnce(mockRes({}, { status: 200 }));

    await amrodFetch("/api/v1/Stock/");

    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://api.test/api/v1/Stock/",
      expect.anything()
    );
  });
});
