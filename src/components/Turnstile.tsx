"use client";

import { useEffect, useImperativeHandle, useRef } from "react";

// Cloudflare Turnstile. The site key is baked in at build time; without it the
// widget renders nothing and the server skips the check (src/lib/captcha.ts).
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export const captchaEnabled = Boolean(SITE_KEY);

type TurnstileApi = {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile didn't load"));
    script.onerror = () => {
      scriptPromise = null; // let the next form try again
      reject(new Error("Turnstile didn't load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export type TurnstileHandle = {
  /** Tokens work once; get a fresh one after each submission. */
  reset(): void;
};

/**
 * Stays invisible unless Cloudflare wants the visitor to tick a box. Inside a
 * <form> it also adds a hidden `cf-turnstile-response` field, which is how the
 * admin login (a server action) receives the token.
 */
export function Turnstile({
  onToken,
  className,
  ref,
}: {
  onToken?: (token: string | null) => void;
  className?: string;
  ref?: React.Ref<TurnstileHandle>;
}) {
  const box = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  // Read through a ref so a parent re-render doesn't re-create the widget.
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        onTokenRef.current?.(null);
        if (widgetId.current) window.turnstile?.reset(widgetId.current);
      },
    }),
    []
  );

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !box.current) return;
        widgetId.current = turnstile.render(box.current, {
          sitekey: SITE_KEY,
          appearance: "interaction-only",
          callback: (token: string) => onTokenRef.current?.(token),
          "expired-callback": () => onTokenRef.current?.(null),
          "error-callback": () => onTokenRef.current?.(null),
        });
      })
      .catch((err) => console.error("[captcha]", err));

    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={box} className={className} />;
}
