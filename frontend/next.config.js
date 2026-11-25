/** @type {import('next').NextConfig} */
const LEGACY_HOST = "zip-drop\\.vercel\\.app";
const OFFICIAL_ORIGIN = "https://www.getzipdrop.com";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  async redirects() {
    // Google Change of Address: the legacy Vercel hostname still serves this
    // same deployment, so redirect it to the official domain path-for-path.
    // `permanent: true` emits HTTP 308; Next.js forwards the query string.
    return [
      {
        source: "/",
        has: [{ type: "host", value: LEGACY_HOST }],
        destination: `${OFFICIAL_ORIGIN}/`,
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: LEGACY_HOST }],
        destination: `${OFFICIAL_ORIGIN}/:path*`,
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
