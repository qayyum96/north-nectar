import "server-only";
import { toProduct, type ProductRow } from "@northnectar/data";
import type { Product } from "@northnectar/types";
import { catalog } from "@/lib/catalog";
import { supabaseService } from "@/lib/supabase/server";
import type { CatalogVariant, VariantCatalog } from "./variant-catalog";

export function toCatalogVariants(product: Product): CatalogVariant[] {
  if (product.purchaseMode !== "retail") return [];
  const image = product.images[0];
  return product.variants.map((v) => ({
    variantId: v.id,
    productId: product.id,
    sku: v.sku,
    slug: product.slug,
    name: product.name,
    label: v.label,
    price: v.price,
    stock: v.stock,
    image: { src: image?.src ?? "", alt: image?.alt ?? product.name },
  }));
}

const index = (products: Product[]): VariantCatalog =>
  Object.fromEntries(products.flatMap(toCatalogVariants).map((v) => [v.variantId, v] as const));

/**
 * Every size of every active, cart-purchasable product. `fresh: true` skips the catalogue's
 * short-lived cache (used after checkout finds that prices or stock changed).
 */
export async function getVariantCatalog(
  options: { fresh?: boolean } = {},
): Promise<VariantCatalog> {
  if (options.fresh && process.env.CATALOG_SOURCE === "supabase") {
    const { data, error } = await supabaseService()
      .from("products")
      .select("*, product_variants(*)")
      .eq("status", "active");
    if (!error && data) return index((data as ProductRow[]).map(toProduct));
  }
  return index(await catalog.getProducts());
}
