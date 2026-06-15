import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "amrcdn.amrod.co.za",
      },
    ],
  },
};

export default nextConfig;
