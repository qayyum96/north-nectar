import type { Product, ProductVariant } from "@northnectar/types";
import type { ProductSort } from "./repository";

/*
 * Pure helpers over the Product model. Shared by every repository implementation and by UI code,
 * so pricing and availability rules live in exactly one place.
 */

/** The variant shown first: the one flagged `isDefault`, else the first in stock, else the first. */
export function getDefaultVariant(product: Pick<Product, "variants">): ProductVariant | undefined {
  return (
    product.variants.find((v) => v.isDefault) ??
    product.variants.find((v) => v.stock > 0) ??
    product.variants[0]
  );
}

/** Finds a variant by its size label (case-insensitive), e.g. "250g" from `?size=250g`. */
export function getVariantByLabel(
  product: Pick<Product, "variants">,
  label: string | null | undefined,
) {
  if (!label) return undefined;
  const wanted = label.trim().toLowerCase();
  return product.variants.find((v) => v.label.toLowerCase() === wanted);
}

export function getPriceRange(product: Product): { min: number; max: number } | null {
  if (product.purchaseMode === "quote" || product.variants.length === 0) return null;
  const prices = product.variants.map((v) => v.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Lowest price, used for sorting and price filters. Null for quote-only products. */
export function getMinPrice(product: Product): number | null {
  return getPriceRange(product)?.min ?? null;
}

export function isVariantInStock(variant: ProductVariant): boolean {
  return variant.stock > 0;
}

/** Can be added to the cart (retail, with at least one variant in stock). */
export function isPurchasable(product: Product): boolean {
  return product.purchaseMode === "retail" && product.variants.some(isVariantInStock);
}

export function sortProducts(products: Product[], sort: ProductSort = "featured"): Product[] {
  const list = [...products];
  const price = (p: Product) => getMinPrice(p);
  switch (sort) {
    case "best-selling":
      return list.sort((a, b) => a.popularityRank - b.popularityRank);
    case "price-asc":
      // Quote-only products (no price) go last.
      return list.sort((a, b) => (price(a) ?? Infinity) - (price(b) ?? Infinity));
    case "price-desc":
      return list.sort((a, b) => (price(b) ?? -Infinity) - (price(a) ?? -Infinity));
    case "name-asc":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case "featured":
    default:
      // Featured first, then best sellers, then by popularity.
      return list.sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) ||
          Number(b.isBestSeller) - Number(a.isBestSeller) ||
          a.popularityRank - b.popularityRank,
      );
  }
}
