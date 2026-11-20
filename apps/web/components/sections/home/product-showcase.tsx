import type { Category, Product } from "@northnectar/types";
import { Tabs } from "@northnectar/ui";
import { ArrowRightIcon } from "@northnectar/ui/icons";
import Link from "next/link";
import { ProductGrid } from "@/features/products/product-grid";
import { HomeHeading } from "./heading";

export interface ShowcaseTab {
  id: string;
  label: string;
  products: Product[];
}

/**
 * Titled product section (Best sellers, New arrivals), mockup spacing: 96px section padding (56px
 * mobile), 32px between heading and grid. Renders nothing without products; tabs only when there
 * are several non-empty ones.
 */
export function ProductShowcase({
  id,
  eyebrow,
  title,
  tabs,
  categories,
  viewAll,
}: {
  id: string;
  eyebrow: string;
  title: string;
  tabs: ShowcaseTab[];
  categories: Category[];
  viewAll?: { label: string; href: string };
}) {
  const nonEmpty = tabs.filter((t) => t.products.length > 0);
  const first = nonEmpty[0];
  if (!first) return null;
  const titleId = `${id}-title`;

  const viewAllLink = viewAll ? (
    <Link
      href={viewAll.href}
      className="inline-flex items-center gap-2 text-[16px] leading-6 font-bold text-forest-600 hover:underline"
    >
      {viewAll.label} <ArrowRightIcon size={18} />
    </Link>
  ) : null;

  return (
    <section aria-labelledby={titleId} className="px-4 py-14 md:px-8 md:py-24">
      <div className="mx-auto max-w-[1320px]">
        {nonEmpty.length > 1 ? (
          <Tabs
            label={`Filter ${title.toLowerCase()}`}
            header={<HomeHeading id={titleId} eyebrow={eyebrow} title={title} />}
            items={nonEmpty.map((tab) => ({
              id: tab.id,
              label: tab.label,
              content: (
                <ProductGrid products={tab.products} categories={categories} className="mt-8" />
              ),
            }))}
          />
        ) : (
          <>
            <HomeHeading id={titleId} eyebrow={eyebrow} title={title} action={viewAllLink} />
            <ProductGrid products={first.products} categories={categories} className="mt-8" />
          </>
        )}
      </div>
    </section>
  );
}
