import type { Product, ProductVariant } from "@northnectar/types";
import { plainText } from "@northnectar/ui";
import { catalog } from "@/lib/catalog";
import { productPath } from "@/lib/routes";
import { absoluteUrl, siteConfig } from "@/lib/seo/config";

/**
 * Product feed for Google Merchant Center (free Shopping listings), fetched daily by Google from
 * https://northnectar.com/feeds/google-products.xml. One item per size; sizes of the same product
 * share an item_group_id. Quote-only (bulk) products have no public price and are left out.
 * Shipping and returns are configured in Merchant Center itself, not here.
 *
 * Spec: https://support.google.com/merchants/answer/7052112
 */
export const revalidate = 3600;

function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function money(amount: number): string {
  return `${amount.toFixed(2)} ${siteConfig.currency}`;
}

function tag(name: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return `<${name}>${xml(String(value))}</${name}>`;
}

function item(product: Product, variant: ProductVariant, categoryName: string | undefined) {
  const images = product.images.map((img) => absoluteUrl(img.src));
  const description = product.description.map((p) => plainText(p)).join("\n\n") || product.tagline;
  const grouped = product.variants.length > 1;
  // A sale shows the original price as g:price and the current one as g:sale_price.
  const onSale = variant.compareAtPrice != null && variant.compareAtPrice > variant.price;

  return [
    "<item>",
    tag("g:id", variant.sku),
    grouped ? tag("g:item_group_id", product.id) : "",
    tag("title", grouped ? `${product.name}, ${variant.label}` : product.name),
    tag("description", description.slice(0, 5000)),
    tag("link", absoluteUrl(productPath(product.slug, grouped ? variant.label : undefined))),
    tag("g:image_link", images[0]),
    ...images.slice(1, 11).map((src) => tag("g:additional_image_link", src)),
    tag("g:availability", variant.stock > 0 ? "in_stock" : "out_of_stock"),
    tag("g:price", money(onSale ? variant.compareAtPrice! : variant.price)),
    onSale ? tag("g:sale_price", money(variant.price)) : "",
    tag("g:condition", "new"),
    tag("g:brand", siteConfig.name),
    // Own-brand products without barcodes.
    tag("g:identifier_exists", "no"),
    tag("g:mpn", variant.sku),
    tag("g:size", variant.label),
    tag("g:product_type", categoryName),
    variant.weightGrams ? tag("g:product_weight", `${variant.weightGrams} g`) : "",
    "</item>",
  ].join("");
}

export async function GET() {
  const [products, categories] = await Promise.all([
    catalog.getProducts({ sort: "best-selling" }),
    catalog.getCategories(),
  ]);
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  const items = products
    .filter((p) => p.purchaseMode === "retail" && p.images.length > 0)
    .flatMap((p) => p.variants.map((v) => item(p, v, categoryName.get(p.categoryId))));

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "<channel>",
    tag("title", siteConfig.name),
    tag("link", siteConfig.url),
    tag("description", siteConfig.description),
    ...items,
    "</channel>",
    "</rss>",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
