import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel now only hosts the dev site (VERCEL_ENV is set on every Vercel
  // deployment, never on the cPanel server), so keep it out of search results.
  async headers() {
    if (!process.env.VERCEL_ENV) return [];
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "amrcdn.amrod.co.za" },
      // Uploaded brochure, hamper and portfolio images (see src/lib/uploads.ts).
      { protocol: "https", hostname: "www.de-signplus.com", pathname: "/uploads/**" },
      { protocol: "https", hostname: "de-signplus.com", pathname: "/uploads/**" },
    ],
  },
};

export default nextConfig;
