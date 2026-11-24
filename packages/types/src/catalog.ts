import type { ImageAsset, IsoDateString, Pkr, PublishStatus, SeoOverrides, Slug } from "./common";

export interface Category {
  id: string;
  slug: Slug;
  name: string;
  /** Shorter label for chips and nav, e.g. "Honey" for "Pure Honey". */
  shortName?: string;
  description: string;
  image: ImageAsset;
  sortOrder: number;
  status: PublishStatus;
  seo?: SeoOverrides;
  /** Longer page text shown below the products, one string per paragraph (rich-text marks allowed). */
  content?: string[];
  /** Common questions shown on the category page (and as FAQPage structured data). */
  faqs?: CategoryFaq[];
}

export interface CategoryFaq {
  question: string;
  answer: string;
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface ProductVariant {
  id: string;
  sku: string;
  /** Customer-facing size label, e.g. "100g" or "Bulk 25kg". */
  label: string;
  /** Net weight in grams, used for "price per 100g". Null for non-weight variants. */
  weightGrams: number | null;
  price: Pkr;
  /** Original price when the variant is on sale. */
  compareAtPrice?: Pkr | null;
  /** Units in stock. */
  stock: number;
  /** Small merchandising tag, e.g. "Popular" or "Best value". */
  tag?: string | null;
  isDefault?: boolean;
}

export type BadgeTone = "green" | "orange" | "kraft" | "dark";

export interface ProductBadge {
  label: string;
  tone: BadgeTone;
}

/**
 * "retail": normal add-to-cart product.
 * "quote": bulk-only product with no public price ("Request a quote").
 */
export type PurchaseMode = "retail" | "quote";

export interface ProductAttribute {
  label: string;
  value: string;
}

export interface ProductStep {
  title: string;
  description: string;
}

export interface Product {
  id: string;
  slug: Slug;
  status: PublishStatus;
  name: string;
  /** Short name for tight spaces (cart suggestions, chips), e.g. "Wild Thyme Tea". */
  shortName?: string;
  /** One-line summary shown on product cards. */
  tagline: string;
  /** Long description, one string per paragraph. */
  description: string[];
  /** Latin name, e.g. "Hippophae rhamnoides". */
  botanicalName?: string;
  /** Where it is sourced, e.g. "Hunza, Gilgit-Baltistan". */
  origin: string;
  /** Primary category, used for breadcrumbs and canonical URLs. */
  categoryId: string;
  images: ImageAsset[];
  /** Optional line illustration shown beside the description (e.g. a botanical drawing). */
  illustration?: ImageAsset;
  variants: ProductVariant[];
  purchaseMode: PurchaseMode;
  badge?: ProductBadge | null;
  /** Short checklist points, e.g. "Naturally caffeine-free". */
  highlights: string[];
  waysToEnjoy: string[];
  howToUse: ProductStep[];
  attributes: ProductAttribute[];
  /** Merchandising flags used by home page sections. */
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  /** Lower number = more popular. Used for "Best selling" sort. */
  popularityRank: number;
  relatedProductIds: string[];
  seo?: SeoOverrides;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}
