import type { CatalogRepository } from "./repository";
import { SeedCatalogRepository } from "./seed/seed-repository";

export type { CatalogRepository, ProductQuery, ProductSort } from "./repository";
export { PRODUCT_SORTS } from "./sorts";
export { SeedCatalogRepository } from "./seed/seed-repository";
export {
  getDefaultVariant,
  getMinPrice,
  getPriceRange,
  getVariantByLabel,
  isPurchasable,
  isVariantInStock,
  sortProducts,
} from "./product-utils";

/**
 * Returns the catalogue implementation for the current environment.
 *
 *   CATALOG_SOURCE=seed (default)   in-memory seed data (packages/data/src/seed)
 *   CATALOG_SOURCE=supabase         Supabase implementation (see docs/supabase.md; not built yet)
 *
 * CATALOG_INCLUDE_DRAFTS=true shows draft products for local layout testing. It is ignored when
 * NEXT_PUBLIC_SITE_ENV=production, so drafts can never leak to the live site.
 */
export function createCatalogRepository(): CatalogRepository {
  const source = process.env.CATALOG_SOURCE ?? "seed";
  const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";
  const includeDrafts = !isProduction && process.env.CATALOG_INCLUDE_DRAFTS === "true";

  switch (source) {
    case "seed":
      return new SeedCatalogRepository({ includeDrafts });
    // case "supabase":
    //   return new SupabaseCatalogRepository(createSupabaseServerClient());
    default:
      throw new Error(`Unknown CATALOG_SOURCE "${source}". Expected "seed".`);
  }
}
