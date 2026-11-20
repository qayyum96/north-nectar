import { getCurrentStaff } from "@/lib/auth";
import { type CustomerSummary, filteredCustomers, parseCustomerFilters } from "@/lib/customers";
import { exportColumns } from "@/lib/export-range";
import { dateLabel, formatPhone } from "@/lib/format";
import { addressLines } from "@/lib/orders";
import { fetchAll } from "@/lib/fetch-all";
import { createClient } from "@/lib/supabase/server";
import { type Cell, exportResponse, parseFormat } from "@/lib/table-export";

const COLUMNS = [
  "name",
  "email",
  "phone",
  "city",
  "orders",
  "spent",
  "last",
  "whatsapp",
  "since",
  "address",
] as const;
type Col = (typeof COLUMNS)[number];
const HEADERS: Record<Col, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  city: "City",
  orders: "Orders",
  spent: "Total spent (PKR)",
  last: "Last order",
  whatsapp: "WhatsApp updates",
  since: "Customer since",
  address: "Address",
};

export async function GET(request: Request) {
  if (!(await getCurrentStaff())) return new Response("Not signed in", { status: 401 });
  const params = new URL(request.url).searchParams;
  const cols = exportColumns(params, COLUMNS);
  const filters = parseCustomerFilters(Object.fromEntries(params));
  const supabase = await createClient();
  let data: unknown[];
  try {
    data = await fetchAll((a, b) => filteredCustomers(supabase, filters).order("id").range(a, b));
  } catch {
    return new Response("Export failed", { status: 500 });
  }

  const rows = (data as CustomerSummary[]).map((c) =>
    cols.map((col): Cell => {
      switch (col) {
        case "name":
          return c.name;
        case "email":
          return c.email ?? "";
        case "phone":
          return formatPhone(c.phone);
        case "city":
          return c.city ?? "";
        case "orders":
          return c.orders_count;
        case "spent":
          return c.total_spent;
        case "last":
          return c.last_order_at ? dateLabel(c.last_order_at) : "";
        case "whatsapp":
          return c.whatsapp_opt_in ? "Yes" : "No";
        case "since":
          return dateLabel(c.created_at);
        case "address":
          return addressLines(c.default_address).join(", ");
      }
    }),
  );
  return exportResponse(
    {
      title: "Customers",
      slug: "customers",
      header: cols.map((c) => HEADERS[c]),
      rows,
      numeric: (["orders", "spent"] as const).map((c) => cols.indexOf(c)).filter((i) => i >= 0),
    },
    parseFormat(params.get("format")),
  );
}
