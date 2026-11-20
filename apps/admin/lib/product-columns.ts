/** Products table columns (shared by the server page and the client table). */
export type ProductColumn = "status" | "inventory" | "sizes" | "price" | "category";

export const PRODUCT_COLUMNS_UI: { key: ProductColumn; label: string; width: string }[] = [
  { key: "status", label: "Status", width: "100px" },
  { key: "inventory", label: "Inventory", width: "1.4fr" },
  { key: "sizes", label: "Sizes", width: "70px" },
  { key: "price", label: "Price", width: "1.1fr" },
  { key: "category", label: "Category", width: "1fr" },
];
