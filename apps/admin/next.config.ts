import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // The admin must never appear in search results.
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

// Product images currently live on the website; uploads (Phase 3) go to Supabase Storage.
const storefront = new URL(process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://northnectar.com");
const storefrontIsLocal = ["localhost", "127.0.0.1"].includes(storefront.hostname);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  transpilePackages: ["@northnectar/ui", "@northnectar/data", "@northnectar/types"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: storefront.protocol === "http:" ? "http" : "https",
        hostname: storefront.hostname,
        port: storefront.port,
        pathname: "/images/**",
      },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
    // Only when the website runs on this machine (local development).
    dangerouslyAllowLocalIP: storefrontIsLocal,
  },
  experimental: {
    optimizePackageImports: ["@northnectar/ui"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
