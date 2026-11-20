import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { cartContent } from "@/content/cart";
import { CartPageContent, CartSubtitle } from "@/features/cart/cart-page";
import { ProductGrid } from "@/features/products/product-grid";
import { catalog } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: cartContent.meta.title,
  description: cartContent.meta.description,
  path: "/cart",
  noIndex: true,
});

/** Cart page: static shell; the cart itself is restored in the browser. */
export default async function CartPage() {
  const [bestSellers, categories] = await Promise.all([
    catalog.getBestSellers(4),
    catalog.getCategories(),
  ]);
  const copy = cartContent.page;

  const popular =
    bestSellers.length > 0 ? (
      <section aria-labelledby="popular-title" className="flex flex-col gap-6">
        <h2
          id="popular-title"
          data-rv="mask"
          className="m-0 font-display text-[34px] leading-none font-bold text-[#0f2a1a] uppercase md:text-[52px]"
        >
          {copy.empty.popular}
        </h2>
        <ProductGrid
          products={bestSellers}
          categories={categories}
          className="md:gap-x-[22px] md:gap-y-7"
        />
      </section>
    ) : null;

  return (
    <>
      <section aria-labelledby="cart-title" className="border-b border-[#ece4d3] bg-[#faf7f0]">
        <div className="mx-auto flex max-w-[1384px] flex-col gap-3 px-4 pt-[22px] pb-[26px] md:px-8 md:py-9">
          <Breadcrumbs items={[{ name: "Cart", path: "/cart" }]} />
          <h1
            id="cart-title"
            data-rv="mask"
            className="m-0 font-display text-[56px] leading-[0.95] font-bold text-[#0f2a1a] uppercase md:text-[96px]"
          >
            {copy.title}
          </h1>
          <CartSubtitle />
        </div>
      </section>
      <section aria-label="Cart" className="px-4 pt-6 pb-14 md:px-8 md:pt-10 md:pb-24">
        <CartPageContent popular={popular} />
      </section>
    </>
  );
}
