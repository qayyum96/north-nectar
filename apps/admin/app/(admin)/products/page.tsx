import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ExportButton } from "@/components/export-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { ButtonLink, Card, EmptyState, KpiStrip, PageBody, PageHeader } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import {
  PRODUCT_SORTS,
  filterProducts,
  loadCatalogue,
  onHand,
  parseProductFilters,
  skuSummary,
} from "@/lib/catalogue";
import { formatPkr, imageSrc, plural } from "@/lib/format";
import { PRODUCT_COLUMNS_UI, type ProductColumn } from "@/lib/product-columns";
import { ProductsTable } from "./products-table";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireStaff(["owner", "manager"]);
  const filters = parseProductFilters(await searchParams);
  const [{ products, categories }, jar] = await Promise.all([loadCatalogue(), cookies()]);
  const compact = jar.get("nn-density")?.value === "compact";
  const hidden = (jar.get("nn-products-cols")?.value ?? "")
    .split(",")
    .filter((k): k is ProductColumn => PRODUCT_COLUMNS_UI.some((c) => c.key === k));
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const site = new URL(process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://northnectar.com").host;

  const active = products.filter((p) => p.status === "active").length;
  const drafts = products.length - active;
  const sizes = products.flatMap((p) => p.variants.map((v) => ({ p, v })));
  const outSizes = sizes.filter(({ v }) => v.stock - v.reserved <= 0);
  const costed = sizes.filter(({ v }) => v.unit_cost !== null);
  const value = costed.reduce((s, { v }) => s + v.stock * (v.unit_cost ?? 0), 0);
  const missingCost = sizes.length - costed.length;

  const rows = filterProducts(products, filters).map((p) => {
    const units = onHand(p);
    const prices = p.variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return {
      id: p.id,
      name: p.name,
      image: imageSrc(p.images[0]?.src),
      sub: skuSummary(p),
      status: p.status,
      inventory:
        units === 0
          ? "0 in stock"
          : `${units.toLocaleString("en-US")} in stock for ${plural(p.variants.length, "size")}`,
      out: units === 0,
      sizes: p.variants.length,
      price:
        p.purchase_mode === "quote"
          ? "Price on request"
          : prices.length === 0
            ? "No price"
            : min === max
              ? formatPkr(min)
              : `${formatPkr(min)} to ${formatPkr(max)}`,
      category: catName.get(p.category_id) ?? "",
    };
  });

  const filterQuery = new URLSearchParams(
    Object.entries({ q: filters.q, category: filters.category, status: filters.status }).filter(
      ([, v]) => v,
    ) as [string, string][],
  ).toString();
  const exportProps = {
    what: "products",
    singular: "product",
    endpoint: "/export/products",
    filterQuery,
    dateRange: false,
    columns: [
      { key: "name", label: "Product", on: true },
      { key: "size", label: "Size", on: true },
      { key: "sku", label: "SKU", on: true },
      { key: "status", label: "Status", on: true },
      { key: "category", label: "Category", on: true },
      { key: "price", label: "Price", on: true },
      { key: "compare", label: "Compare-at price", on: false },
      { key: "stock", label: "On hand", on: true },
      { key: "available", label: "Available", on: true },
      { key: "cost", label: "Unit cost", on: false },
    ],
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Catalogue" }, { label: "Products" }]}
        title="Products"
        subtitle={`${plural(products.length, "product")} · ${plural(sizes.length, "size")} · ${plural(drafts, "draft")}`}
        actions={
          <>
            <ExportButton {...exportProps} />
            <ButtonLink href="/products/new" variant="primary" icon="plus">
              Add product
            </ButtonLink>
          </>
        }
      />
      <PageBody>
        <KpiStrip
          items={[
            { label: "Active products", value: String(active), note: `visible on ${site}` },
            { label: "Drafts", value: String(drafts), note: "hidden from your store" },
            {
              label: "Sizes out of stock",
              value: String(outSizes.length),
              alert: outSizes.length > 0,
              note:
                outSizes.length === 0
                  ? "everything is in stock"
                  : outSizes
                      .slice(0, 2)
                      .map(
                        ({ p, v }) =>
                          `${p.short_name || p.name.split(/[,(]/)[0]!.trim()} ${v.label}`,
                      )
                      .join(", ") + (outSizes.length > 2 ? ` and ${outSizes.length - 2} more` : ""),
            },
            {
              label: "Inventory value",
              value: formatPkr(value),
              note: missingCost
                ? `${plural(missingCost, "size")} without a cost yet`
                : "at purchase cost",
            },
          ]}
        />
        <Card className="overflow-hidden p-0">
          <ListToolbar
            searchLabel="Search products by name or SKU"
            filters={[
              {
                name: "category",
                label: "All categories",
                width: 162,
                options: categories.map((c) => ({ value: c.id, label: c.name })),
              },
              {
                name: "status",
                label: "All statuses",
                options: [
                  { value: "active", label: "Active" },
                  { value: "draft", label: "Draft" },
                  { value: "out", label: "Out of stock" },
                ],
              },
            ]}
            sorts={PRODUCT_SORTS}
            columns={PRODUCT_COLUMNS_UI.map((c) => ({
              key: c.key,
              label: c.label,
              on: !hidden.includes(c.key),
            }))}
            columnsCookie="nn-products-cols"
            density={compact ? "compact" : "comfortable"}
            right={<ExportButton size="tool" {...exportProps} />}
          />
          {rows.length > 0 ? (
            <ProductsTable
              rows={rows}
              hidden={hidden}
              compact={compact}
              canEdit={staff.role !== "staff"}
            />
          ) : (
            <div className="border-admin-line border-t py-10">
              <EmptyState
                icon="products"
                title={filterQuery ? "No products match these filters" : "No products yet"}
              >
                {filterQuery ? (
                  <Link href="/products" className="font-semibold text-forest-600 hover:underline">
                    Clear filters
                  </Link>
                ) : (
                  <Link
                    href="/products/new"
                    className="font-semibold text-forest-600 hover:underline"
                  >
                    Add your first product
                  </Link>
                )}
              </EmptyState>
            </div>
          )}
        </Card>
      </PageBody>
    </>
  );
}
