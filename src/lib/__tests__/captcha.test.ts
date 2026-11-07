/**
 * @jest-environment node
 */
import { verifyCaptcha } from "../captcha";

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  process.env.TURNSTILE_SECRET_KEY = "secret";
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.TURNSTILE_SECRET_KEY;
  jest.restoreAllMocks();
});

function cloudflareSays(body: object) {
  fetchMock.mockResolvedValue({ json: async () => body });
}

describe("verifyCaptcha", () => {
  it("lets everything through when no secret is set", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    await expect(verifyCaptcha(undefined)).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([undefined, null, "", 42, "x".repeat(2049)])("rejects a missing or malformed token (%p)", async (token) => {
    await expect(verifyCaptcha(token)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the secret and token to Cloudflare and accepts a good token", async () => {
    cloudflareSays({ success: true });
    await expect(verifyCaptcha("token")).resolves.toBe(true);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    const sent = init.body as URLSearchParams;
    expect(sent.get("secret")).toBe("secret");
    expect(sent.get("response")).toBe("token");
  });

  it("rejects a token Cloudflare turns down", async () => {
    cloudflareSays({ success: false, "error-codes": ["timeout-or-duplicate"] });
    await expect(verifyCaptcha("token")).resolves.toBe(false);
  });

  it("lets the request through when Cloudflare can't be reached", async () => {
    fetchMock.mockRejectedValue(new Error("ETIMEDOUT"));
    await expect(verifyCaptcha("token")).resolves.toBe(true);
  });
});
