import type { Product, ProductVariant } from "@northnectar/types";

/**
 * The minimum product data client components need to choose a size and add to cart.
 * Passing this (instead of the full Product) keeps the props sent to the browser small.
 */
export interface PurchasableProduct {
  id: string;
  slug: string;
  name: string;
  image: { src: string; alt: string };
  purchaseMode: Product["purchaseMode"];
  variants: ProductVariant[];
}

export function toPurchasable(product: Product): PurchasableProduct {
  const image = product.images[0];
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    image: { src: image?.src ?? "", alt: image?.alt ?? product.name },
    purchaseMode: product.purchaseMode,
    variants: product.variants,
  };
}
