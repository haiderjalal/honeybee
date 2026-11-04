import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // Every page is static (or a POST handler), so Cache Components is not needed;
  // leaving it off allows `dynamicParams = false` for hard 404s on unknown products.
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // AVIF is noticeably smaller than WebP; browsers without AVIF support fall back to WebP.
    formats: ["image/avif", "image/webp"],
    // Brand images change rarely, so browsers and the CDN can keep optimised copies for a week.
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Brand files keep their names when they are replaced, so cache them for a day rather than forever.
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
