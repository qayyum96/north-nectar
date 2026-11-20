import { getCurrentStaff } from "@/lib/auth";
import { exportColumns, exportIds, exportRange } from "@/lib/export-range";
import { dateLabel } from "@/lib/format";
import {
  filterPurchases,
  loadPurchases,
  parsePurchaseFilters,
  paymentState,
} from "@/lib/inventory";
import { type Cell, exportResponse, parseFormat } from "@/lib/table-export";

const COLUMNS = [
  "number",
  "date",
  "supplier",
  "reference",
  "item",
  "qty",
  "cost",
  "line",
  "total",
  "paid",
  "status",
] as const;
const HEADERS: Record<(typeof COLUMNS)[number], string> = {
  number: "Purchase",
  date: "Date",
  supplier: "Supplier",
  reference: "Bill or reference",
  item: "Item",
  qty: "Quantity",
  cost: "Unit cost (PKR)",
  line: "Line total (PKR)",
  total: "Purchase total (PKR)",
  paid: "Amount paid (PKR)",
  status: "Payment",
};

/** One row per purchase line. */
export async function GET(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || staff.role === "staff") return new Response("Not allowed", { status: 403 });
  const params = new URL(request.url).searchParams;
  const cols = exportColumns(params, COLUMNS);
  const range = exportRange(params);
  const ids = new Set(exportIds(params));
  const list = filterPurchases(
    await loadPurchases(),
    parsePurchaseFilters(Object.fromEntries(params)),
  ).filter((p) => {
    if (ids.size) return ids.has(p.id);
    const d = new Date(`${p.purchase_date}T00:00:00+05:00`).toISOString();
    return (!range.from || d >= range.from) && (!range.to || d < range.to);
  });
  const rows = list.flatMap((p) =>
    p.lines.map((l) =>
      cols.map((c): Cell => {
        switch (c) {
          case "number":
            return p.number;
          case "date":
            return dateLabel(p.purchase_date);
          case "supplier":
            return p.supplier?.name ?? "";
          case "reference":
            return p.reference ?? "";
          case "item":
            return l.detail ? `${l.description} (${l.detail})` : l.description;
          case "qty":
            return l.quantity;
          case "cost":
            return l.unit_cost;
          case "line":
            return l.line_total;
          case "total":
            return p.total;
          case "paid":
            return p.amount_paid;
          case "status": {
            const s = paymentState(p);
            return s.charAt(0).toUpperCase() + s.slice(1);
          }
        }
      }),
    ),
  );
  return exportResponse(
    {
      title: `Purchases · ${range.label}`,
      slug: "purchases",
      header: cols.map((c) => HEADERS[c]),
      rows,
      numeric: (["qty", "cost", "line", "total", "paid"] as const)
        .map((c) => cols.indexOf(c))
        .filter((i) => i >= 0),
    },
    parseFormat(params.get("format")),
  );
}
