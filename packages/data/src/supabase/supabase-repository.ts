import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, Product } from "@northnectar/types";
import type { CatalogRepository, ProductQuery } from "../repository";
import { SeedCatalogRepository } from "../seed/seed-repository";
import { toCategory, toProduct } from "./mappers";
import type { CategoryRow, ProductRow } from "./rows";

export interface SupabaseRepositoryOptions {
  /**
   * Include draft products (local preview only). Requires a client created with the secret key,
   * because the public key can only read active rows (row level security).
   */
  includeDrafts?: boolean;
  /** How long one catalogue snapshot is reused, in ms. Pages also revalidate on their own. */
  cacheMs?: number;
}

/**
 * Catalogue backed by Supabase. The whole active catalogue (a few dozen products) is read in
 * two queries and kept as a short-lived snapshot; filtering and sorting reuse the in-memory
 * implementation, so both sources behave identically.
 */
export class SupabaseCatalogRepository implements CatalogRepository {
  private snapshot: Promise<SeedCatalogRepository> | null = null;
  private loadedAt = 0;

  constructor(
    private readonly client: SupabaseClient,
    private readonly options: SupabaseRepositoryOptions = {},
  ) {}

  clearCache() {
    this.snapshot = null;
    this.loadedAt = 0;
  }

  private load(): Promise<SeedCatalogRepository> {
    const maxAge = this.options.cacheMs ?? 60_000;
    if (!this.snapshot || Date.now() - this.loadedAt > maxAge) {
      this.loadedAt = Date.now();
      this.snapshot = this.fetchSnapshot().catch((error: unknown) => {
        this.snapshot = null;
        throw error;
      });
    }
    return this.snapshot;
  }

  private async fetchSnapshot(): Promise<SeedCatalogRepository> {
    const [products, categories] = await Promise.all([
      this.client.from("products").select("*, product_variants(*)"),
      this.client.from("categories").select("*"),
    ]);
    if (products.error)
      throw new Error(`Catalogue: products query failed: ${products.error.message}`);
    if (categories.error) {
      throw new Error(`Catalogue: categories query failed: ${categories.error.message}`);
    }
    const mappedProducts: Product[] = (products.data as ProductRow[]).map(toProduct);
    const mappedCategories: Category[] = (categories.data as CategoryRow[]).map(toCategory);
    return new SeedCatalogRepository({
      products: mappedProducts,
      categories: mappedCategories,
      includeDrafts: this.options.includeDrafts ?? false,
    });
  }

  async getProducts(query?: ProductQuery) {
    return (await this.load()).getProducts(query);
  }
  async getProductBySlug(slug: string) {
    return (await this.load()).getProductBySlug(slug);
  }
  async getFeaturedProducts(limit?: number) {
    return (await this.load()).getFeaturedProducts(limit);
  }
  async getBestSellers(limit?: number) {
    return (await this.load()).getBestSellers(limit);
  }
  async getNewArrivals(limit?: number) {
    return (await this.load()).getNewArrivals(limit);
  }
  async getRelatedProducts(product: Product, limit?: number) {
    return (await this.load()).getRelatedProducts(product, limit);
  }
  async getCategories() {
    return (await this.load()).getCategories();
  }
  async getCategoryBySlug(slug: string) {
    return (await this.load()).getCategoryBySlug(slug);
  }
  async getProductCountsByCategory() {
    return (await this.load()).getProductCountsByCategory();
  }
}
