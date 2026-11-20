import { BanknoteIcon, GiftIcon, TruckIcon } from "@northnectar/ui/icons";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { productContent } from "@/content/product";
import { ProductDetailsTabs } from "@/features/products/detail/product-details-tabs";
import { ProductGallery } from "@/features/products/detail/product-gallery";
import {
  ProductPurchase,
  ProductPurchaseFallback,
} from "@/features/products/detail/product-purchase";
import { ProductGrid } from "@/features/products/product-grid";
import { toPurchasable } from "@/features/products/purchasable";
import { catalog } from "@/lib/catalog";
import { showPlaceholderContent } from "@/lib/env";
import { categoryPath, productPath } from "@/lib/routes";
import { productJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

/** Pre-built for every active product; new products render on first visit; refreshed hourly. */
export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const products = await catalog.getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await catalog.getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return buildMetadata({
    title: product.seo?.title ?? product.name,
    description:
      product.seo?.description ?? `${product.tagline} ${product.description[0] ?? ""}`.trim(),
    path: productPath(product.slug),
    image: {
      url: `/og/product/${product.slug}`,
      width: 1200,
      height: 630,
      alt: product.name,
    },
  });
}

const DELIVERY_ICONS = { banknote: BanknoteIcon, truck: TruckIcon, gift: GiftIcon } as const;

function stockLabel(stock: number) {
  if (stock <= 0) return "Sold out";
  if (stock <= 5) return `Only ${stock} left`;
  return "In stock";
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  // Drafts are never returned by the repository, so they 404 like unknown slugs.
  const product = await catalog.getProductBySlug(slug);
  if (!product) notFound();

  const [categories, related] = await Promise.all([
    catalog.getCategories(),
    catalog.getRelatedProducts(product, 4),
  ]);
  const category = categories.find((c) => c.id === product.categoryId) ?? null;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const purchasable = toPurchasable(product);

  const crumbs = [
    { name: "Shop", path: "/shop" },
    ...(category ? [{ name: category.name, path: categoryPath(category.slug) }] : []),
    { name: product.name, path: productPath(product.slug) },
  ];

  const description = (
    <p className="m-0 text-[17px] leading-[1.65] text-[#3f4a40]">{product.description[0]}</p>
  );

  return (
    <>
      <JsonLd data={productJsonLd(product, category)} />

      <section className="px-4 pt-[18px] pb-10 md:px-8 md:pt-7 md:pb-[72px]">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-[22px]">
          <Breadcrumbs items={crumbs} spacing="loose" />

          <div className="flex flex-wrap items-start gap-x-14 gap-y-8">
            <ProductGallery
              images={product.images}
              badge={product.badge}
              productName={product.name}
            />

            <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-[18px]">
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {category ? (
                  <li className="rounded-full bg-[#e7efe2] px-3 py-[5px] text-[14px] leading-[21px] font-bold text-[#1f4a2f]">
                    {category.name}
                  </li>
                ) : null}
                {product.purchaseMode === "retail" ? (
                  <li className="rounded-full bg-[#f6e2c8] px-3 py-[5px] text-[14px] leading-[21px] font-bold text-[#8a4513]">
                    {stockLabel(totalStock)}
                  </li>
                ) : null}
              </ul>

              <h1 className="m-0 font-display text-[44px] leading-[0.98] font-bold text-[#0f2a1a] uppercase md:text-[64px]">
                {product.name}
              </h1>

              {product.botanicalName || product.origin ? (
                <p className="m-0 text-[16px] leading-6 text-[#4e6a52] italic">
                  {[product.botanicalName, product.origin].filter(Boolean).join(" · ")}
                </p>
              ) : null}

              {showPlaceholderContent ? (
                <p className="m-0 inline-flex items-center gap-2 text-[15px] leading-[23px] text-[#4d4a40]">
                  <span
                    role="img"
                    aria-label="Rated 5 out of 5"
                    className="tracking-[2px] text-[#f4a12e]"
                  >
                    ★★★★★
                  </span>
                  {productContent.socialProof}
                </p>
              ) : null}

              <Suspense
                fallback={
                  <ProductPurchaseFallback product={purchasable}>
                    {description}
                  </ProductPurchaseFallback>
                }
              >
                <ProductPurchase product={purchasable}>{description}</ProductPurchase>
              </Suspense>

              <ul className="m-0 list-none rounded-[18px] border border-[#e8dfcc] bg-white px-[18px] py-[6px]">
                {productContent.delivery.map((row) => {
                  const Icon = DELIVERY_ICONS[row.icon];
                  return (
                    <li
                      key={row.strong}
                      className="flex items-center gap-[14px] border-b border-[#f0e9da] py-[14px] text-[15px] leading-[23px] last:border-b-0"
                    >
                      <span className="flex h-[27px] flex-none items-center text-forest-600">
                        <Icon size={20} />
                      </span>
                      <span>
                        <strong>{row.strong}</strong> {row.text}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <ul className="m-0 grid list-none grid-cols-3 gap-[10px] p-0">
                {productContent.usps.map((usp) => (
                  <li
                    key={usp.label}
                    className="flex flex-col items-center gap-[6px] text-center text-[14px] leading-[21px] font-semibold text-[#1f4a2f]"
                  >
                    <Image
                      src={usp.icon.src}
                      width={usp.icon.width}
                      height={usp.icon.height}
                      alt=""
                      unoptimized
                      className="h-10 w-auto"
                    />
                    {usp.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="Product details"
        className="px-4 pt-4 pb-10 md:px-8 md:pt-6 md:pb-[72px]"
      >
        <div className="mx-auto max-w-[1320px]">
          <ProductDetailsTabs product={product} />
        </div>
      </section>

      {related.length > 0 ? (
        <section aria-labelledby="related-title" className="px-4 pt-6 pb-14 md:px-8 md:pb-24">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-col gap-2">
                <p className="m-0 text-[14px] leading-[21px] font-bold tracking-[0.14em] text-[#1f7a3f] uppercase">
                  {productContent.related.eyebrow}
                </p>
                <h2
                  id="related-title"
                  data-rv="mask"
                  className="m-0 font-display text-[34px] leading-[1.02] font-bold text-[#0f2a1a] uppercase md:text-[52px]"
                >
                  {productContent.related.title}
                </h2>
              </div>
              <Link
                href="/shop"
                className="text-[16px] leading-6 font-bold text-[#1f6b3a] hover:underline"
              >
                View all products →
              </Link>
            </div>
            <ProductGrid products={related} categories={categories} className="md:gap-x-[22px]" />
          </div>
        </section>
      ) : null}
    </>
  );
}
