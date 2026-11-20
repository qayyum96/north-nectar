import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ExportButton } from "@/components/export-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { Card, EmptyState, KpiStrip, PageBody, PageHeader } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { formatPkr, imageSrc, plural } from "@/lib/format";
import { STOCK_SORTS, filterStock, loadStock, parseStockFilters } from "@/lib/inventory";
import { ImportButton } from "../imports/import-wizard";
import { AdjustStockButton, StockTable } from "./stock-client";

export const metadata: Metadata = { title: "Stock" };

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireStaff();
  const canEdit = staff.role !== "staff";
  const filters = parseStockFilters(await searchParams);
  const [all, jar] = await Promise.all([loadStock(), cookies()]);
  const compact = jar.get("nn-density")?.value === "compact";

  const products = [...new Map(all.map((r) => [r.productId, r.productShort])).entries()];
  const units = all.reduce((s, r) => s + r.stock, 0);
  const value = all.reduce((s, r) => s + r.value, 0);
  const missing = all.filter((r) => r.unitCost === null).length;
  const low = all.filter((r) => r.status === "low");
  const out = all.filter((r) => r.status === "out");
  const names = (list: typeof all) =>
    list
      .slice(0, 2)
      .map((r) => `${r.productShort} ${r.label}`)
      .join(", ") + (list.length > 2 ? ` and ${list.length - 2} more` : "");

  const rows = filterStock(all, filters).map((r) => ({
    ...r,
    image: imageSrc(r.image?.src),
    value: formatPkr(r.value),
  }));
  const filterQuery = new URLSearchParams(
    Object.entries({ q: filters.q, product: filters.product, status: filters.status }).filter(
      ([, v]) => v,
    ) as [string, string][],
  ).toString();
  const exportProps = {
    what: "stock",
    singular: "size",
    endpoint: "/export/stock",
    filterQuery,
    dateRange: false,
    columns: [
      { key: "product", label: "Product", on: true },
      { key: "size", label: "Size", on: true },
      { key: "sku", label: "SKU", on: true },
      { key: "stock", label: "On hand", on: true },
      { key: "reserved", label: "Reserved", on: true },
      { key: "available", label: "Available", on: true },
      { key: "reorder", label: "Reorder at", on: true },
      { key: "status", label: "Status", on: true },
      { key: "cost", label: "Unit cost", on: false },
      { key: "value", label: "Stock value", on: true },
    ],
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Inventory" }, { label: "Stock" }]}
        title="Stock"
        subtitle={`${plural(all.length, "size")} across ${plural(products.length, "product")} · ${units.toLocaleString("en-US")} units on hand`}
        actions={
          <>
            {canEdit ? <ImportButton kind="movements" /> : null}
            <ExportButton {...exportProps} />
            {canEdit ? <AdjustStockButton rows={rows} /> : null}
          </>
        }
      />
      <PageBody>
        <KpiStrip
          items={[
            {
              label: "Units on hand",
              value: units.toLocaleString("en-US"),
              note: `${plural(all.length, "size")} tracked`,
            },
            {
              label: "Stock value",
              value: formatPkr(value),
              note: missing ? `${plural(missing, "size")} without a cost yet` : "at purchase cost",
            },
            {
              label: "Low stock",
              value: String(low.length),
              note: low.length ? (
                <span className="text-[#8a5a00]">{names(low)}</span>
              ) : (
                "none right now"
              ),
            },
            {
              label: "Out of stock",
              value: String(out.length),
              alert: out.length > 0,
              note: out.length ? names(out) : "none right now",
            },
          ]}
        />
        <Card className="overflow-hidden p-0">
          <ListToolbar
            searchLabel="Search by product or SKU"
            filters={[
              {
                name: "product",
                label: "All products",
                width: 150,
                options: products.map(([id, name]) => ({ value: id, label: name })),
              },
              {
                name: "status",
                label: "All statuses",
                options: [
                  { value: "in", label: "In stock" },
                  { value: "low", label: "Low stock" },
                  { value: "out", label: "Out of stock" },
                ],
              },
            ]}
            sorts={STOCK_SORTS}
            density={compact ? "compact" : "comfortable"}
            right={<ExportButton size="tool" {...exportProps} />}
          />
          {rows.length ? (
            <StockTable rows={rows} canAdjust={canEdit} compact={compact} />
          ) : (
            <div className="border-admin-line border-t py-10">
              <EmptyState
                icon="stock"
                title={filterQuery ? "No sizes match these filters" : "No products yet"}
              >
                {filterQuery ? (
                  <Link href="/stock" className="font-semibold text-forest-600 hover:underline">
                    Clear filters
                  </Link>
                ) : (
                  "Add products first; their sizes appear here."
                )}
              </EmptyState>
            </div>
          )}
        </Card>
      </PageBody>
    </>
  );
}
