/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "amrcdn.amrod.co.za" }],
  },
};

module.exports = nextConfig;
