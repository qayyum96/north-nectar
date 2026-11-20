/** Orders table columns (shared by the server page and the client table). */
export type OrderColumn =
  "date" | "customer" | "city" | "payment" | "payment_status" | "fulfilment" | "total";

export const ORDER_COLUMNS: { key: OrderColumn; label: string; width: string }[] = [
  { key: "date", label: "Date", width: "100px" },
  { key: "customer", label: "Customer", width: "minmax(170px,1.6fr)" },
  { key: "city", label: "City", width: "minmax(80px,0.9fr)" },
  { key: "payment", label: "Payment", width: "minmax(96px,1fr)" },
  { key: "payment_status", label: "Payment status", width: "140px" },
  { key: "fulfilment", label: "Fulfilment", width: "118px" },
  { key: "total", label: "Total", width: "82px" },
];
