// NOTE: duplicated from next.config.ts — Next loads this file in preference to
// the TypeScript one, so the two must stay identical until one is removed.
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "amrcdn.amrod.co.za" },
      // Uploaded brochure, hamper and portfolio images (see src/lib/uploads.ts).
      { protocol: "https", hostname: "www.de-signplus.com", pathname: "/uploads/**" },
      { protocol: "https", hostname: "de-signplus.com", pathname: "/uploads/**" },
    ],
  },
};

module.exports = nextConfig;
