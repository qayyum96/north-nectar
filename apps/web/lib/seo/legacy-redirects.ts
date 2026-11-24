/**
 * Addresses from the previous WordPress/WooCommerce site on northnectar.com (about 190 URLs in its
 * sitemaps, some already known to Google). Each one is sent with a permanent redirect to the closest
 * page here, so search engines move their signals to the new pages instead of finding 404s.
 *
 * Targets are resolved when requested (app/legacy/[...path]/route.ts): the product if it is live,
 * else its category if that has live products, else the shop. Publishing a draft product later makes
 * its old address point to it without any change here.
 */

export interface LegacyTarget {
  /** Blog post slug (/blog/<slug>), used when that post is published. */
  post?: string;
  /** New product slug (/products/<slug>). */
  product?: string;
  /** New category slug (/shop/<slug>), also the fallback for a product that is not live. */
  category?: string;
  /** A fixed path, for pages that are not products or categories. */
  path?: string;
}

/** Old WooCommerce product slugs (/product/<slug>/). */
export const LEGACY_PRODUCTS: Record<string, LegacyTarget> = {
  "dried-sea-buckthorn-berries": { product: "dried-sea-buckthorn-berries", category: "superfoods" },
  "premium-sanghuang-mushroom": { product: "wild-sanghuang-mushroom", category: "superfoods" },
  "premium-mulethi-roots": { product: "mulethi-roots-licorice", category: "herbal-roots" },
  "premium-himalayan-shilajit-resin": { product: "himalayan-shilajit-resin", category: "shilajit" },
  "himalayan-organic-dried-apricots": {
    product: "dried-apricots-sukhi-khubani",
    category: "dry-fruits",
  },
  "bulk-white-apricot": { product: "white-apricot-safed", category: "dry-fruits" },
  "bulk-walnut-kernels": { product: "walnut-kernels", category: "dry-fruits" },
  "premium-salab-misri": { product: "salab-misri", category: "herbal-roots" },
  "premium-salab-panja": { product: "salab-panja", category: "herbal-roots" },
  "ephedra-somakalpa": { product: "ephedra-somakalpa", category: "herbal-roots" },
};

/** Old category slugs (/product-category/<slug>/ and /category/<slug>/). */
export const LEGACY_CATEGORIES: Record<string, LegacyTarget> = {
  "dry-fruits": { category: "dry-fruits" },
  "herbal-roots": { category: "herbal-roots" },
  "natural-oils": { category: "natural-oils" },
  "pure-honey": { category: "pure-honey" },
  "best-sellers": { path: "/shop" },
  export: { category: "wholesale" },
  wholesale: { category: "wholesale" },
};

/**
 * Old blog posts (/<slug>/): sent to the republished article at /blog/<same slug> once it is live
 * in the admin, and to the matching category until then.
 */
export const LEGACY_POSTS: Record<string, LegacyTarget> = {
  "himalayan-herbal-roots-for-natural-daily-wellness": {
    post: "himalayan-herbal-roots-for-natural-daily-wellness",
    category: "herbal-roots",
  },
  "why-himalayan-dry-fruits-are-daily-essentials": {
    post: "why-himalayan-dry-fruits-are-daily-essentials",
    category: "dry-fruits",
  },
  "why-pure-himalayan-honey-beats-commercial-honey": {
    post: "why-pure-himalayan-honey-beats-commercial-honey",
    category: "pure-honey",
  },
  "why-cold-pressed-oils-are-healthier-than-refined": {
    post: "why-cold-pressed-oils-are-healthier-than-refined",
    category: "natural-oils",
  },
};

/** Old standalone pages (/<slug>/) whose address changed. */
export const LEGACY_PAGES: Record<string, LegacyTarget> = {
  "contact-us": { path: "/contact" },
  "request-a-quote": { path: "/contact?subject=wholesale" },
  "my-account": { path: "/" },
};

/**
 * Tag pages (/product-tag/<slug>/, /tag/<slug>/) and attribute pages: matched by keyword, first rule
 * wins. Specific products before broad categories.
 */
const KEYWORD_RULES: [RegExp, LegacyTarget][] = [
  [/sea-buckthorn|hippophae|dried-berries/, LEGACY_PRODUCTS["dried-sea-buckthorn-berries"]!],
  [/shilajit|pure-resin/, LEGACY_PRODUCTS["premium-himalayan-shilajit-resin"]!],
  [/white-apricot/, LEGACY_PRODUCTS["bulk-white-apricot"]!],
  [/apricot|khubani|prunus/, LEGACY_PRODUCTS["himalayan-organic-dried-apricots"]!],
  [/walnut/, LEGACY_PRODUCTS["bulk-walnut-kernels"]!],
  [/mushroom|phellinus|sanghuang/, LEGACY_PRODUCTS["premium-sanghuang-mushroom"]!],
  [/mulethi|licorice|glycyrrhiza/, LEGACY_PRODUCTS["premium-mulethi-roots"]!],
  [/salab-misri|orchis/, LEGACY_PRODUCTS["premium-salab-misri"]!],
  [/salab-panja|dactylorhiza/, LEGACY_PRODUCTS["premium-salab-panja"]!],
  [/ephedra|somakalpa/, LEGACY_PRODUCTS["ephedra-somakalpa"]!],
  [/honey/, { category: "pure-honey" }],
  [/oil/, { category: "natural-oils" }],
  [/tea/, { category: "herbal-tea" }],
  [/superfood|energy/, { category: "superfoods" }],
  [/dry-fruit/, { category: "dry-fruits" }],
  [/wholesale|bulk|export|oem|private-label/, { category: "wholesale" }],
  [
    /herb|root|botanical|medicinal|pharmaceutical|wellness|nutraceutical|remed/,
    { category: "herbal-roots" },
  ],
];

/** The redirect target for an old address, by its kind and slug. */
export function legacyTarget(kind: string, slug: string): LegacyTarget {
  const s = slug.toLowerCase();
  switch (kind) {
    case "product":
      return (
        LEGACY_PRODUCTS[s] ?? KEYWORD_RULES.find(([re]) => re.test(s))?.[1] ?? { path: "/shop" }
      );
    case "product-category":
    case "category":
      return (
        LEGACY_CATEGORIES[s] ?? KEYWORD_RULES.find(([re]) => re.test(s))?.[1] ?? { path: "/shop" }
      );
    case "product-tag":
    case "tag":
    case "product-form":
      return KEYWORD_RULES.find(([re]) => re.test(s))?.[1] ?? { path: "/shop" };
    case "origin":
      return { path: "/about" };
    case "post":
      return LEGACY_POSTS[s] ?? { path: "/" };
    case "page":
      return LEGACY_PAGES[s] ?? { path: "/" };
    default:
      return { path: "/" };
  }
}

/**
 * Old paths routed to the legacy resolver (next.config rewrites). Each becomes
 * /legacy/<kind>/<slug>. Old URLs ended in "/"; Next removes it first (trailingSlash: false).
 */
export const LEGACY_REWRITES: { source: string; destination: string }[] = [
  ...[
    "product",
    "product-category",
    "category",
    "product-tag",
    "tag",
    "product-form",
    "origin",
  ].map((kind) => ({ source: `/${kind}/:slug`, destination: `/legacy/${kind}/:slug` })),
  ...Object.keys(LEGACY_POSTS).map((slug) => ({
    source: `/${slug}`,
    destination: `/legacy/post/${slug}`,
  })),
  ...Object.keys(LEGACY_PAGES).map((slug) => ({
    source: `/${slug}`,
    destination: `/legacy/page/${slug}`,
  })),
  ...["brand", "author", "footer"].map((kind) => ({
    source: `/${kind}/:rest*`,
    destination: "/legacy/page/home",
  })),
  { source: "/footer", destination: "/legacy/page/home" },
];
