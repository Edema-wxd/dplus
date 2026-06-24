/**
 * @jest-environment node
 */

// Must be hoisted before any import so the middleware module receives the mock
// when it calls NextAuth(authConfig) at module-evaluation time.
// The real next-auth is ESM and would break the Jest CJS runner, so we never
// load it. Our shim makes auth() invoke the callback synchronously with
// whatever req object we pass in — enough to test the redirect logic.
jest.mock("next-auth", () => ({
  __esModule: true,
  default: () => ({
    auth: (callback: (req: unknown) => unknown) =>
      (req: unknown) =>
        callback(req),
  }),
}));

import middlewareExport, { config } from "../../src/middleware";
const middleware = middlewareExport as unknown as (req: unknown) => unknown;
import { NextResponse } from "next/server";

// ── helpers ───────────────────────────────────────────────

type FakeReq = {
  auth: unknown;
  nextUrl: { pathname: string; origin: string };
};

function fakeReq(
  pathname: string,
  auth: unknown = null,
  origin = "http://localhost:3000"
): FakeReq {
  return { auth, nextUrl: { pathname, origin } };
}

// ── setup ─────────────────────────────────────────────────

let redirectSpy: jest.SpyInstance;

beforeEach(() => {
  redirectSpy = jest
    .spyOn(NextResponse, "redirect")
    .mockReturnValue(new Response(null, { status: 307 }) as never);
});

afterEach(() => {
  redirectSpy.mockRestore();
});

// ── tests ─────────────────────────────────────────────────

describe("middleware config", () => {
  it("exports matcher ['/admin/:path*']", () => {
    expect(config.matcher).toEqual(["/admin/:path*"]);
  });
});

describe("unauthenticated requests", () => {
  it("redirects /admin to <origin>/portal", () => {
    middleware(fakeReq("/admin"));

    expect(redirectSpy).toHaveBeenCalledTimes(1);
    const url: URL = redirectSpy.mock.calls[0][0];
    expect(url.toString()).toBe("http://localhost:3000/portal");
  });

  it("redirects /admin/orders to <origin>/portal (covers :path*)", () => {
    middleware(fakeReq("/admin/orders"));

    expect(redirectSpy).toHaveBeenCalledTimes(1);
    const url: URL = redirectSpy.mock.calls[0][0];
    expect(url.toString()).toBe("http://localhost:3000/portal");
  });
});

describe("authenticated requests", () => {
  it("does NOT redirect /admin", () => {
    middleware(fakeReq("/admin", { user: { email: "admin@test.com" } }));

    expect(redirectSpy).not.toHaveBeenCalled();
  });

  it("does NOT redirect /admin/pricing", () => {
    middleware(fakeReq("/admin/pricing", { user: {} }));

    expect(redirectSpy).not.toHaveBeenCalled();
  });
});

describe("non-admin paths", () => {
  it("does not redirect /portal even with no auth", () => {
    // In production the matcher ["/admin/:path*"] prevents the middleware from
    // running for /portal entirely. Even when called directly, the
    // pathname.startsWith("/admin") guard inside the callback means no redirect
    // is issued — both layers exclude non-admin paths.
    middleware(fakeReq("/portal"));

    expect(redirectSpy).not.toHaveBeenCalled();
  });
});

describe("redirect URL", () => {
  it("uses req.nextUrl.origin as the base — not a hardcoded host", () => {
    const origin = "https://example.com";
    middleware(fakeReq("/admin", null, origin));

    const url: URL = redirectSpy.mock.calls[0][0];
    expect(url.toString()).toBe(`${origin}/portal`);
  });
});
