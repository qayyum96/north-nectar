import { plainText } from "@northnectar/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { ListingPage } from "@/features/products/listing/listing-page";
import { catalog } from "@/lib/catalog";
import { categoryPath } from "@/lib/routes";
import { faqJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

/** Pre-built for every active category; new categories render on first visit; refreshed hourly. */
export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  const categories = await catalog.getCategories();
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await catalog.getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return buildMetadata({
    title: category.seo?.title ?? `${category.name} – Buy Online in Pakistan`,
    description: category.seo?.description ?? category.description,
    path: categoryPath(category.slug),
  });
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  // getCategoryBySlug only returns active categories that contain active products.
  const category = await catalog.getCategoryBySlug(slug);
  if (!category) notFound();

  const [products, categories, counts, all] = await Promise.all([
    catalog.getProducts({ category: category.slug }),
    catalog.getCategories(),
    catalog.getProductCountsByCategory(),
    catalog.getProducts(),
  ]);

  const faqs = category.faqs ?? [];

  return (
    <>
      {faqs.length > 0 ? (
        <JsonLd
          data={faqJsonLd(faqs.map((f) => ({ question: f.question, answer: plainText(f.answer) })))}
        />
      ) : null}
      <ListingPage
        title={category.name}
        intro={category.description}
        breadcrumbs={[
          { name: "Shop", path: "/shop" },
          { name: category.name, path: categoryPath(category.slug) },
        ]}
        products={products}
        categories={categories}
        counts={counts}
        total={all.length}
        activeCategory={category}
      />
    </>
  );
}
