/**
 * Money in Pakistani rupees, stored as a whole number (no paisa).
 * Example: Rs 1,350 is stored as 1350.
 */
export type Pkr = number;

/** ISO 8601 timestamp string, e.g. "2026-11-20T10:00:00.000Z". */
export type IsoDateString = string;

/** Lowercase, hyphenated URL segment, e.g. "hunza-wild-thyme-tea". */
export type Slug = string;

export interface ImageAsset {
  /** Path under /public (e.g. "/images/products/product-tumuro-tea-100g.webp") or an absolute URL. */
  src: string;
  /** Descriptive alt text. Use an empty string only for purely decorative images. */
  alt: string;
  width: number;
  height: number;
  /** Optional background colour shown behind transparent or letterboxed images. */
  background?: string;
}

export interface SeoOverrides {
  title?: string;
  description?: string;
  /** Overrides the auto-generated Open Graph image. */
  ogImage?: ImageAsset;
}

export type PublishStatus = "active" | "draft";
