import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductCard } from "@/features/products/product-card";
import { WishlistGrid } from "@/features/wishlist/wishlist-grid";
import { catalog } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Your Wishlist",
  description: "Products you have saved at North Nectar.",
  path: "/wishlist",
  noIndex: true,
});

/** Saved products (stored in the browser). Static shell with every active product's card. */
export default async function WishlistPage() {
  const [products, categories] = await Promise.all([
    catalog.getProducts(),
    catalog.getCategories(),
  ]);
  const nameOf = (id: string) => categories.find((c) => c.id === id)?.name;
  const items = products.map((p) => ({
    id: p.id,
    card: <ProductCard product={p} categoryName={nameOf(p.categoryId)} />,
  }));

  return (
    <>
      <section aria-labelledby="wishlist-title" className="border-b border-[#ece4d3] bg-[#faf7f0]">
        <div className="mx-auto flex max-w-[1384px] flex-col gap-3 px-4 pt-[22px] pb-[26px] md:px-8 md:py-9">
          <Breadcrumbs items={[{ name: "Wishlist", path: "/wishlist" }]} />
          <h1
            id="wishlist-title"
            data-rv="mask"
            className="m-0 font-display text-[56px] leading-[0.95] font-bold text-[#0f2a1a] uppercase md:text-[96px]"
          >
            Your wishlist
          </h1>
        </div>
      </section>
      <section aria-label="Saved products" className="px-4 pt-6 pb-14 md:px-8 md:pt-10 md:pb-24">
        <WishlistGrid items={items} />
      </section>
    </>
  );
}
