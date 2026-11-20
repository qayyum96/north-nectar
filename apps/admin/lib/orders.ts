import "server-only";
import { createClient } from "@/lib/supabase/server";
import { firstName, formatPkr } from "./format";

/* ----------------------------------------------------------------------------------------------
 * Types and labels
 * -------------------------------------------------------------------------------------------- */

export const FULFILMENT = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
] as const;
export type Fulfilment = (typeof FULFILMENT)[number];

export const PAYMENT_STATUS = ["unpaid", "paid", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on delivery" },
  { id: "bank_transfer", label: "Bank transfer" },
  { id: "mobile_wallet", label: "JazzCash or Easypaisa" },
] as const;

export const COURIERS = [
  "Leopards Courier",
  "TCS",
  "M&P",
  "PostEx",
  "Trax",
  "Pakistan Post",
] as const;

export const CANCEL_REASONS = [
  "Customer changed their mind",
  "Could not reach customer",
  "Out of stock",
  "Suspected fake order",
  "Other",
] as const;

export const RETURN_REASONS = [
  "Customer refused delivery",
  "Could not deliver",
  "Damaged in transit",
  "Customer returned it",
  "Other",
] as const;

export const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface ShippingAddress {
  fullName?: string;
  street?: string;
  landmark?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

export interface OrderListRow {
  id: string;
  number: string;
  created_at: string;
  phone: string;
  email: string | null;
  shipping_address: ShippingAddress | null;
  payment_method_id: string;
  payment_label: string;
  payment_details: { walletLabel?: string } | null;
  payment_status: PaymentStatus;
  fulfilment_status: Fulfilment;
  total: number;
  customer_id: string | null;
}

export const ORDER_LIST_COLUMNS =
  "id, number, created_at, phone, email, shipping_address, payment_method_id, payment_label, payment_details, payment_status, fulfilment_status, total, customer_id";

/** "COD", "JazzCash", "Bank transfer"... as in the mockup's Payment column. */
export function paymentShort(
  o: Pick<OrderListRow, "payment_method_id" | "payment_label" | "payment_details">,
) {
  if (o.payment_method_id === "cod") return "COD";
  if (o.payment_method_id === "mobile_wallet")
    return o.payment_details?.walletLabel ?? "Mobile wallet";
  return o.payment_label;
}

/** Columns offered in the orders export dialog. */
export const ORDER_EXPORT_COLUMNS = [
  { key: "number", label: "Order number", on: true },
  { key: "date", label: "Date", on: true },
  { key: "customer", label: "Customer", on: true },
  { key: "phone", label: "Phone", on: true },
  { key: "city", label: "City", on: true },
  { key: "payment", label: "Payment method", on: true },
  { key: "payment_status", label: "Payment status", on: true },
  { key: "fulfilment", label: "Fulfilment", on: true },
  { key: "items", label: "Items", on: false },
  { key: "total", label: "Total", on: true },
];

/* ----------------------------------------------------------------------------------------------
 * List filters (all in the URL)
 * -------------------------------------------------------------------------------------------- */

export type OrderSort = "new" | "old" | "high" | "low";
export const ORDER_SORTS: { value: OrderSort; label: string }[] = [
  { value: "new", label: "Newest first" },
  { value: "old", label: "Oldest first" },
  { value: "high", label: "Total: high to low" },
  { value: "low", label: "Total: low to high" },
];

export interface OrderFilters {
  q: string;
  status: Fulfilment | "";
  /** "paid" | "unpaid" | "refunded" or a method: "m:cod". */
  pay: string;
  city: string;
  sort: OrderSort;
  page: number;
}

export const ORDERS_PER_PAGE = 20;

/** Characters with meaning in PostgREST filters are dropped from the search text. */
export const cleanSearch = (q: string | undefined) =>
  (q ?? "")
    .replace(/[,()*%\\:"]/g, " ")
    .trim()
    .slice(0, 80);

export function parseOrderFilters(sp: Record<string, string | string[] | undefined>): OrderFilters {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };
  const status = one("status");
  const sort = one("sort");
  const pay = one("pay");
  return {
    q: cleanSearch(one("q")),
    status: (FULFILMENT as readonly string[]).includes(status) ? (status as Fulfilment) : "",
    pay:
      (PAYMENT_STATUS as readonly string[]).includes(pay) ||
      PAYMENT_METHODS.some((m) => `m:${m.id}` === pay)
        ? pay
        : "",
    city: one("city").slice(0, 60),
    sort: (["new", "old", "high", "low"] as const).includes(sort as OrderSort)
      ? (sort as OrderSort)
      : "new",
    page: Math.max(1, Number.parseInt(one("page"), 10) || 1),
  };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Orders matching the filters (no paging). */
export function filteredOrders(
  supabase: Supabase,
  f: Omit<OrderFilters, "page">,
  columns: string,
  count = false,
) {
  let query = supabase.from("orders").select(columns, count ? { count: "exact" } : undefined);
  if (f.status) query = query.eq("fulfilment_status", f.status);
  if (f.pay.startsWith("m:")) query = query.eq("payment_method_id", f.pay.slice(2));
  else if (f.pay) query = query.eq("payment_status", f.pay);
  if (f.city) query = query.eq("shipping_address->>city", f.city);
  if (f.q) {
    const term = f.q.replace(/^#/, "");
    const digits = term.replace(/\D/g, "");
    const parts = [
      `number.ilike.%${term}%`,
      `email.ilike.%${term}%`,
      `shipping_address->>fullName.ilike.%${term}%`,
      `shipping_address->>city.ilike.%${term}%`,
      `phone.ilike.%${term}%`,
    ];
    if (digits.length >= 4 && digits !== term) parts.push(`phone.ilike.%${digits}%`);
    query = query.or(parts.join(","));
  }
  const byTotal = f.sort === "high" || f.sort === "low";
  query = query.order(byTotal ? "total" : "created_at", {
    ascending: f.sort === "old" || f.sort === "low",
  });
  if (byTotal) query = query.order("created_at", { ascending: false });
  return query;
}

export async function loadOrderList(f: OrderFilters) {
  const supabase = await createClient();
  const from = (f.page - 1) * ORDERS_PER_PAGE;
  const [list, any, cities] = await Promise.all([
    filteredOrders(supabase, f, `${ORDER_LIST_COLUMNS}, lines:order_lines(quantity)`, true).range(
      from,
      from + ORDERS_PER_PAGE - 1,
    ),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("city:shipping_address->>city").limit(2000),
  ]);
  const cityList = [
    ...new Set(
      ((cities.data ?? []) as { city: string | null }[])
        .map((r) => r.city?.trim())
        .filter((c): c is string => !!c),
    ),
  ].sort((a, b) => a.localeCompare(b));
  return {
    rows: (list.data ?? []) as unknown as OrderListRow[],
    count: list.count ?? 0,
    storeHasOrders: (any.count ?? 0) > 0,
    cities: cityList,
  };
}

/** The four figures above the orders table. */
export async function loadOrderKpis() {
  const supabase = await createClient();
  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [all, pending, shipped, cod, delivered, returned] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("fulfilment_status", "pending"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("fulfilment_status", "shipped"),
    supabase
      .from("orders")
      .select("total")
      .eq("payment_method_id", "cod")
      .eq("payment_status", "unpaid")
      .not("fulfilment_status", "in", "(cancelled,returned)"),
    supabase
      .from("orders")
      .select("shipped_at, delivered_at")
      .not("shipped_at", "is", null)
      .gte("delivered_at", since30),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("fulfilment_status", "returned")
      .gte("updated_at", since30),
  ]);
  const codRows = (cod.data ?? []) as { total: number }[];
  const transit = ((delivered.data ?? []) as { shipped_at: string; delivered_at: string }[]).map(
    (r) => (Date.parse(r.delivered_at) - Date.parse(r.shipped_at)) / 86_400_000,
  );
  return {
    total: all.count ?? 0,
    toConfirm: pending.count ?? 0,
    onTheWay: shipped.count ?? 0,
    cashToCollect: codRows.reduce((s, r) => s + r.total, 0),
    unpaidCod: codRows.length,
    avgTransitDays: transit.length
      ? Math.round((transit.reduce((a, b) => a + b, 0) / transit.length) * 10) / 10
      : null,
    returned30: returned.count ?? 0,
  };
}

/* ----------------------------------------------------------------------------------------------
 * One order
 * -------------------------------------------------------------------------------------------- */

export interface OrderLine {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  sku: string;
  name: string;
  variant_label: string;
  image: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface OrderEvent {
  id: string;
  type: "note" | "status" | "payment" | "message" | "system";
  message: string;
  detail: string | null;
  created_at: string;
}

export interface OrderDetail extends OrderListRow {
  source: "online" | "admin";
  whatsapp_updates: boolean;
  delivery_method_id: string;
  delivery_label: string;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  payment_fee: number;
  discount_code: string | null;
  courier: string | null;
  tracking_number: string | null;
  tags: string[];
  internal_notes: string;
  cancel_reason: string | null;
  lines: OrderLine[];
  events: OrderEvent[];
  customer: { id: string; name: string; orders_count: number; created_at: string } | null;
}

export async function loadOrder(number: string): Promise<OrderDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      `${ORDER_LIST_COLUMNS}, source, whatsapp_updates, delivery_method_id, delivery_label, subtotal, discount, delivery_fee, payment_fee, discount_code, courier, tracking_number, tags, internal_notes, cancel_reason,
       lines:order_lines(id, product_id, variant_id, sku, name, variant_label, image, unit_price, quantity, line_total),
       events:order_events(id, type, message, detail, created_at)`,
    )
    .eq("number", number.toUpperCase())
    .maybeSingle();
  if (!data) return null;
  const order = data as unknown as Omit<OrderDetail, "customer">;
  order.events.sort((a, b) => b.created_at.localeCompare(a.created_at));
  let customer: OrderDetail["customer"] = null;
  if (order.customer_id) {
    const { data: c } = await supabase
      .from("customer_summaries")
      .select("id, name, orders_count, created_at")
      .eq("id", order.customer_id)
      .maybeSingle();
    customer = (c as OrderDetail["customer"]) ?? null;
  }
  return { ...order, customer };
}

/** "Sea Buckthorn 250g × 2, Herbal Tea 100g" */
export function linesSummary(lines: Pick<OrderLine, "name" | "variant_label" | "quantity">[]) {
  return lines
    .map((l) => {
      const short = l.name
        .replace(/^(Premium|Hunza|Wild|Organic)\s+/i, "")
        .replace(/\s*\(.*?\)\s*/g, " ")
        .split(/\s+/)
        .slice(0, 3)
        .join(" ");
      return `${short} ${l.variant_label}${l.quantity > 1 ? ` × ${l.quantity}` : ""}`;
    })
    .join(", ");
}

export function addressLines(a: ShippingAddress | null | undefined): string[] {
  if (!a) return [];
  return [
    a.street,
    a.landmark,
    [a.city, a.postalCode].filter(Boolean).join(" "),
    a.province,
  ].filter((l): l is string => !!l && l.trim().length > 0);
}

/* ----------------------------------------------------------------------------------------------
 * WhatsApp messages (opened prefilled in WhatsApp; nothing is sent automatically)
 * -------------------------------------------------------------------------------------------- */

export type WhatsappKind = "confirmed" | "shipped" | "cancelled" | "delivered" | "general";

export function whatsappText(
  kind: WhatsappKind,
  o: Pick<OrderDetail, "number" | "total" | "payment_method_id" | "courier" | "tracking_number"> & {
    name?: string;
    reason?: string | null;
  },
): string {
  const hi = `Assalam o Alaikum ${firstName(o.name)},`;
  const n = `#${o.number}`;
  switch (kind) {
    case "confirmed":
      return `${hi} your North Nectar order ${n} is confirmed. Total ${formatPkr(o.total)}${o.payment_method_id === "cod" ? " (cash on delivery)" : ""}. We will send your tracking number as soon as it ships. Thank you!`;
    case "shipped":
      return `${hi} your North Nectar order ${n} is on its way${o.courier ? ` with ${o.courier}` : ""}.${o.tracking_number ? ` Tracking number: ${o.tracking_number}.` : ""}${o.payment_method_id === "cod" ? ` Please keep ${formatPkr(o.total)} ready for the rider.` : ""} Thank you!`;
    case "delivered":
      return `${hi} we hope you are enjoying your North Nectar order ${n}. If anything is not right, just reply here. Thank you!`;
    case "cancelled":
      return `${hi} your North Nectar order ${n} has been cancelled${o.reason ? ` (${o.reason.toLowerCase()})` : ""}. If this is a mistake, reply here and we will sort it out.`;
    default:
      return `${hi} this is North Nectar about your order ${n}.`;
  }
}
