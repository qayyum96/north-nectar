import type { Metadata } from "next";
import { isIndexable } from "@/lib/env";
import { absoluteUrl, siteConfig } from "./config";

export interface PageSeo {
  /** Page title without the brand; the root template appends " | North Nectar". */
  title: string;
  description: string;
  /** Site-relative path, e.g. "/shop". Used for the canonical URL and hreflang. */
  path: string;
  /** Open Graph image. Leave out to use the route's opengraph-image file or the default. */
  image?: { url: string; width?: number; height?: number; alt?: string };
  type?: "website" | "article";
  /** Keep the page out of search results (cart, checkout, confirmation). */
  noIndex?: boolean;
  /** Use the title as-is, without the brand template (e.g. the home page). */
  absoluteTitle?: boolean;
}

/** hreflang alternates for a path. Ready for future languages via siteConfig.languages. */
export function languageAlternates(path: string): Record<string, string> {
  const entries = Object.entries(siteConfig.languages).map(([lang, prefix]) => [
    lang,
    absoluteUrl(`${prefix}${path}`),
  ]);
  return { ...Object.fromEntries(entries), "x-default": absoluteUrl(path) };
}

/**
 * Builds a complete Metadata object for a page. Next.js replaces (not merges) nested objects
 * like `openGraph` between layouts and pages, so every shared field is repeated here.
 */
export function buildMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  noIndex = false,
  absoluteTitle = false,
}: PageSeo): Metadata {
  const url = absoluteUrl(path);
  const ogTitle = absoluteTitle ? title : `${title} | ${siteConfig.name}`;
  const ogImage = image ?? siteConfig.defaultOgImage;
  const images = [{ ...ogImage, alt: ogImage.alt ?? title }];

  const metadata: Metadata = {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type,
      url,
      title: ogTitle,
      description,
      siteName: siteConfig.name,
      locale: siteConfig.ogLocale,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: images.map((i) => i.url),
    },
  };

  // Only set robots when it differs from the root default; an explicit `undefined` would
  // wipe the inherited value.
  const robots = robotsFor(noIndex);
  if (robots) metadata.robots = robots;
  return metadata;
}

/** Robots directives: preview builds are never indexed; transactional pages are noindex. */
export function robotsFor(noIndex = false): Metadata["robots"] | undefined {
  if (!isIndexable) return { index: false, follow: false };
  if (noIndex) return { index: false, follow: true };
  return undefined;
}
