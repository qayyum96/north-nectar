import "server-only";

import { createCatalogRepository, type CatalogRepository } from "@northnectar/data";

/**
 * The single catalogue instance used by every page, the sitemap and structured data.
 * UI code imports `catalog` and calls repository methods; it never knows where data comes from.
 *
 * Caching: pages that read the catalogue export `revalidate` (ISR). When the Supabase
 * implementation lands, wrap its reads with Next's data cache and revalidate by tag
 * ("products", "categories") from the admin portal.
 */
export const catalog: CatalogRepository = createCatalogRepository();
