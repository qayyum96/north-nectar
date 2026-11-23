"use client";

import type { ProductSort } from "@northnectar/data";
import { ChevronDownIcon, FilterIcon, cn } from "@northnectar/ui";
import { IntentLink as Link } from "@/components/ui/intent-link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { shopContent } from "@/content/shop";
import {
  DEFAULT_PARAMS,
  PRICE_RANGES,
  SORTS,
  listingHref,
  parseParams,
  type ListingParams,
} from "./params";

export interface ListingItem {
  id: string;
  /** Cheapest variant price; null for quote-only products. */
  minPrice: number | null;
  /** Lower-cased text used for ?q= search. */
  search: string;
  /** The server-rendered product card. */
  card: ReactNode;
}

export interface ListingProps {
  basePath: string;
  items: ListingItem[];
  /** Item ids in each sort order (computed on the server with the shared sort rules). */
  orders: Record<ProductSort, string[]>;
  /** Server-rendered category list for the sidebar. */
  categoryNav: ReactNode;
  /** Server-rendered "Buying in bulk?" card. */
  bulkCard: ReactNode;
}

/** Reads ?sort=, ?price= and ?q= from the URL. Rendered inside <Suspense>. */
export function ShopListing(props: ListingProps) {
  const searchParams = useSearchParams();
  return <ShopListingView {...props} params={parseParams((k) => searchParams.get(k))} />;
}

/** Fallback for the static HTML (default sort, no filters), so all products are in the page source. */
export function ShopListingFallback(props: ListingProps) {
  return <ShopListingView {...props} params={DEFAULT_PARAMS} />;
}

const priceChip = (selected: boolean, mobile = false) =>
  cn(
    "inline-flex items-center rounded-full border px-[14px] text-[14px] font-semibold",
    mobile ? "h-10" : "h-[38px]",
    selected
      ? "border-forest-600 bg-forest-600 text-white"
      : "border-[#ddd3bf] bg-white text-ink hover:border-forest-600",
  );

function ShopListingView({
  basePath,
  items,
  orders,
  categoryNav,
  bulkCard,
  params,
}: ListingProps & { params: ListingParams }) {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const range = PRICE_RANGES.find((r) => r.value === params.price);
  const terms = params.q.toLowerCase().split(/\s+/).filter(Boolean);
  const byId = new Map(items.map((i) => [i.id, i]));
  const visible = (orders[params.sort] ?? orders.featured)
    .map((id) => byId.get(id))
    .filter((item): item is ListingItem => Boolean(item))
    .filter(
      (item) =>
        !range ||
        (item.minPrice !== null && item.minPrice >= range.min && item.minPrice <= range.max),
    )
    .filter((item) => terms.every((t) => item.search.includes(t)));

  const priceHref = (value: ListingParams["price"]) =>
    listingHref(basePath, { ...params, price: params.price === value ? null : value });
  const hasFilters = Boolean(params.price || params.q);

  const priceLinks = (mobile: boolean) => (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
      {PRICE_RANGES.map((r) => (
        <li key={r.value}>
          <Link
            href={priceHref(r.value)}
            scroll={false}
            replace
            aria-current={params.price === r.value ? "true" : undefined}
            className={priceChip(params.price === r.value, mobile)}
          >
            {r.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="mx-auto flex max-w-[1320px] items-start gap-10">
      <aside
        aria-label="Filters"
        className="sticky top-[150px] hidden w-[260px] flex-none flex-col gap-7 lg:flex"
      >
        {categoryNav}
        <div className="flex flex-col gap-[10px]">
          <h2 className="m-0 font-display text-[18px] leading-[27px] font-semibold tracking-[0.04em] text-[#0f2a1a] uppercase">
            Price
          </h2>
          {priceLinks(false)}
        </div>
        {bulkCard}
      </aside>

      <div className="flex min-w-0 flex-auto flex-col gap-[22px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-[15px] leading-[23px] text-[#4d4a40]" aria-live="polite">
            Showing <strong className="text-[#0f2a1a]">{visible.length}</strong>{" "}
            {visible.length === 1 ? "product" : "products"}
            {params.q ? (
              <>
                {" "}
                for <strong className="text-[#0f2a1a]">“{params.q}”</strong>
              </>
            ) : null}
            {hasFilters ? (
              <>
                {" · "}
                <Link
                  href={basePath}
                  scroll={false}
                  className="font-semibold text-forest-600 underline"
                >
                  Clear
                </Link>
              </>
            ) : null}
          </p>
          <div className="flex flex-[1_1_100%] gap-[10px] lg:flex-none">
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="mobile-filters"
              onClick={() => setFiltersOpen((v) => !v)}
              className="inline-flex h-[46px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[#ddd3bf] bg-white text-[15px] font-semibold text-ink lg:hidden"
            >
              <FilterIcon size={18} /> Filters
            </button>
            {/* Works without JavaScript too: the form submits ?sort= as a normal GET request. */}
            <form action={basePath} method="get" className="relative flex-1">
              {params.q ? <input type="hidden" name="q" value={params.q} /> : null}
              {params.price ? <input type="hidden" name="price" value={params.price} /> : null}
              <label htmlFor="sort-products" className="sr-only">
                Sort products
              </label>
              <select
                id="sort-products"
                name="sort"
                value={params.sort}
                onChange={(e) =>
                  router.replace(
                    listingHref(basePath, { ...params, sort: e.target.value as ProductSort }),
                    {
                      scroll: false,
                    },
                  )
                }
                className="h-[46px] w-full min-w-[210px] cursor-pointer appearance-none rounded-[10px] border border-[#ddd3bf] bg-white pr-10 pl-[14px] text-[15px] text-ink"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                size={18}
                className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2 text-[#5e5a4e]"
              />
              <noscript>
                <button type="submit" className="mt-2 underline">
                  Apply sort
                </button>
              </noscript>
            </form>
          </div>
        </div>

        {filtersOpen ? (
          <div
            id="mobile-filters"
            className="flex flex-col gap-3 rounded-[16px] border border-[#e3d8bf] bg-white p-[18px] lg:hidden"
          >
            <h2 className="m-0 font-display text-[17px] leading-[26px] font-semibold text-[#0f2a1a] uppercase">
              Price
            </h2>
            {priceLinks(true)}
          </div>
        ) : null}

        {visible.length > 0 ? (
          <>
            <h2 className="sr-only">Products</h2>
            <ul className="m-0 grid list-none grid-cols-2 gap-x-3 gap-y-4 p-0 md:grid-cols-3 md:gap-x-[22px] md:gap-y-7">
              {visible.map((item) => (
                <li key={item.id}>{item.card}</li>
              ))}
            </ul>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-[18px] border border-[#e8dfcc] bg-white px-6 py-14 text-center">
            <p className="m-0 font-display text-[24px] font-semibold text-[#0f2a1a] uppercase">
              {shopContent.empty.title}
            </p>
            <p className="m-0 text-[15px] text-[#5e5a4e]">{shopContent.empty.text}</p>
            <Link
              href={basePath}
              className="mt-2 inline-flex h-[46px] items-center rounded-[10px] bg-forest-600 px-6 text-[15px] font-bold text-white"
            >
              {shopContent.empty.cta}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
