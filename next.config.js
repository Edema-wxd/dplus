// NOTE: duplicated from next.config.ts — Next loads this file in preference to
// the TypeScript one, so the two must stay identical until one is removed.
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "amrcdn.amrod.co.za" },
      // UploadThing: app-scoped host (v7+) and the legacy one.
      { protocol: "https", hostname: "**.ufs.sh" },
      { protocol: "https", hostname: "utfs.io" },
    ],
  },
};

module.exports = nextConfig;
