import { getCurrentStaff } from "@/lib/auth";
import { exportColumns } from "@/lib/export-range";
import { formatPhone } from "@/lib/format";
import { loadSuppliers } from "@/lib/inventory";
import { type Cell, exportResponse, parseFormat } from "@/lib/table-export";

const COLUMNS = [
  "name",
  "supplies",
  "contact",
  "phone",
  "city",
  "purchases",
  "bought",
  "due",
] as const;
const HEADERS: Record<(typeof COLUMNS)[number], string> = {
  name: "Supplier",
  supplies: "Supplies",
  contact: "Contact person",
  phone: "Phone",
  city: "City",
  purchases: "Purchases",
  bought: "Total bought (PKR)",
  due: "Balance due (PKR)",
};

export async function GET(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || staff.role === "staff") return new Response("Not allowed", { status: 403 });
  const params = new URL(request.url).searchParams;
  const cols = exportColumns(params, COLUMNS);
  const rows = (await loadSuppliers()).map((s) =>
    cols.map((c): Cell => {
      switch (c) {
        case "name":
          return s.name;
        case "supplies":
          return s.supplies;
        case "contact":
          return s.contact_name ?? "";
        case "phone":
          return formatPhone(s.phone);
        case "city":
          return s.city ?? "";
        case "purchases":
          return s.purchases_count;
        case "bought":
          return s.total_bought;
        case "due":
          return s.balance_due;
      }
    }),
  );
  return exportResponse(
    {
      title: "Suppliers",
      slug: "suppliers",
      header: cols.map((c) => HEADERS[c]),
      rows,
      numeric: (["purchases", "bought", "due"] as const)
        .map((c) => cols.indexOf(c))
        .filter((i) => i >= 0),
    },
    parseFormat(params.get("format")),
  );
}
