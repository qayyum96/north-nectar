import { getCurrentStaff } from "@/lib/auth";
import { exportColumns, exportIds, exportRange } from "@/lib/export-range";
import { dateTimeLabel, formatPhone } from "@/lib/format";
import {
  ORDER_LIST_COLUMNS,
  type OrderListRow,
  filteredOrders,
  label,
  linesSummary,
  parseOrderFilters,
  paymentShort,
} from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import { type Cell, exportResponse, parseFormat } from "@/lib/table-export";

const COLUMNS = [
  "number",
  "date",
  "customer",
  "phone",
  "city",
  "payment",
  "payment_status",
  "fulfilment",
  "items",
  "total",
] as const;
type Col = (typeof COLUMNS)[number];

const HEADERS: Record<Col, string> = {
  number: "Order number",
  date: "Date",
  customer: "Customer",
  phone: "Phone",
  city: "City",
  payment: "Payment method",
  payment_status: "Payment status",
  fulfilment: "Fulfilment",
  items: "Items",
  total: "Total (PKR)",
};

type Row = OrderListRow & { lines?: { name: string; variant_label: string; quantity: number }[] };

/** Orders export (CSV, Excel or print view) from the export dialog. */
export async function GET(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return new Response("Not signed in", { status: 401 });

  const params = new URL(request.url).searchParams;
  const cols = exportColumns(params, COLUMNS);
  const ids = exportIds(params);
  const range = exportRange(params);
  const filters = parseOrderFilters(Object.fromEntries(params));
  const select = cols.includes("items")
    ? `${ORDER_LIST_COLUMNS}, lines:order_lines(name, variant_label, quantity)`
    : ORDER_LIST_COLUMNS;

  const supabase = await createClient();
  let query = filteredOrders(
    supabase,
    ids.length ? { ...filters, q: "", status: "", pay: "", city: "" } : filters,
    select,
  );
  if (ids.length) query = query.in("id", ids);
  else {
    if (range.from) query = query.gte("created_at", range.from);
    if (range.to) query = query.lt("created_at", range.to);
  }
  const { data, error } = await query.limit(5000);
  if (error) return new Response("Export failed", { status: 500 });

  const rows = ((data ?? []) as unknown as Row[]).map((o) =>
    cols.map((c): Cell => {
      switch (c) {
        case "number":
          return `#${o.number}`;
        case "date":
          return dateTimeLabel(o.created_at);
        case "customer":
          return o.shipping_address?.fullName ?? "";
        case "phone":
          return formatPhone(o.phone);
        case "city":
          return o.shipping_address?.city ?? "";
        case "payment":
          return paymentShort(o);
        case "payment_status":
          return label(o.payment_status);
        case "fulfilment":
          return label(o.fulfilment_status);
        case "items":
          return linesSummary(o.lines ?? []);
        case "total":
          return o.total;
      }
    }),
  );

  return exportResponse(
    {
      title: `Orders · ${ids.length ? `${ids.length} selected` : range.label}`,
      slug: "orders",
      header: cols.map((c) => HEADERS[c]),
      rows,
      numeric: [cols.indexOf("total")].filter((i) => i >= 0),
    },
    parseFormat(params.get("format")),
  );
}
