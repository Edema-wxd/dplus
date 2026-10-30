/**
 * @jest-environment node
 */
import { signArtworkKey, verifyArtworkKey } from "@/lib/artwork-token";

const env = process.env;

beforeEach(() => {
  process.env = { ...env, AUTH_SECRET: "test-secret" };
});
afterAll(() => {
  process.env = env;
});

describe("artwork delete tokens", () => {
  it("verifies a token for the key it was issued for", () => {
    const token = signArtworkKey("abc")!;
    expect(verifyArtworkKey("abc", token)).toBe(true);
  });

  it("rejects the token for any other key", () => {
    const token = signArtworkKey("abc")!;
    expect(verifyArtworkKey("abd", token)).toBe(false);
  });

  it("rejects tokens signed with another secret", () => {
    const token = signArtworkKey("abc")!;
    process.env.AUTH_SECRET = "rotated";
    expect(verifyArtworkKey("abc", token)).toBe(false);
  });

  it("rejects malformed tokens", () => {
    expect(verifyArtworkKey("abc", "")).toBe(false);
    expect(verifyArtworkKey("abc", "short")).toBe(false);
  });

  it("issues nothing and verifies nothing without a secret", () => {
    process.env = { ...env };
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.UPLOADTHING_TOKEN;
    expect(signArtworkKey("abc")).toBeNull();
    expect(verifyArtworkKey("abc", "anything")).toBe(false);
  });
});
