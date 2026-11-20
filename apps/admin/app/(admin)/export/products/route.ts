import { getCurrentStaff } from "@/lib/auth";
import { filterProducts, loadCatalogue, parseProductFilters } from "@/lib/catalogue";
import { exportColumns } from "@/lib/export-range";
import { label } from "@/lib/orders";
import { type Cell, exportResponse, parseFormat } from "@/lib/table-export";

const COLUMNS = [
  "name",
  "size",
  "sku",
  "status",
  "category",
  "price",
  "compare",
  "stock",
  "available",
  "cost",
] as const;
type Col = (typeof COLUMNS)[number];
const HEADERS: Record<Col, string> = {
  name: "Product",
  size: "Size",
  sku: "SKU",
  status: "Status",
  category: "Category",
  price: "Price (PKR)",
  compare: "Compare-at price (PKR)",
  stock: "On hand",
  available: "Available",
  cost: "Unit cost (PKR)",
};

/** One row per size, so the file works as a stock sheet too. */
export async function GET(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || staff.role === "staff") return new Response("Not allowed", { status: 403 });
  const params = new URL(request.url).searchParams;
  const cols = exportColumns(params, COLUMNS);
  const { products, categories } = await loadCatalogue();
  const cat = new Map(categories.map((c) => [c.id, c.name]));
  const rows: Cell[][] = filterProducts(
    products,
    parseProductFilters(Object.fromEntries(params)),
  ).flatMap((p) =>
    p.variants.map((v) =>
      cols.map((c): Cell => {
        switch (c) {
          case "name":
            return p.name;
          case "size":
            return v.label;
          case "sku":
            return v.sku;
          case "status":
            return label(p.status);
          case "category":
            return cat.get(p.category_id) ?? "";
          case "price":
            return v.price;
          case "compare":
            return v.compare_at_price;
          case "stock":
            return v.stock;
          case "available":
            return Math.max(0, v.stock - v.reserved);
          case "cost":
            return v.unit_cost;
        }
      }),
    ),
  );
  return exportResponse(
    {
      title: "Products",
      slug: "products",
      header: cols.map((c) => HEADERS[c]),
      rows,
      numeric: (["price", "compare", "stock", "available", "cost"] as const)
        .map((c) => cols.indexOf(c))
        .filter((i) => i >= 0),
    },
    parseFormat(params.get("format")),
  );
}
