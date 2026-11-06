// NOTE: duplicated from next.config.ts — Next loads this file in preference to
// the TypeScript one, so the two must stay identical until one is removed.

// X-Robots-Tag keeps responses that can't carry a <meta name="robots"> tag —
// API data, scripts, RSC payloads, images — out of search results. Crawlers
// only see it on URLs robots.txt lets them fetch, so keep the two in step.
const NOINDEX = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      // Private pages. Their layouts set the meta tag too; the header also
      // covers the redirects and errors those routes return.
      { source: "/admin/:path*", headers: NOINDEX },
      { source: "/portal/:path*", headers: NOINDEX },
      // The basket is noindex but followed, matching its meta tag.
      { source: "/basket", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
      // JSON from route handlers, including auth, uploads and the cron jobs.
      { source: "/api/:path*", headers: NOINDEX },
      // Built scripts, styles and fonts. Crawlers still fetch them to render
      // pages, so they are tagged rather than blocked in robots.txt.
      { source: "/_next/static/:path*", headers: NOINDEX },
      // RSC payloads for client navigation: same URL as the page, but data.
      { source: "/:path*", has: [{ type: "header", key: "rsc" }], headers: NOINDEX },
      { source: "/:path*", has: [{ type: "query", key: "_rsc" }], headers: NOINDEX },
      // Supplier product photos. Portfolio and hamper images stay indexable.
      {
        source: "/_next/image",
        has: [{ type: "query", key: "url", value: "https://amrcdn\\.amrod\\.co\\.za/.*" }],
        headers: NOINDEX,
      },
    ];
  },
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
