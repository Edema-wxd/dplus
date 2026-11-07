// Cloudflare Turnstile, checked on the server. The widget is
// src/components/Turnstile.tsx; it puts its token in a form field of this name,
// and the JSON forms send it under the same name.
export const CAPTCHA_FIELD = "cf-turnstile-response";

export const CAPTCHA_ERROR =
  "We couldn't confirm you're not a bot. Please wait a moment and try again.";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * True when the token is good, or when TURNSTILE_SECRET_KEY isn't set (the
 * captcha is off and forms work as before). Fails open if Cloudflare can't be
 * reached, so an outage there doesn't turn every enquiry away.
 */
export async function verifyCaptcha(token: unknown): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  // Turnstile tokens are at most 2048 characters.
  if (typeof token !== "string" || !token || token.length > 2048) return false;

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data.success) console.warn("[captcha] rejected:", data["error-codes"]);
    return data.success === true;
  } catch (err) {
    console.error("[captcha] Cloudflare unreachable, letting the request through:", err);
    return true;
  }
}
