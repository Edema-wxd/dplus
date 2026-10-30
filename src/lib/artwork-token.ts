import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Artwork is uploaded by anonymous shoppers, so deleting it needs proof that
 * the caller is the one who uploaded it. The upload route hands back an HMAC
 * of the file key; only that token can delete the file again.
 */
function secret(): string | null {
  return (
    process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.UPLOADTHING_TOKEN || null
  );
}

function sign(key: string, s: string) {
  return createHmac("sha256", s).update(`artwork:${key}`).digest("base64url");
}

/** Null when no secret is configured; the file just can't be deleted later. */
export function signArtworkKey(key: string): string | null {
  const s = secret();
  return s ? sign(key, s) : null;
}

export function verifyArtworkKey(key: string, token: string): boolean {
  const s = secret();
  if (!s) return false;
  const expected = Buffer.from(sign(key, s));
  const given = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
