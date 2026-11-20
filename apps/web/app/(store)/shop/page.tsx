import { shopContent } from "@/content/shop";
import { ListingPage } from "@/features/products/listing/listing-page";
import { catalog } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo/metadata";

/** Static with hourly ISR; ?sort=, ?price= and ?q= are applied in the browser (canonical stays /shop). */
export const revalidate = 3600;

export const metadata = buildMetadata({
  title: shopContent.meta.title,
  description: shopContent.meta.description,
  path: "/shop",
});

export default async function ShopPage() {
  const [products, categories, counts] = await Promise.all([
    catalog.getProducts(),
    catalog.getCategories(),
    catalog.getProductCountsByCategory(),
  ]);

  return (
    <ListingPage
      title={shopContent.title}
      intro={shopContent.intro}
      breadcrumbs={[{ name: "Shop", path: "/shop" }]}
      products={products}
      categories={categories}
      counts={counts}
      total={products.length}
      activeCategory={null}
    />
  );
}
