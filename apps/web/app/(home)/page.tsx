import type { Product } from "@northnectar/types";
import { BlogTeaser } from "@/components/sections/home/blog-teaser";
import { CategoryCircles } from "@/components/sections/home/category-circles";
import { HomeHero } from "@/components/sections/home/hero";
import { Marquee } from "@/components/sections/home/marquee";
import { OriginSplit } from "@/components/sections/home/origin-split";
import { ProductShowcase, type ShowcaseTab } from "@/components/sections/home/product-showcase";
import { ProductSpotlight } from "@/components/sections/home/product-spotlight";
import { PromoCards, type Promo } from "@/components/sections/home/promo-cards";
import { Reviews } from "@/components/sections/home/reviews";
import { StoryShowcase } from "@/components/sections/home/story-showcase";
import { ValleyBanner } from "@/components/sections/home/valley-banner";
import { WholesaleBand } from "@/components/sections/home/wholesale-band";
import { homeContent } from "@/content/home";
import { getPosts } from "@/lib/blog";
import { catalog } from "@/lib/catalog";
import { showPlaceholderContent } from "@/lib/env";
import { siteConfig } from "@/lib/seo/config";
import { buildMetadata } from "@/lib/seo/metadata";

/** ISR: rebuilt at most hourly, so catalogue changes show up without a redeploy. */
export const revalidate = 3600;

export const metadata = buildMetadata({
  title: siteConfig.titleDefault,
  absoluteTitle: true,
  description: siteConfig.description,
  path: "/",
});

const ROW = 4;

const MAX_CATEGORY_TABS = 3;

/*
 * Merchandising rules, written so the page looks complete with any catalogue size:
 * - Best sellers: flagged best sellers first, topped up with other products so the row is never
 *   sparse. Category tabs (as in the mockup) show whenever products span 2+ categories.
 * - New arrivals: only products not already shown above; the section hides when none are left.
 * - Promos and the spotlight: only for products that are active.
 */
function bestSellerTabs(
  products: Product[],
  categories: { id: string; slug: string; name: string }[],
) {
  const ranked = [
    ...products.filter((p) => p.isBestSeller),
    ...products.filter((p) => !p.isBestSeller),
  ];
  const tabs: ShowcaseTab[] = [{ id: "all", label: "All", products: ranked.slice(0, ROW) }];

  // Preferred order from content (mockup: Superfoods, Herbal roots, Dry fruits), then any other
  // category with products. Categories without active products are skipped.
  const preferred = homeContent.bestSellers.tabCategorySlugs;
  const ordered = [
    ...preferred.flatMap((slug) => categories.filter((c) => c.slug === slug)),
    ...categories.filter((c) => !preferred.includes(c.slug)),
  ];
  const categoryTabs = ordered
    .map((category) => ({
      id: category.slug,
      label: sentenceCase(category.name),
      products: products.filter((p) => p.categoryId === category.id).slice(0, ROW),
    }))
    .filter((tab) => tab.products.length > 0)
    .slice(0, MAX_CATEGORY_TABS);

  // A single category tab would just repeat "All", so tabs need at least two categories.
  return categoryTabs.length >= 2 ? [...tabs, ...categoryTabs] : tabs;
}

/** "Herbal Roots" -> "Herbal roots" (the mockup's tab labels). */
const sentenceCase = (text: string) => text.charAt(0) + text.slice(1).toLowerCase();

export default async function HomePage() {
  const [products, categories, newArrivals, posts] = await Promise.all([
    catalog.getProducts({ sort: "best-selling" }),
    catalog.getCategories(),
    catalog.getNewArrivals(),
    getPosts(),
  ]);
  const bySlug = (slug: string) => products.find((p) => p.slug === slug) ?? null;

  const spotlight = bySlug(homeContent.spotlight.productSlug);
  const tabs = bestSellerTabs(products, categories);
  const shown = new Set(tabs[0]?.products.map((p) => p.id));
  const freshArrivals = newArrivals.filter((p) => !shown.has(p.id)).slice(0, ROW);

  // Two promo slots, as in the mockup: prefer non-spotlight products, fall back to the spotlight
  // product rather than leave a slot empty. Tones follow position (peach, then dark).
  const promoCandidates = homeContent.promos.flatMap((promo) => {
    const product = bySlug(promo.productSlug);
    return product ? [{ ...promo, product }] : [];
  });
  const promos: Promo[] = [
    ...promoCandidates.filter((p) => p.product.id !== spotlight?.id),
    ...promoCandidates.filter((p) => p.product.id === spotlight?.id),
  ]
    .slice(0, 2)
    .map((p, i) => ({ ...p, tone: i === 0 ? "peach" : "dark" }));

  const reviewsVisible = !homeContent.reviews.isPlaceholder || showPlaceholderContent;

  return (
    <>
      <HomeHero
        announcementProduct={bySlug(homeContent.hero.announcement.productSlug)}
        showSocialProof={reviewsVisible}
      />
      <StoryShowcase />
      <Marquee />
      <CategoryCircles categories={categories} />
      <ProductShowcase
        id="best-sellers"
        eyebrow={homeContent.bestSellers.eyebrow}
        title={homeContent.bestSellers.title}
        tabs={tabs}
        categories={categories}
        viewAll={{ label: "View all products", href: "/shop" }}
      />
      <PromoCards promos={promos} />
      <ProductSpotlight product={spotlight} />
      <ProductShowcase
        id="new-arrivals"
        eyebrow={homeContent.newArrivals.eyebrow}
        title={homeContent.newArrivals.title}
        tabs={[{ id: "new", label: "New", products: freshArrivals }]}
        categories={categories}
        viewAll={{ label: "View all products", href: "/shop" }}
      />
      <OriginSplit />
      <Reviews visible={reviewsVisible} />
      <BlogTeaser
        posts={posts}
        photoFor={(post) =>
          post.relatedProducts.map((s) => bySlug(s)?.images[0]).find(Boolean) ?? null
        }
      />
      <WholesaleBand />
      <ValleyBanner />
    </>
  );
}
