import type { MetadataRoute } from "next";
import { isIndexable } from "@/lib/env";
import { absoluteUrl, siteConfig } from "@/lib/seo/config";

export default function robots(): MetadataRoute.Robots {
  // Preview and development deployments must never be indexed.
  if (!isIndexable) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Transactional pages carry no search value (they are also noindex).
        disallow: ["/cart", "/checkout", "/order-confirmation", "/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}
