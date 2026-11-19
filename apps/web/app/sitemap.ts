import type { MetadataRoute } from "next";
import { languageAlternates } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/config";

/** Regenerate hourly so new products and categories appear without a redeploy. */
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

function entry(path: string, priority: number, changeFrequency: Entry["changeFrequency"]): Entry {
  return {
    url: absoluteUrl(path),
    changeFrequency,
    priority,
    alternates: { languages: languageAlternates(path) },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    entry("/", 1, "weekly"),
    entry("/shop", 0.9, "daily"),
    entry("/about", 0.6, "monthly"),
    entry("/contact", 0.6, "monthly"),
  ];

  // Phase 2: append active categories (/shop/[category]) and active products (/products/[slug])
  // from the data layer, with lastModified taken from each record's updatedAt.
  return staticPages;
}
