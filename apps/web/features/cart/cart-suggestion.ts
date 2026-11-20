/** A product offered in the drawer's "Pairs well" slot (default size of a best seller). */
export interface CartSuggestion {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  shortName: string;
  variantLabel: string;
  price: number;
  image: { src: string; alt: string };
}
