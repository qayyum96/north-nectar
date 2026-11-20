import { cn } from "@northnectar/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ExportButton } from "@/components/export-dialog";
import { Pagination } from "@/components/list-toolbar";
import {
  Card,
  EmptyState,
  KpiStrip,
  PageBody,
  PageHeader,
  Segmented,
  StatusBadge,
  buttonStyles,
} from "@/components/ui";
import { Icon } from "@/components/icon";
import { requireStaff } from "@/lib/auth";
import { dateLabel, formatPkr } from "@/lib/format";
import {
  MOVEMENTS_PER_PAGE,
  loadMovements,
  loadStock,
  parseMovementFilters,
  shortProduct,
} from "@/lib/inventory";
import { ImportButton } from "../imports/import-wizard";
import { MovementFilters } from "./movement-filters";

export const metadata: Metadata = { title: "Stock movements" };

const GRID = { gridTemplateColumns: "110px 124px 100px minmax(0,1.8fr) 70px 76px 84px 150px" };
const TYPES = [
  { key: "", label: "All" },
  { key: "sale", label: "Sale" },
  { key: "purchase", label: "Purchase" },
  { key: "adjustment", label: "Adjustment" },
  { key: "return", label: "Return" },
] as const;

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const f = parseMovementFilters(sp);
  const [data, stock] = await Promise.all([loadMovements(f), loadStock()]);
  const products = [...new Map(stock.map((r) => [r.productId, r.productShort])).entries()].map(
    ([id, name]) => ({ id, name }),
  );
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
  const k = data.kpis;
  const qs = (type: string) => {
    const q = new URLSearchParams();
    if (type) q.set("type", type);
    if (f.product) q.set("product", f.product);
    q.set("from", f.from);
    q.set("to", f.to);
    return `/movements?${q.toString()}`;
  };
  const filterQuery = new URLSearchParams(
    Object.entries({ type: f.type, product: f.product, from: f.from, to: f.to }).filter(
      ([, v]) => v,
    ) as [string, string][],
  ).toString();
  const canEdit = staff.role !== "staff";

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Inventory" }, { label: "Stock movements" }]}
        title="Stock movements"
        subtitle={`Every unit in and out, in one ledger · ${data.count.toLocaleString("en-US")} movements${data.since ? ` since ${dateLabel(data.since)}` : ""}`}
        actions={
          <>
            <Link href="/imports" className={buttonStyles.secondary}>
              <Icon name="file" size={16} />
              Import history
            </Link>
            {canEdit ? <ImportButton kind="movements" /> : null}
            <ExportButton
              what="movements"
              size="primary"
              singular="movement"
              endpoint="/export/movements"
              filterQuery={filterQuery}
              dateRange={false}
              columns={[
                { key: "date", label: "Date", on: true },
                { key: "type", label: "Type", on: true },
                { key: "reference", label: "Reference", on: true },
                { key: "product", label: "Product", on: true },
                { key: "size", label: "Size", on: true },
                { key: "qty", label: "Quantity", on: true },
                { key: "balance", label: "Balance", on: true },
                { key: "price", label: "Unit cost or price", on: true },
                { key: "reason", label: "Reason and note", on: true },
              ]}
            />
          </>
        }
      />
      <PageBody>
        <KpiStrip
          items={[
            {
              label: "Total purchased",
              value: `${k.purchasedUnits.toLocaleString("en-US")} units`,
              note: `${formatPkr(k.purchasedCost)} at cost`,
            },
            {
              label: "Total sold",
              value: `${k.soldUnits.toLocaleString("en-US")} units`,
              note: `${formatPkr(k.soldRevenue)} in sales`,
            },
            {
              label: "Net stock change",
              good: k.net > 0,
              value: `${k.net > 0 ? "+" : k.net < 0 ? "−" : ""}${Math.abs(k.net).toLocaleString("en-US")} units`,
              note: `${k.adjusted} adjusted, ${k.returned} returned`,
            },
            {
              label: "Gross profit",
              value: k.profit === null ? "—" : formatPkr(k.profit),
              note:
                k.profit === null ? (
                  "add unit costs to see profit"
                ) : k.margin !== null ? (
                  <span className="text-[#1d6b3a]">{k.margin}% margin for the period</span>
                ) : (
                  "no sales in this period"
                ),
            },
          ]}
        />
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-[10px] px-4 py-[14px]">
            <Segmented
              label="Movement type"
              items={TYPES.map((t) => ({
                label: t.label,
                href: qs(t.key),
                active: f.type === t.key,
              }))}
            />
            <MovementFilters
              from={f.from}
              to={f.to}
              product={f.product}
              products={products}
              today={today}
            />
          </div>
          {data.rows.length === 0 ? (
            <div className="border-admin-line border-t py-10">
              <EmptyState icon="movements" title="No movements in this period">
                Sales, purchases, adjustments and returns appear here as they happen.
              </EmptyState>
            </div>
          ) : (
            <>
              <div className="border-admin-line overflow-x-auto border-t">
                <div className="min-w-[1000px]" role="table" aria-label="Stock movements">
                  <div
                    role="row"
                    className="text-admin-label border-admin-line grid min-h-[46px] items-center gap-4 border-b bg-[#f4f2ee] px-4 py-1 text-[14px] font-semibold tracking-[0.05em] uppercase"
                    style={GRID}
                  >
                    <span role="columnheader">Date</span>
                    <span role="columnheader">Type</span>
                    <span role="columnheader">Reference</span>
                    <span role="columnheader">Product and size</span>
                    <span role="columnheader" className="text-right">
                      Qty in
                    </span>
                    <span role="columnheader" className="text-right">
                      Qty out
                    </span>
                    <span role="columnheader" className="text-right">
                      Balance
                    </span>
                    <span role="columnheader" className="text-right leading-[1.5]">
                      Unit cost or price
                    </span>
                  </div>
                  {data.rows.map((m) => {
                    const price =
                      m.type === "sale" || m.type === "return" ? m.unit_price : m.unit_cost;
                    const ref = m.reference ?? "";
                    const href = ref.startsWith("#NN")
                      ? `/orders/${ref.slice(1)}`
                      : ref.startsWith("PO-") && m.purchase_id
                        ? `/purchases/${m.purchase_id}`
                        : null;
                    return (
                      <div
                        key={m.id}
                        role="row"
                        className="text-admin-text grid min-h-[62px] items-center gap-4 border-b border-[#ecebe7] px-4 py-[10px] text-[14px]"
                        style={GRID}
                      >
                        <span role="cell" className="text-admin-muted">
                          {dateLabel(m.created_at)}
                        </span>
                        <span role="cell">
                          <StatusBadge
                            status={
                              m.type === "sale"
                                ? "confirmed"
                                : m.type === "purchase"
                                  ? "paid"
                                  : m.type === "adjustment"
                                    ? "pending"
                                    : "shipped"
                            }
                            label={m.type.charAt(0).toUpperCase() + m.type.slice(1)}
                          />
                        </span>
                        <span role="cell" className="font-bold text-forest-600">
                          {href ? (
                            <Link href={href} className="hover:underline">
                              {ref}
                            </Link>
                          ) : (
                            ref || "—"
                          )}
                        </span>
                        <span role="cell" className="flex min-w-0 flex-col">
                          <span className="truncate font-semibold">
                            {m.variant
                              ? shortProduct(m.variant.product.name, m.variant.product.short_name)
                              : "Removed size"}
                          </span>
                          <span className="text-admin-muted truncate">
                            {[
                              m.variant?.label,
                              m.type === "adjustment" && m.reason ? m.reason.toLowerCase() : null,
                              m.note,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                        <span role="cell" className="text-right font-semibold text-[#1d6b3a]">
                          {m.quantity > 0 ? `+${m.quantity.toLocaleString("en-US")}` : ""}
                        </span>
                        <span role="cell" className="text-right font-semibold text-[#b42318]">
                          {m.quantity < 0 ? `−${Math.abs(m.quantity).toLocaleString("en-US")}` : ""}
                        </span>
                        <span role="cell" className={cn("text-right font-bold")}>
                          {m.balance_after.toLocaleString("en-US")}
                        </span>
                        <span role="cell" className="text-admin-muted text-right">
                          {price != null ? formatPkr(price) : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Pagination
                shown={data.rows.length}
                total={data.count}
                noun={`${data.count === 1 ? "movement" : "movements"} · newest first`}
                page={f.page}
                pages={Math.max(1, Math.ceil(data.count / MOVEMENTS_PER_PAGE))}
              />
            </>
          )}
        </Card>
      </PageBody>
    </>
  );
}
