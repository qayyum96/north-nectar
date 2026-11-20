/** Customers table columns (shared by the server page and the client table). */
export type CustomerColumn = "contact" | "city" | "orders" | "spent" | "last" | "whatsapp";

export const CUSTOMER_COLUMNS: {
  key: CustomerColumn;
  label: string;
  width: string;
  right?: boolean;
}[] = [
  { key: "contact", label: "Contact", width: "1.7fr" },
  { key: "city", label: "City", width: "0.9fr" },
  { key: "orders", label: "Orders", width: "70px", right: true },
  { key: "spent", label: "Total spent", width: "110px", right: true },
  { key: "last", label: "Last order", width: "110px" },
  { key: "whatsapp", label: "WhatsApp", width: "100px" },
];
