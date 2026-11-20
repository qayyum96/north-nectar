import { getCurrentStaff } from "@/lib/auth";
import { parseRange } from "@/lib/dashboard";
import { REPORT_TABS, loadReports, type ReportTab, type Reports } from "@/lib/reports";
import { type Cell, exportResponse, parseFormat } from "@/lib/table-export";
import { periodLabel } from "@/lib/time";

interface TabTable {
  title: string;
  header: string[];
  rows: Cell[][];
  kpis: [string, Cell][];
  weekly: string;
  values: number[];
}

function tabTable(r: Reports, tab: ReportTab): TabTable {
  if (tab === "purchases") {
    const p = r.purchases;
    return {
      title: "Purchases by supplier",
      header: ["Supplier", "Purchases", "Units", "Total (PKR)"],
      rows: p.bySupplier.map((s) => [s.name, s.purchases, s.units, s.total]),
      kpis: [
        ["Total purchased (PKR)", p.total],
        ["Purchases", p.count],
        ["Units bought (products only)", p.units],
        ["Unpaid bills, all time (PKR)", p.unpaid],
        ["Average unit cost (PKR)", p.avgCost],
        ["Average unit cost change (%)", p.avgCostChange],
      ],
      weekly: "Purchases (PKR)",
      values: p.weekly,
    };
  }
  if (tab === "profit") {
    const p = r.profit;
    return {
      title: "Profit by product",
      header: ["Product and size", "Units sold", "Revenue (PKR)", "Profit (PKR)"],
      rows: p.byProduct.map((x) => [x.label, x.units, x.revenue, x.profit]),
      kpis: [
        ["Revenue after discounts (PKR)", p.revenue],
        ["Cost of goods sold (PKR)", p.cogs],
        ["Gross profit (PKR)", p.profit],
        ["Gross profit change (%)", p.profitChange],
        ["Gross margin (%)", p.margin],
        ["Gross margin change (points)", p.marginChange],
      ],
      weekly: "Gross profit (PKR)",
      values: p.weekly,
    };
  }
  if (tab === "products") {
    const p = r.products;
    return {
      title: "Product performance",
      header: ["Product and size", "Units sold", "Revenue (PKR)", "Stock left"],
      rows: p.byProduct.map((x) => [x.label, x.units, x.revenue, x.stockLeft]),
      kpis: [
        ["Units sold", p.units],
        ["Units sold change (%)", p.unitsChange],
        ["Best seller", p.best ? `${p.best.name} (${p.best.units} units)` : null],
        ["Slowest", p.slowest ? `${p.slowest.name} (${p.slowest.units} units)` : null],
        ["Sell-through (%)", p.sellThrough],
      ],
      weekly: "Units sold",
      values: p.weekly,
    };
  }
  const s = r.sales;
  return {
    title: "Sales by city",
    header: ["City", "Orders", "Units", "Sales (PKR)"],
    rows: s.byCity.map((c) => [c.city, c.orders, c.units, c.sales]),
    kpis: [
      ["Gross sales (PKR)", s.gross],
      ["Gross sales change (%)", s.grossChange],
      ["Orders", s.orders],
      ["Orders change (%)", s.ordersChange],
      ["Average order (PKR)", s.aov],
      ["Returns (PKR)", s.returnsTotal],
      ["Orders returned", s.returnsCount],
    ],
    weekly: "Sales (PKR)",
    values: s.weekly,
  };
}

/**
 * /export/report?tab=sales&range=30d&part=table|report
 * part=table: the card's table as CSV. part=report: headline numbers, the 12 weeks and the table
 * in one Excel sheet. `format` overrides either (csv, xlsx, pdf).
 */
export async function GET(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return new Response("Not signed in", { status: 401 });
  if (staff.role === "staff") return new Response("Not allowed", { status: 403 });

  const params = new URL(request.url).searchParams;
  const tab = (REPORT_TABS.find((t) => t.key === params.get("tab"))?.key ?? "sales") as ReportTab;
  const tabLabel = REPORT_TABS.find((t) => t.key === tab)!.label;
  const range = parseRange(Object.fromEntries(params));
  const r = await loadReports(range);
  const t = tabTable(r, tab);
  const part = params.get("part") === "report" ? "report" : "table";
  const format = params.get("format")
    ? parseFormat(params.get("format"))
    : part === "report"
      ? "xlsx"
      : "csv";
  const period = periodLabel(range.start, range.end);
  const slug = `report-${tab}`;

  if (part === "table") {
    return exportResponse(
      { title: `${t.title} · ${period}`, slug, header: t.header, rows: t.rows, numeric: [1, 2, 3] },
      format,
    );
  }

  const width = Math.max(t.header.length, 3);
  const pad = (row: Cell[]) => [...row, ...Array<Cell>(Math.max(0, width - row.length)).fill("")];
  const rows: Cell[][] = [
    pad(["Period", period]),
    pad([]),
    pad(["Headline numbers", "Value"]),
    ...t.kpis.map(([k, v]) => pad([k, v ?? ""])),
    pad([]),
    pad(["Week starting", t.weekly]),
    ...r.weeks.map((w, i) => pad([w.label, Math.round(t.values[i] ?? 0)])),
    pad([]),
    pad([t.title]),
    t.header,
    ...t.rows.map(pad),
  ];
  return exportResponse(
    {
      title: `${tabLabel} report · ${period}`,
      slug,
      header: pad([`North Nectar ${tabLabel.toLowerCase()} report`]).map(String),
      rows,
      numeric: [1, 2, 3],
    },
    format,
  );
}
