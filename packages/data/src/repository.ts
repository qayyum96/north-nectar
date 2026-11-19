import type { Category, Product } from "@northnectar/types";

export type ProductSort = "featured" | "best-selling" | "price-asc" | "price-desc" | "name-asc";

export interface ProductQuery {
  /** Category slug. Omit for all categories. */
  category?: string;
  /** Free-text search over name, tagline and category. */
  search?: string;
  /** Inclusive price range in PKR, matched against the cheapest variant. */
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  limit?: number;
}

/**
 * The only contract UI code depends on.
 *
 * Every method returns ACTIVE records only, so draft products and empty categories never reach
 * the website, the sitemap or the structured data. The seed implementation (Phase 2) and the
 * future Supabase implementation both implement this interface.
 */
export interface CatalogRepository {
  getProducts(query?: ProductQuery): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  getBestSellers(limit?: number): Promise<Product[]>;
  getNewArrivals(limit?: number): Promise<Product[]>;
  getRelatedProducts(product: Product, limit?: number): Promise<Product[]>;
  /** Active categories that contain at least one active product. */
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
}
