import type { MetadataRoute } from "next";
import { catalog } from "@/lib/catalog";
import { categoryPath, productPath } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo/config";
import { languageAlternates } from "@/lib/seo/metadata";

/** Regenerate hourly so new products and categories appear without a redeploy. */
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

function entry(
  path: string,
  priority: number,
  changeFrequency: Entry["changeFrequency"],
  extra: Partial<Entry> = {},
): Entry {
  return {
    url: absoluteUrl(path),
    changeFrequency,
    priority,
    alternates: { languages: languageAlternates(path) },
    ...extra,
  };
}

/**
 * Built from the data layer: only ACTIVE products and categories that contain active products
 * are listed (the repository never returns drafts in production).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    catalog.getCategories(),
    catalog.getProducts({ sort: "best-selling" }),
  ]);

  const latest = products.reduce<string | undefined>(
    (max, p) => (!max || p.updatedAt > max ? p.updatedAt : max),
    undefined,
  );
  const lastOf = (categoryId: string) =>
    products
      .filter((p) => p.categoryId === categoryId)
      .reduce<string | undefined>(
        (max, p) => (!max || p.updatedAt > max ? p.updatedAt : max),
        undefined,
      );

  return [
    entry("/", 1, "weekly", latest ? { lastModified: latest } : {}),
    entry("/shop", 0.9, "daily", latest ? { lastModified: latest } : {}),
    ...categories.map((c) => {
      const last = lastOf(c.id);
      return entry(categoryPath(c.slug), 0.8, "weekly", last ? { lastModified: last } : {});
    }),
    ...products.map((p) =>
      entry(productPath(p.slug), 0.8, "weekly", {
        lastModified: p.updatedAt,
        images: p.images.map((img) => absoluteUrl(img.src)),
      }),
    ),
    entry("/about", 0.6, "monthly"),
    entry("/contact", 0.6, "monthly"),
  ];
}
