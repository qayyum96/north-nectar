import type { Category, Product } from "@northnectar/types";
import { getMinPrice, sortProducts } from "../product-utils";
import type { CatalogRepository, ProductQuery } from "../repository";
import { seedCategories } from "./categories";
import { seedProducts } from "./products";

export interface SeedRepositoryOptions {
  /** Include draft products (local preview only; never enabled in production). */
  includeDrafts?: boolean;
  products?: Product[];
  categories?: Category[];
}

/**
 * In-memory implementation backed by the TypeScript seed files. Returns deep copies so callers
 * can never mutate the seed data. Swap for the Supabase implementation without touching UI code.
 */
export class SeedCatalogRepository implements CatalogRepository {
  private readonly products: Product[];
  private readonly categories: Category[];

  constructor(options: SeedRepositoryOptions = {}) {
    const products = options.products ?? seedProducts;
    this.products = options.includeDrafts
      ? products
      : products.filter((p) => p.status === "active");
    this.categories = (options.categories ?? seedCategories).filter((c) => c.status === "active");
  }

  private clone<T>(value: T): T {
    return structuredClone(value);
  }

  private categoryIdForSlug(slug: string): string | undefined {
    return this.categories.find((c) => c.slug === slug)?.id;
  }

  async getProducts(query: ProductQuery = {}): Promise<Product[]> {
    let list = this.products;

    if (query.category) {
      const id = this.categoryIdForSlug(query.category);
      list = id ? list.filter((p) => p.categoryId === id) : [];
    }

    if (query.search?.trim()) {
      const terms = query.search.trim().toLowerCase().split(/\s+/);
      list = list.filter((p) => {
        const category = this.categories.find((c) => c.id === p.categoryId)?.name ?? "";
        const haystack = [p.name, p.tagline, p.botanicalName ?? "", category, p.origin]
          .join(" ")
          .toLowerCase();
        return terms.every((t) => haystack.includes(t));
      });
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const min = query.minPrice ?? 0;
      const max = query.maxPrice ?? Infinity;
      list = list.filter((p) => {
        const price = getMinPrice(p);
        return price !== null && price >= min && price <= max;
      });
    }

    const sorted = sortProducts(list, query.sort);
    return this.clone(query.limit ? sorted.slice(0, query.limit) : sorted);
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const product = this.products.find((p) => p.slug === slug);
    return product ? this.clone(product) : null;
  }

  async getFeaturedProducts(limit?: number): Promise<Product[]> {
    const list = sortProducts(
      this.products.filter((p) => p.isFeatured),
      "best-selling",
    );
    return this.clone(limit ? list.slice(0, limit) : list);
  }

  async getBestSellers(limit?: number): Promise<Product[]> {
    const list = sortProducts(
      this.products.filter((p) => p.isBestSeller),
      "best-selling",
    );
    return this.clone(limit ? list.slice(0, limit) : list);
  }

  async getNewArrivals(limit?: number): Promise<Product[]> {
    const list = [...this.products.filter((p) => p.isNewArrival)].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    return this.clone(limit ? list.slice(0, limit) : list);
  }

  async getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
    const others = this.products.filter((p) => p.id !== product.id);
    const explicit = product.relatedProductIds
      .map((id) => others.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
    const sameCategory = sortProducts(
      others.filter((p) => p.categoryId === product.categoryId && !explicit.includes(p)),
      "best-selling",
    );
    const rest = sortProducts(
      others.filter((p) => !explicit.includes(p) && !sameCategory.includes(p)),
      "best-selling",
    );
    return this.clone([...explicit, ...sameCategory, ...rest].slice(0, limit));
  }

  async getCategories(): Promise<Category[]> {
    const withProducts = new Set(this.products.map((p) => p.categoryId));
    const list = this.categories
      .filter((c) => withProducts.has(c.id))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return this.clone(list);
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const categories = await this.getCategories();
    return categories.find((c) => c.slug === slug) ?? null;
  }

  async getProductCountsByCategory(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const p of this.products) {
      const slug = this.categories.find((c) => c.id === p.categoryId)?.slug;
      if (slug) counts[slug] = (counts[slug] ?? 0) + 1;
    }
    return counts;
  }
}
