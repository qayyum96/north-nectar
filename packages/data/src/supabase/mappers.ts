import type { Category, ImageAsset, Product, ProductVariant } from "@northnectar/types";
import type { CategoryRow, ProductRow, VariantRow } from "./rows";

/** Database rows → domain types used by the website (and the admin). */

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    ...(row.short_name ? { shortName: row.short_name } : {}),
    description: row.description,
    image: (row.image ?? {
      src: "",
      alt: row.name,
      width: 600,
      height: 600,
    }) as unknown as ImageAsset,
    sortOrder: row.sort_order,
    status: row.status,
    ...(row.seo ? { seo: row.seo as Category["seo"] } : {}),
  };
}

/**
 * The website only needs what can be sold now, so `stock` is the AVAILABLE quantity
 * (on hand minus units reserved by open orders).
 */
export function toVariant(row: VariantRow): ProductVariant {
  return {
    id: row.id,
    sku: row.sku,
    label: row.label,
    weightGrams: row.weight_grams,
    price: row.price,
    compareAtPrice: row.compare_at_price,
    stock: Math.max(0, row.stock - row.reserved),
    tag: row.tag,
    isDefault: row.is_default,
  };
}

export function toProduct(row: ProductRow): Product {
  const variants = [...(row.product_variants ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(toVariant);
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    name: row.name,
    ...(row.short_name ? { shortName: row.short_name } : {}),
    tagline: row.tagline,
    description: row.description,
    ...(row.botanical_name ? { botanicalName: row.botanical_name } : {}),
    origin: row.origin,
    categoryId: row.category_id,
    images: row.images as ImageAsset[],
    ...(row.illustration ? { illustration: row.illustration as unknown as ImageAsset } : {}),
    variants,
    purchaseMode: row.purchase_mode,
    badge: (row.badge as Product["badge"]) ?? null,
    highlights: row.highlights,
    waysToEnjoy: row.ways_to_enjoy,
    howToUse: row.how_to_use as Product["howToUse"],
    attributes: row.attributes as Product["attributes"],
    isFeatured: row.is_featured,
    isBestSeller: row.is_best_seller,
    isNewArrival: row.is_new_arrival,
    popularityRank: row.popularity_rank,
    relatedProductIds: row.related_product_ids,
    ...(row.seo ? { seo: row.seo as Product["seo"] } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
