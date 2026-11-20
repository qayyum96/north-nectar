import type { ProductSort } from "@northnectar/data";

/*
 * Listing URL parameters (crawlable, shareable): ?sort=, ?price=, ?q=
 * Categories are paths (/shop/[category]), not parameters, so each has one clean URL.
 */

export const SORTS: { value: ProductSort; label: string }[] = [
  { value: "featured", label: "Sort: Featured" },
  { value: "best-selling", label: "Sort: Best selling" },
  { value: "price-asc", label: "Sort: Price, low to high" },
  { value: "price-desc", label: "Sort: Price, high to low" },
  { value: "name-asc", label: "Sort: Name, A to Z" },
];

export const PRICE_RANGES = [
  { value: "under-1000", label: "Under Rs 1,000", min: 0, max: 999 },
  { value: "1000-5000", label: "Rs 1,000 to 5,000", min: 1000, max: 5000 },
  { value: "over-5000", label: "Over Rs 5,000", min: 5001, max: Number.POSITIVE_INFINITY },
] as const;

export type PriceRange = (typeof PRICE_RANGES)[number]["value"];

export interface ListingParams {
  sort: ProductSort;
  price: PriceRange | null;
  q: string;
}

export const DEFAULT_PARAMS: ListingParams = { sort: "featured", price: null, q: "" };

export function parseParams(get: (key: string) => string | null): ListingParams {
  const sort = get("sort");
  const price = get("price");
  return {
    sort: SORTS.some((s) => s.value === sort) ? (sort as ProductSort) : "featured",
    price: PRICE_RANGES.some((p) => p.value === price) ? (price as PriceRange) : null,
    q: (get("q") ?? "").trim().slice(0, 80),
  };
}

/** Builds a listing URL, omitting default values so canonical-looking URLs stay clean. */
export function listingHref(basePath: string, params: ListingParams): string {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.price) qs.set("price", params.price);
  if (params.sort !== "featured") qs.set("sort", params.sort);
  const query = qs.toString();
  return query ? `${basePath}?${query}` : basePath;
}
