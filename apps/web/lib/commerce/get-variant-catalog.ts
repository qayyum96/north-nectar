import "server-only";
import type { Product } from "@northnectar/types";
import { catalog } from "@/lib/catalog";
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

/** Every size of every active, cart-purchasable product. */
export async function getVariantCatalog(): Promise<VariantCatalog> {
  const products = await catalog.getProducts();
  return Object.fromEntries(
    products.flatMap(toCatalogVariants).map((v) => [v.variantId, v] as const),
  );
}
