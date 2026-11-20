/**
 * Current price and stock for every purchasable size, keyed by variant id. Built on the server from
 * the data layer and sent to the browser so the cart always shows today's prices (cart lines keep a
 * snapshot from when they were added). The order Server Action re-prices from the data layer again.
 */
export interface CatalogVariant {
  variantId: string;
  productId: string;
  sku: string;
  slug: string;
  name: string;
  label: string;
  price: number;
  stock: number;
  image: { src: string; alt: string };
}

export type VariantCatalog = Record<string, CatalogVariant>;
