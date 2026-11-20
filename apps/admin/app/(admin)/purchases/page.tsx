import type { Metadata } from "next";
import Link from "next/link";
import { ExportButton } from "@/components/export-dialog";
import { Icon } from "@/components/icon";
import { ListToolbar } from "@/components/list-toolbar";
import { ButtonLink, Card, EmptyState, KpiStrip, PageBody, PageHeader } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { dateLabel, formatPkr, plural } from "@/lib/format";
import {
  PURCHASE_SORTS,
  costRange,
  filterPurchases,
  loadPurchases,
  loadSuppliers,
  parsePurchaseFilters,
  paymentState,
  purchaseItems,
  purchaseKpis,
} from "@/lib/inventory";
import { ImportButton } from "../imports/import-wizard";
import { PurchasesTable } from "./purchases-table";

export const metadata: Metadata = { title: "Purchases" };

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff(["owner", "manager"]);
  const filters = parsePurchaseFilters(await searchParams);
  const [all, suppliers] = await Promise.all([loadPurchases(), loadSuppliers()]);

  const { monthStart, prevStart, monthName, inMonth, owing, stillToPay, units30, avgNow, change } =
    purchaseKpis(all);

  const rows = filterPurchases(all, filters).map((p) => {
    const items = purchaseItems(p);
    return {
      id: p.id,
      number: p.number,
      date: dateLabel(p.purchase_date),
      supplierId: p.supplier_id,
      supplier: p.supplier?.name ?? "",
      itemTitle: items.title,
      itemSub: items.sub,
      qty: p.lines.reduce((s, l) => s + l.quantity, 0).toLocaleString("en-US"),
      costs: costRange(p),
      total: formatPkr(p.total),
      state: paymentState(p),
      due: p.total - p.amount_paid,
      hasBill: !!p.bill_path,
    };
  });
  const filterQuery = new URLSearchParams(
    Object.entries({ q: filters.q, supplier: filters.supplier, pay: filters.pay }).filter(
      ([, v]) => v,
    ) as [string, string][],
  ).toString();
  const supplierCount = new Set(all.map((p) => p.supplier_id).filter(Boolean)).size;
  const exportProps = {
    what: "purchases",
    singular: "purchase",
    endpoint: "/export/purchases",
    filterQuery,
    columns: [
      { key: "number", label: "Purchase", on: true },
      { key: "date", label: "Date", on: true },
      { key: "supplier", label: "Supplier", on: true },
      { key: "reference", label: "Bill or reference", on: false },
      { key: "item", label: "Item", on: true },
      { key: "qty", label: "Quantity", on: true },
      { key: "cost", label: "Unit cost", on: true },
      { key: "line", label: "Line total", on: true },
      { key: "total", label: "Purchase total", on: true },
      { key: "paid", label: "Amount paid", on: true },
      { key: "status", label: "Payment", on: true },
    ],
  };

  const header = (
    <PageHeader
      crumbs={[{ label: "Inventory" }, { label: "Purchases" }]}
      title="Purchases"
      subtitle={`${plural(all.length, "purchase")} from ${plural(supplierCount, "supplier")} · ${stillToPay ? `${formatPkr(stillToPay)} still to pay` : "all paid"}`}
      actions={
        <>
          <ImportButton kind="purchases" />
          <ExportButton {...exportProps} />
          <ButtonLink href="/purchases/new" variant="primary" icon="plus">
            Record purchase
          </ButtonLink>
        </>
      }
    />
  );

  if (all.length === 0) {
    return (
      <>
        {header}
        <PageBody>
          <Card className="p-0">
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="grid size-[72px] place-items-center rounded-full bg-[#eef3ec] text-forest-600">
                <Icon name="purchases" size={32} />
              </span>
              <h2 className="m-0 text-[17px] font-bold">No purchases recorded</h2>
              <p className="text-admin-muted m-0 max-w-[420px] leading-[1.6]">
                Record what you buy from suppliers. Saving a purchase adds the units to your stock
                and keeps your profit accurate.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-[6px]">
                <ImportButton kind="purchases" label="Import from Excel" />
                <ButtonLink href="/purchases/new" variant="primary" icon="plus">
                  Record purchase
                </ButtonLink>
              </div>
            </div>
          </Card>
        </PageBody>
      </>
    );
  }

  return (
    <>
      {header}
      <PageBody>
        <KpiStrip
          items={[
            {
              label: "Spent this month",
              value: formatPkr(inMonth.reduce((s, p) => s + p.total, 0)),
              note: `${plural(inMonth.length, "purchase")} in ${monthName.format(monthStart)}`,
            },
            {
              label: "Still to pay",
              value: formatPkr(stillToPay),
              alert: stillToPay > 0,
              note: stillToPay
                ? plural(new Set(owing.map((p) => p.supplier_id)).size, "supplier")
                : "nothing owed",
            },
            {
              label: "Units received",
              value: units30.toLocaleString("en-US"),
              note: "products, last 30 days",
            },
            {
              label: "Average unit cost",
              value: avgNow !== null ? formatPkr(avgNow) : "—",
              note:
                change !== null ? (
                  <>
                    <span
                      className={
                        change <= 0
                          ? "font-semibold text-[#1d6b3a]"
                          : "font-semibold text-[#b42318]"
                      }
                    >
                      {change <= 0 ? "▼" : "▲"} {Math.abs(change)}%
                    </span>{" "}
                    vs {monthName.format(prevStart)}
                  </>
                ) : (
                  "products bought this month"
                ),
            },
          ]}
        />
        <Card className="overflow-hidden p-0">
          <ListToolbar
            searchLabel="Search by purchase, supplier or item"
            filters={[
              {
                name: "supplier",
                label: "All suppliers",
                width: 150,
                options: suppliers.map((s) => ({ value: s.id, label: s.name })),
              },
              {
                name: "pay",
                label: "All payments",
                width: 152,
                options: [
                  { value: "paid", label: "Paid" },
                  { value: "partly", label: "Partly paid" },
                  { value: "unpaid", label: "Unpaid" },
                ],
              },
            ]}
            sorts={PURCHASE_SORTS}
            right={<ExportButton size="tool" {...exportProps} />}
          />
          {rows.length ? (
            <PurchasesTable rows={rows} />
          ) : (
            <div className="border-admin-line border-t py-10">
              <EmptyState icon="search" title="No purchases match these filters">
                <Link href="/purchases" className="font-semibold text-forest-600 hover:underline">
                  Clear filters
                </Link>
              </EmptyState>
            </div>
          )}
        </Card>
      </PageBody>
    </>
  );
}
