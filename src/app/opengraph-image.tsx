import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

/**
 * The card every page falls back to when shared. Routes that want their own
 * can drop an opengraph-image file in their own folder; the nearest one wins.
 */
export const alt = `${SITE_NAME} — corporate gifting and branded merchandise in Nigeria`;

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#1a1a1a",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* A yellow rule reads as the brand even at thumbnail size. */}
        <div style={{ display: "flex", width: 120, height: 8, background: "#f0c04a" }} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 78,
              lineHeight: 1.05,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              maxWidth: 900,
            }}
          >
            Corporate gifting that gets remembered
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              color: "#b5b5b5",
              maxWidth: 820,
              lineHeight: 1.35,
            }}
          >
            Curated hampers, branded merchandise, workwear and custom branding —
            delivered across Nigeria.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 28,
          }}
        >
          <span style={{ color: "#ffffff", letterSpacing: "0.04em" }}>
            {SITE_NAME}
          </span>
          <span style={{ color: "#f0c04a" }}>de-signplus.com</span>
        </div>
      </div>
    ),
    size
  );
}
