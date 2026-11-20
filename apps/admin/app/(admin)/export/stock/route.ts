import { getCurrentStaff } from "@/lib/auth";
import { exportColumns } from "@/lib/export-range";
import { STOCK_STATUS_LABEL, filterStock, loadStock, parseStockFilters } from "@/lib/inventory";
import { type Cell, exportResponse, parseFormat } from "@/lib/table-export";

const COLUMNS = [
  "product",
  "size",
  "sku",
  "stock",
  "reserved",
  "available",
  "reorder",
  "status",
  "cost",
  "value",
] as const;
const HEADERS: Record<(typeof COLUMNS)[number], string> = {
  product: "Product",
  size: "Size",
  sku: "SKU",
  stock: "On hand",
  reserved: "Reserved",
  available: "Available",
  reorder: "Reorder at",
  status: "Status",
  cost: "Unit cost (PKR)",
  value: "Stock value (PKR)",
};

export async function GET(request: Request) {
  if (!(await getCurrentStaff())) return new Response("Not signed in", { status: 401 });
  const params = new URL(request.url).searchParams;
  const cols = exportColumns(params, COLUMNS);
  const rows = filterStock(await loadStock(), parseStockFilters(Object.fromEntries(params))).map(
    (r) =>
      cols.map((c): Cell => {
        switch (c) {
          case "product":
            return r.product;
          case "size":
            return r.label;
          case "sku":
            return r.sku;
          case "stock":
            return r.stock;
          case "reserved":
            return r.reserved;
          case "available":
            return r.available;
          case "reorder":
            return r.reorderAt;
          case "status":
            return STOCK_STATUS_LABEL[r.status];
          case "cost":
            return r.unitCost;
          case "value":
            return r.value;
        }
      }),
  );
  return exportResponse(
    {
      title: "Stock",
      slug: "stock",
      header: cols.map((c) => HEADERS[c]),
      rows,
      numeric: (["stock", "reserved", "available", "reorder", "cost", "value"] as const)
        .map((c) => cols.indexOf(c))
        .filter((i) => i >= 0),
    },
    parseFormat(params.get("format")),
  );
}
