import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // The admin must never appear in search results.
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

// The original images live on the website; uploads go to Cloudflare R2 (NEXT_PUBLIC_MEDIA_URL),
// or to Supabase Storage before R2 is set up.
const storefront = new URL(process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://northnectar.com");
const storefrontIsLocal = ["localhost", "127.0.0.1"].includes(storefront.hostname);
const media = process.env.NEXT_PUBLIC_MEDIA_URL ? new URL(process.env.NEXT_PUBLIC_MEDIA_URL) : null;

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
      ...(media ? [{ protocol: "https" as const, hostname: media.hostname, pathname: "/**" }] : []),
    ],
    // Only when the website runs on this machine (local development).
    dangerouslyAllowLocalIP: storefrontIsLocal,
  },
  experimental: {
    optimizePackageImports: ["@northnectar/ui"],
    // Product photos are sent to the server after resizing (usually 150-400 KB, at most 1 MB).
    serverActions: { bodySizeLimit: "2mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
