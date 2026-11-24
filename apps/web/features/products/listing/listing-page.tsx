import type { ProductSort } from "@northnectar/data";
import { PRODUCT_SORTS, getMinPrice, sortProducts } from "@northnectar/data";
import type { Category, Product } from "@northnectar/types";
import { cn } from "@northnectar/ui";
import Image from "next/image";
import { IntentLink as Link } from "@/components/ui/intent-link";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { shopContent } from "@/content/shop";
import { ProductCard } from "@/features/products/product-card";
import { CategoryGuide } from "./category-guide";
import { images } from "@/lib/images";
import { categoryPath } from "@/lib/routes";
import type { BreadcrumbItem } from "@/lib/seo/json-ld";
import { siteConfig } from "@/lib/seo/config";
import { ShopListing, ShopListingFallback, type ListingItem } from "./shop-listing";

/** "Herbal Tea" -> "Herbal tea" (the mockup's chip labels). */
const sentenceCase = (text: string) => text.charAt(0) + text.slice(1).toLowerCase();

export interface ListingPageProps {
  title: string;
  intro: string;
  breadcrumbs: BreadcrumbItem[];
  /** Products to list (already limited to the category on category pages). */
  products: Product[];
  /** All active categories (for chips and the sidebar). */
  categories: Category[];
  /** Active product count per category slug. */
  counts: Record<string, number>;
  /** Total active products (for "All products"). */
  total: number;
  activeCategory: Category | null;
}

function orderCategories(categories: Category[]) {
  const preferred = shopContent.categoryOrder;
  return [
    ...preferred.flatMap((slug) => categories.filter((c) => c.slug === slug)),
    ...categories.filter((c) => !preferred.includes(c.slug)),
  ];
}

/**
 * Shop and category pages (shared). Server-rendered header, chips, sidebar and cards; filtering and
 * sorting by URL parameters happen in <ShopListing>. Values match the mockup (mobile base, `md:`/`lg:`
 * desktop).
 */
export function ListingPage({
  title,
  intro,
  breadcrumbs,
  products,
  categories,
  counts,
  total,
  activeCategory,
}: ListingPageProps) {
  const ordered = orderCategories(categories);
  const basePath = activeCategory ? categoryPath(activeCategory.slug) : "/shop";

  const chips = [
    { href: "/shop", label: shopContent.allLabel, count: total, active: !activeCategory },
    ...ordered.map((c) => ({
      href: categoryPath(c.slug),
      label: sentenceCase(c.name),
      count: counts[c.slug] ?? 0,
      active: activeCategory?.id === c.id,
    })),
  ];

  const nameOf = (id: string) => categories.find((c) => c.id === id)?.name;
  const items: ListingItem[] = products.map((p) => ({
    id: p.id,
    minPrice: getMinPrice(p),
    search: [p.name, p.tagline, p.botanicalName ?? "", nameOf(p.categoryId) ?? ""]
      .join(" ")
      .toLowerCase(),
    card: <ProductCard product={p} categoryName={nameOf(p.categoryId)} />,
  }));
  const orders = Object.fromEntries(
    PRODUCT_SORTS.map((s) => [s.value, sortProducts(products, s.value).map((p) => p.id)]),
  ) as Record<ProductSort, string[]>;

  const categoryNav = (
    <nav aria-label="Categories" className="flex flex-col gap-[6px]">
      <h2 className="m-0 pb-[6px] font-display text-[18px] leading-[27px] font-semibold tracking-[0.04em] text-[#0f2a1a] uppercase">
        Category
      </h2>
      <ul className="m-0 flex list-none flex-col gap-[6px] p-0">
        {chips.map((chip) => (
          <li key={chip.href}>
            <Link
              href={chip.href}
              aria-current={chip.active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center justify-between rounded-[10px] px-3 text-[15px] text-ink",
                chip.active ? "bg-[#e7efe2] font-bold" : "font-medium hover:bg-[#f1ece0]",
              )}
            >
              {chip.label}
              <span className="text-[14px] font-normal text-[#6a665a]">{chip.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );

  const bulkCard = (
    <div className="on-dark flex flex-col gap-[10px] rounded-[18px] bg-[#0f2a1a] p-[22px] text-[#e9efe4]">
      <h2 className="m-0 font-display text-[20px] leading-[30px] font-semibold text-white uppercase">
        {shopContent.bulk.title}
      </h2>
      <p className="m-0 text-[15px] leading-[1.5] text-[#c9d3c4]">{shopContent.bulk.text}</p>
      <a
        href={siteConfig.contact.whatsappUrl}
        className="mt-1 inline-flex h-11 items-center justify-center rounded-full bg-[#f4a12e] text-[15px] font-bold text-[#1b1a12] hover:bg-orange-600"
      >
        {shopContent.bulk.cta}
      </a>
    </div>
  );

  const listingProps = { basePath, items, orders, categoryNav, bulkCard };

  return (
    <>
      <section
        aria-labelledby="listing-title"
        className="relative overflow-hidden border-b border-[#ece4d3] bg-[#faf7f0]"
      >
        <Image
          src={images.decor.leaf3.src}
          width={images.decor.leaf3.width}
          height={images.decor.leaf3.height}
          alt=""
          aria-hidden="true"
          sizes="240px"
          preload
          fetchPriority="high"
          className="pointer-events-none absolute top-[26px] -right-[30px] h-auto w-[120px] -rotate-[24deg] drop-shadow-[0_12px_14px_rgba(30,60,20,0.2)] md:right-[60px] md:w-[240px]"
        />
        <Image
          src={images.decor.leaf2.src}
          width={images.decor.leaf2.width}
          height={images.decor.leaf2.height}
          alt=""
          aria-hidden="true"
          sizes="90px"
          preload
          fetchPriority="high"
          className="pointer-events-none absolute top-[110px] right-10 h-auto w-[50px] rotate-[16deg] drop-shadow-[0_12px_14px_rgba(30,60,20,0.2)] md:right-[260px] md:w-[90px]"
        />
        <div className="relative mx-auto flex max-w-site flex-col gap-4 px-4 pt-[22px] pb-[26px] md:px-8 md:pt-10 md:pb-[34px]">
          <Breadcrumbs items={breadcrumbs} />
          <h1
            id="listing-title"
            data-rv="mask"
            className="m-0 font-display text-[54px] leading-[0.95] font-bold text-[#0f2a1a] uppercase md:text-[clamp(64px,7.22vw,104px)]"
          >
            {title}
          </h1>
          <p className="m-0 max-w-[560px] text-[17px] leading-[1.6] text-[#4d4a40]">{intro}</p>
          <ul className="m-0 flex [scrollbar-width:none] list-none gap-2 overflow-x-auto p-0 pt-2 pb-[2px]">
            {chips.map((chip) => (
              <li key={chip.href} className="flex-none">
                <Link
                  href={chip.href}
                  aria-current={chip.active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-full border px-[18px] text-[15px] font-semibold whitespace-nowrap",
                    chip.active
                      ? "border-forest-600 bg-forest-600 text-white"
                      : "border-[#e3d8bf] bg-white text-ink hover:border-forest-600",
                  )}
                >
                  {chip.label}
                  <span
                    className={cn(
                      "h-6 min-w-6 rounded-full px-[7px] text-center text-[14px] leading-6 font-bold",
                      chip.active ? "bg-[#3e7a4e] text-white" : "bg-[#efe7d6] text-[#4d4a40]",
                    )}
                  >
                    {chip.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-label="Products" className="px-4 pt-7 pb-12 md:px-8 md:pt-11 md:pb-[72px]">
        <Suspense fallback={<ShopListingFallback {...listingProps} />}>
          <ShopListing {...listingProps} />
        </Suspense>
      </section>

      {activeCategory ? <CategoryGuide category={activeCategory} /> : null}

      <WholesaleBanner />
    </>
  );
}

/** Dark wholesale banner at the foot of listing pages (mockup values). */
export function WholesaleBanner() {
  const w = shopContent.wholesale;
  return (
    <section aria-labelledby="wholesale-banner-title" className="px-4 pb-14 md:px-8 md:pb-24">
      <div className="on-dark relative mx-auto flex max-w-[1424px] flex-wrap items-center justify-between gap-5 overflow-hidden rounded-[28px] bg-[radial-gradient(at_80%_20%,#22573a_0%,#12321f_50%,#0b2114_100%)] px-[22px] py-8 text-white md:px-[52px] md:py-11">
        <Image
          src={images.decor.mountainsCream.src}
          width={images.decor.mountainsCream.width}
          height={images.decor.mountainsCream.height}
          alt=""
          unoptimized
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -bottom-5 h-auto w-[520px] max-w-none opacity-[0.12]"
        />
        <div className="relative flex max-w-[620px] flex-col gap-2">
          <p className="m-0 text-[14px] leading-[21px] font-bold tracking-[0.14em] text-[#9ed7a6] uppercase">
            {w.eyebrow}
          </p>
          <h2
            id="wholesale-banner-title"
            data-rv="mask"
            className="m-0 font-display text-[32px] leading-[1.05] font-bold uppercase md:text-[48px]"
          >
            {w.title}
          </h2>
          <p className="m-0 text-[16px] leading-[1.6] text-[#c9d3c4]">{w.text}</p>
        </div>
        <div className="relative flex flex-wrap gap-3">
          <Link
            href={w.primaryCta.href}
            className="inline-flex h-[54px] items-center rounded-full bg-[#f4a12e] px-7 font-display text-[17px] font-semibold tracking-[0.04em] text-[#1b1a12] uppercase hover:bg-orange-600"
          >
            {w.primaryCta.label}
          </Link>
          <a
            href={siteConfig.contact.whatsappUrl}
            className="inline-flex h-[54px] items-center rounded-full border-2 border-white px-[26px] font-display text-[17px] font-semibold tracking-[0.04em] text-white uppercase hover:bg-white hover:text-[#0f2a1a]"
          >
            {w.secondaryCta.label}
          </a>
        </div>
      </div>
    </section>
  );
}
