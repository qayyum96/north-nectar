import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // URL policy: no trailing slashes (e.g. /shop, /products/hunza-wild-thyme-tea).
  trailingSlash: false,
  // Workspace packages ship TypeScript source; Next compiles them.
  transpilePackages: ["@northnectar/ui", "@northnectar/data", "@northnectar/types"],
  images: {
    formats: ["image/avif", "image/webp"],
    // Product imagery is mostly square; these widths cover cards (2 to 4 columns) and galleries.
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536],
    imageSizes: [48, 64, 96, 128, 160, 256, 320],
    // TODO(supabase): add the Supabase Storage host here when product images move there, e.g.
    // remotePatterns: [{ protocol: "https", hostname: "<project>.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  experimental: {
    optimizePackageImports: ["@northnectar/ui"],
    // Note: experimental.inlineCss was tested and rejected. It embeds the stylesheet three times per
    // page (style tag + RSC payload), roughly tripling HTML size.
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Images are replaced in place under the same file name (see IMAGES.md), so they are not
        // immutable: cache for a day and refresh in the background.
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/videos/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
