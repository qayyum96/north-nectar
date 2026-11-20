import { createClient } from "@supabase/supabase-js";
import type { CatalogRepository } from "./repository";
import { SeedCatalogRepository } from "./seed/seed-repository";
import { SupabaseCatalogRepository } from "./supabase/supabase-repository";

export type { CatalogRepository, ProductQuery, ProductSort } from "./repository";
export { PRODUCT_SORTS } from "./sorts";
export { SeedCatalogRepository } from "./seed/seed-repository";
export { SupabaseCatalogRepository } from "./supabase/supabase-repository";
export { toCategory, toProduct, toVariant } from "./supabase/mappers";
export type { CategoryRow, ProductRow, VariantRow } from "./supabase/rows";
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
 *   CATALOG_SOURCE=supabase         Supabase (NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY;
 *                                   drafts additionally need SUPABASE_SERVICE_ROLE_KEY)
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
    case "supabase": {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = includeDrafts
        ? process.env.SUPABASE_SERVICE_ROLE_KEY
        : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        throw new Error(
          "CATALOG_SOURCE=supabase needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY" +
            (includeDrafts ? " (and SUPABASE_SERVICE_ROLE_KEY for drafts)" : ""),
        );
      }
      const client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      return new SupabaseCatalogRepository(client, { includeDrafts });
    }
    default:
      throw new Error(`Unknown CATALOG_SOURCE "${source}". Expected "seed" or "supabase".`);
  }
}
