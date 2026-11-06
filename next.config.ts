import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
