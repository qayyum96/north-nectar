import type { MetadataRoute } from "next";

/** The admin is private: block every crawler. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
