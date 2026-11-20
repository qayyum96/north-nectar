import { getCurrentStaff } from "@/lib/auth";
import { exportColumns } from "@/lib/export-range";
import { dateTimeLabel } from "@/lib/format";
import { type MovementRow, movementQuery, parseMovementFilters } from "@/lib/inventory";
import { fetchAll } from "@/lib/fetch-all";
import { createClient } from "@/lib/supabase/server";
import { type Cell, exportResponse, parseFormat } from "@/lib/table-export";

const COLUMNS = [
  "date",
  "type",
  "reference",
  "product",
  "size",
  "qty",
  "balance",
  "price",
  "reason",
] as const;
const HEADERS: Record<(typeof COLUMNS)[number], string> = {
  date: "Date",
  type: "Type",
  reference: "Reference",
  product: "Product",
  size: "Size",
  qty: "Quantity",
  balance: "Balance",
  price: "Unit cost or price (PKR)",
  reason: "Reason and note",
};

export async function GET(request: Request) {
  if (!(await getCurrentStaff())) return new Response("Not signed in", { status: 401 });
  const params = new URL(request.url).searchParams;
  const cols = exportColumns(params, COLUMNS);
  const f = parseMovementFilters(Object.fromEntries(params));
  const supabase = await createClient();
  let data: unknown[];
  try {
    data = await fetchAll((a, b) => movementQuery(supabase, f).range(a, b));
  } catch {
    return new Response("Export failed", { status: 500 });
  }
  const rows = (data as MovementRow[]).map((m) =>
    cols.map((c): Cell => {
      switch (c) {
        case "date":
          return dateTimeLabel(m.created_at);
        case "type":
          return m.type.charAt(0).toUpperCase() + m.type.slice(1);
        case "reference":
          return m.reference ?? "";
        case "product":
          return m.variant?.product.name ?? "";
        case "size":
          return m.variant?.label ?? "";
        case "qty":
          return m.quantity;
        case "balance":
          return m.balance_after;
        case "price":
          return m.type === "sale" || m.type === "return" ? m.unit_price : m.unit_cost;
        case "reason":
          return [m.reason, m.note].filter(Boolean).join(" · ");
      }
    }),
  );
  return exportResponse(
    {
      title: `Stock movements · ${f.from} to ${f.to}`,
      slug: "stock-movements",
      header: cols.map((c) => HEADERS[c]),
      rows,
      numeric: (["qty", "balance", "price"] as const)
        .map((c) => cols.indexOf(c))
        .filter((i) => i >= 0),
    },
    parseFormat(params.get("format")),
  );
}
