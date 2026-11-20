import { cn, formatPkr } from "@northnectar/ui";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Icon } from "@/components/icon";
import {
  Card,
  CardHeader,
  KpiStrip,
  PageBody,
  PageHeader,
  Segmented,
  buttonStyles,
  extraButtonStyles,
  type KpiItem,
} from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { parseRange } from "@/lib/dashboard";
import { REPORT_TABS, loadReports, reportQuery, type ReportTab, type Week } from "@/lib/reports";
import { periodLabel } from "@/lib/time";

export const metadata: Metadata = { title: "Reports" };

type Search = { tab?: string; range?: string; from?: string; to?: string };

const num = (n: number) => n.toLocaleString("en-US");

/** "+12.4% vs previous" in green, or red when the change is bad news. */
function change(v: number | null, { goodWhenUp = true, unit = "%" } = {}): ReactNode {
  if (v === null) return "No figures for the previous period";
  const good = v === 0 || v > 0 === goodWhenUp;
  return (
    <span className={good ? "text-[#1d6b3a]" : "text-[#b42318]"}>
      {v > 0 ? "+" : v < 0 ? "−" : ""}
      {num(Math.abs(v))}
      {unit === "%" ? "%" : ` ${unit}`} vs previous
    </span>
  );
}

function WeekChart({ title, weeks, values }: { title: string; weeks: Week[]; values: number[] }) {
  const max = Math.max(...values, 0);
  return (
    <Card>
      <CardHeader title={title} action={<span className="text-admin-muted">Last 12 weeks</span>} />
      <div
        role="img"
        aria-label={`${title}, last 12 weeks: ${weeks.map((w, i) => `${w.label} ${num(Math.round(values[i] ?? 0))}`).join(", ")}`}
        className="border-admin-line flex h-[180px] items-end gap-2 border-b pt-[10px] md:h-[231px] md:gap-3"
      >
        {weeks.map((w, i) => {
          const v = Math.max(0, values[i] ?? 0);
          return (
            <div key={w.label} className="flex h-full flex-1 flex-col items-center justify-end">
              <span
                title={`${w.label}: ${num(Math.round(values[i] ?? 0))}`}
                className={cn(
                  "w-full max-w-[38px] rounded-[6px_6px_0_0]",
                  w.tone === "latest"
                    ? "bg-[#2f7d45]"
                    : w.tone === "dark"
                      ? "bg-[#234c2e]"
                      : "bg-[#9fb59f]",
                )}
                style={{ height: max > 0 ? `${(v / max) * 100}%` : 0 }}
              />
            </div>
          );
        })}
      </div>
      <div aria-hidden className="flex gap-2 overflow-hidden pt-2 md:gap-3">
        {weeks.map((w, i) => (
          <span
            key={w.label}
            className={cn(
              "text-admin-muted min-w-0 flex-1 text-center text-[12px] whitespace-nowrap md:text-[14px]",
              i % 2 === 1 && "max-md:invisible",
            )}
          >
            {w.label}
          </span>
        ))}
      </div>
    </Card>
  );
}

function ReportTable({
  title,
  exportHref,
  header,
  rows,
  empty,
}: {
  title: string;
  exportHref: string;
  header: [string, string, string, string];
  rows: { key: string; cells: [ReactNode, ReactNode, ReactNode, ReactNode] }[];
  empty: string;
}) {
  const grid = "grid-cols-[2fr_1fr_1fr_1fr]";
  return (
    <section className="border-admin-line overflow-hidden rounded-[12px] border bg-white">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <h2 className="text-admin-text m-0 text-[16px] font-bold">{title}</h2>
        <a href={exportHref} download className={extraButtonStyles.tool}>
          <Icon name="download" size={16} /> Export
        </a>
      </div>
      <div className="border-admin-line overflow-x-auto border-t">
        <div className="min-w-[640px] lg:min-w-[1000px]">
          <div
            className={cn(
              "text-admin-label border-admin-line grid min-h-[46px] items-center gap-4 border-b bg-[#f4f2ee] px-4 text-[14px] font-semibold tracking-[0.05em] uppercase",
              grid,
            )}
          >
            {header.map((h, i) => (
              <span key={h} className={i === 0 ? "text-left" : "text-right"}>
                {h}
              </span>
            ))}
          </div>
          {rows.length === 0 ? (
            <p className="text-admin-muted m-0 px-4 py-8 text-center">{empty}</p>
          ) : (
            rows.map((r) => (
              <div
                key={r.key}
                className={cn(
                  "text-admin-text box-border grid min-h-[62px] items-center gap-4 border-b border-[#ecebe7] bg-white px-4 py-[10px] text-[14px] last:border-b-0",
                  grid,
                )}
              >
                <span className="min-w-0 font-semibold text-[#234c2e]">{r.cells[0]}</span>
                <span className="text-right">{r.cells[1]}</span>
                <span className="text-right">{r.cells[2]}</span>
                <span className="text-right font-bold">{r.cells[3]}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireStaff(["owner", "manager"]);
  const params = await searchParams;
  const tab: ReportTab = REPORT_TABS.some((t) => t.key === params.tab)
    ? (params.tab as ReportTab)
    : "sales";
  const range = parseRange(params);
  const r = await loadReports(range);

  const href = (p: Partial<Search>) => `/reports${reportQuery({ tab, ...rangeOf(params), ...p })}`;
  const today = new Date();
  const defaultFrom = new Date(today.getTime() - 13 * 86_400_000).toISOString().slice(0, 10);
  const defaultTo = today.toISOString().slice(0, 10);
  const current = reportQuery({ tab, ...rangeOf(params) });
  const exportHref = (part: "report" | "table") =>
    `/export/report${current}${current ? "&" : "?"}part=${part}`;

  let kpis: KpiItem[];
  let chart: { title: string; values: number[] };
  let table: Parameters<typeof ReportTable>[0];

  if (tab === "sales") {
    const s = r.sales;
    kpis = [
      { label: "Gross sales", value: formatPkr(s.gross), note: change(s.grossChange) },
      { label: "Orders", value: num(s.orders), note: change(s.ordersChange) },
      { label: "Average order", value: formatPkr(s.aov), note: change(s.aovChange) },
      {
        label: "Returns",
        value: formatPkr(s.returnsTotal),
        note: `${num(s.returnsCount)} ${s.returnsCount === 1 ? "order" : "orders"} returned`,
      },
    ];
    chart = { title: "Sales by week", values: s.weekly };
    table = {
      title: "Sales by city",
      exportHref: exportHref("table"),
      header: ["City", "Orders", "Units", "Sales"],
      rows: s.byCity.map((c) => ({
        key: c.city,
        cells: [c.city, num(c.orders), num(c.units), formatPkr(c.sales)],
      })),
      empty: "No sales in this period.",
    };
  } else if (tab === "purchases") {
    const p = r.purchases;
    kpis = [
      {
        label: "Total purchased",
        value: formatPkr(p.total),
        note: `${num(p.count)} ${p.count === 1 ? "purchase" : "purchases"}`,
      },
      { label: "Units bought", value: num(p.units), note: "Products only, packaging excluded" },
      {
        label: "Unpaid bills",
        value: formatPkr(p.unpaid),
        note:
          p.unpaid > 0 ? (
            <span className="text-[#b42318]">
              {p.unpaidSuppliers} {p.unpaidSuppliers === 1 ? "supplier" : "suppliers"}
            </span>
          ) : (
            "All bills paid"
          ),
      },
      {
        label: "Average unit cost",
        value: p.avgCost === null ? "—" : formatPkr(p.avgCost),
        note:
          p.avgCost === null
            ? "No products bought"
            : change(p.avgCostChange, { goodWhenUp: false }),
      },
    ];
    chart = { title: "Purchases by week", values: p.weekly };
    table = {
      title: "Purchases by supplier",
      exportHref: exportHref("table"),
      header: ["Supplier", "Purchases", "Units", "Total"],
      rows: p.bySupplier.map((s) => ({
        key: s.name,
        cells: [s.name, num(s.purchases), num(s.units), formatPkr(s.total)],
      })),
      empty: "No purchases in this period.",
    };
  } else if (tab === "profit") {
    const p = r.profit;
    kpis = [
      { label: "Revenue", value: formatPkr(p.revenue), note: "After discounts" },
      {
        label: "Cost of goods sold",
        value: formatPkr(p.cogs),
        note: p.costKnown ? (
          "At purchase cost"
        ) : (
          <span className="text-[#b42318]">
            {p.missingCosts} {p.missingCosts === 1 ? "size has" : "sizes have"} no unit cost
          </span>
        ),
      },
      { label: "Gross profit", value: formatPkr(p.profit), note: change(p.profitChange) },
      {
        label: "Gross margin",
        value: p.margin === null ? "—" : `${num(p.margin)}%`,
        note:
          p.marginChange === null
            ? "No figures for the previous period"
            : change(p.marginChange, { unit: "points" }),
      },
    ];
    chart = { title: "Gross profit by week", values: p.weekly };
    table = {
      title: "Profit by product",
      exportHref: exportHref("table"),
      header: ["Product and size", "Units sold", "Revenue", "Profit"],
      rows: p.byProduct.map((x) => ({
        key: x.label,
        cells: [
          x.label,
          num(x.units),
          formatPkr(x.revenue),
          x.profit === null ? "No cost" : formatPkr(x.profit),
        ],
      })),
      empty: "No sales in this period.",
    };
  } else {
    const p = r.products;
    kpis = [
      { label: "Units sold", value: num(p.units), note: change(p.unitsChange) },
      {
        label: "Best seller",
        value: p.best?.name ?? "—",
        note: p.best ? `${num(p.best.units)} units` : "No sales yet",
      },
      {
        label: "Slowest",
        value: p.slowest?.name ?? "—",
        note: !p.slowest ? (
          "No active products"
        ) : p.slowest.out ? (
          <span className="text-[#b42318]">Out of stock</span>
        ) : (
          `${num(p.slowest.units)} ${p.slowest.units === 1 ? "unit" : "units"} sold`
        ),
      },
      {
        label: "Sell-through",
        value: p.sellThrough === null ? "—" : `${p.sellThrough}%`,
        note: "Of stock available",
      },
    ];
    chart = { title: "Units sold by week", values: p.weekly };
    table = {
      title: "Product performance",
      exportHref: exportHref("table"),
      header: ["Product and size", "Units sold", "Revenue", "Stock left"],
      rows: p.byProduct.map((x) => ({
        key: x.label,
        cells: [
          x.label,
          num(x.units),
          formatPkr(x.revenue),
          x.stockLeft === null ? "—" : num(x.stockLeft),
        ],
      })),
      empty: "No products yet.",
    };
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Insights" }, { label: "Reports" }]}
        title="Reports"
        subtitle={`${periodLabel(range.start, range.end)} · compared with the previous period`}
        actions={
          <>
            <Segmented
              label="Date range"
              items={[
                {
                  label: "Today",
                  href: href({ range: "today", from: undefined, to: undefined }),
                  active: range.key === "today",
                },
                {
                  label: "7 days",
                  href: href({ range: "7d", from: undefined, to: undefined }),
                  active: range.key === "7d",
                },
                {
                  label: "30 days",
                  href: href({ range: undefined, from: undefined, to: undefined }),
                  active: range.key === "30d",
                },
                {
                  label: "Custom",
                  href: href({
                    range: "custom",
                    from: range.from ?? defaultFrom,
                    to: range.to ?? defaultTo,
                  }),
                  active: range.key === "custom",
                },
              ]}
            />
            <a href={exportHref("report")} download className={buttonStyles.primary}>
              <Icon name="download" size={16} /> Export report
            </a>
          </>
        }
      />
      <PageBody>
        <div>
          <Segmented
            label="Report"
            items={REPORT_TABS.map((t) => ({
              label: t.label,
              href: href({ tab: t.key }),
              active: t.key === tab,
            }))}
          />
        </div>

        {range.key === "custom" ? (
          <form
            action="/reports"
            className="border-admin-line flex flex-wrap items-end gap-3 rounded-[12px] border bg-white px-5 py-4"
          >
            <input type="hidden" name="tab" value={tab} />
            <input type="hidden" name="range" value="custom" />
            <label className="flex flex-col gap-1">
              <span className="font-semibold">From</span>
              <input
                type="date"
                name="from"
                defaultValue={range.from}
                className="border-admin-field h-[38px] rounded-[8px] border px-3"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-semibold">To</span>
              <input
                type="date"
                name="to"
                defaultValue={range.to}
                className="border-admin-field h-[38px] rounded-[8px] border px-3"
              />
            </label>
            <button type="submit" className={buttonStyles.primary}>
              Apply
            </button>
          </form>
        ) : null}

        <KpiStrip items={kpis} />
        <WeekChart title={chart.title} weeks={r.weeks} values={chart.values} />
        <ReportTable {...table} />
      </PageBody>
    </>
  );
}

function rangeOf(p: Search): Partial<Search> {
  return p.range === "custom"
    ? { range: "custom", from: p.from, to: p.to }
    : { range: p.range === "today" || p.range === "7d" ? p.range : undefined };
}
