import "server-only";
import { fetchAll } from "@/lib/fetch-all";
import { createClient } from "@/lib/supabase/server";
import { cleanSearch, type ShippingAddress } from "./orders";
import { startOfDayPk } from "./time";

export interface CustomerSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  whatsapp_opt_in: boolean;
  city: string | null;
  default_address: ShippingAddress | null;
  notes: string;
  tags: string[];
  created_at: string;
  orders_count: number;
  pending_count: number;
  total_spent: number;
  last_order_at: string | null;
  last_order_number: string | null;
}

export type CustomerSort = "recent" | "spent" | "orders" | "name" | "new";
export const CUSTOMER_SORTS: { value: CustomerSort; label: string }[] = [
  { value: "recent", label: "Last order, newest first" },
  { value: "spent", label: "Total spent, highest first" },
  { value: "orders", label: "Most orders first" },
  { value: "new", label: "Newest customers first" },
  { value: "name", label: "Name, A to Z" },
];

export const ORDER_COUNT_FILTERS = [
  { value: "0", label: "No orders yet" },
  { value: "1", label: "1 order" },
  { value: "2", label: "2 or more orders" },
  { value: "5", label: "5 or more orders" },
];

export interface CustomerFilters {
  q: string;
  city: string;
  orders: string;
  sort: CustomerSort;
  page: number;
}

export const CUSTOMERS_PER_PAGE = 20;

export const CUSTOMER_EXPORT_COLUMNS = [
  { key: "name", label: "Name", on: true },
  { key: "email", label: "Email", on: true },
  { key: "phone", label: "Phone", on: true },
  { key: "city", label: "City", on: true },
  { key: "orders", label: "Orders", on: true },
  { key: "spent", label: "Total spent", on: true },
  { key: "last", label: "Last order", on: true },
  { key: "whatsapp", label: "WhatsApp updates", on: true },
  { key: "since", label: "Customer since", on: false },
  { key: "address", label: "Address", on: false },
];

export function parseCustomerFilters(
  sp: Record<string, string | string[] | undefined>,
): CustomerFilters {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };
  const sort = one("sort") as CustomerSort;
  const orders = one("orders");
  return {
    q: cleanSearch(one("q")),
    city: one("city").slice(0, 60),
    orders: ORDER_COUNT_FILTERS.some((o) => o.value === orders) ? orders : "",
    sort: CUSTOMER_SORTS.some((s) => s.value === sort) ? sort : "recent",
    page: Math.max(1, Number.parseInt(one("page"), 10) || 1),
  };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

export function filteredCustomers(
  supabase: Supabase,
  f: Omit<CustomerFilters, "page">,
  count = false,
) {
  let query = supabase
    .from("customer_summaries")
    .select("*", count ? { count: "exact" } : undefined);
  if (f.q) {
    const digits = f.q.replace(/\D/g, "");
    const parts = [
      `name.ilike.%${f.q}%`,
      `email.ilike.%${f.q}%`,
      `phone.ilike.%${f.q}%`,
      `city.ilike.%${f.q}%`,
    ];
    if (digits.length >= 4 && digits !== f.q) parts.push(`phone.ilike.%${digits}%`);
    query = query.or(parts.join(","));
  }
  if (f.city) query = query.eq("city", f.city);
  if (f.orders === "0") query = query.eq("orders_count", 0);
  else if (f.orders === "1") query = query.eq("orders_count", 1);
  else if (f.orders) query = query.gte("orders_count", Number(f.orders));
  switch (f.sort) {
    case "spent":
      query = query.order("total_spent", { ascending: false });
      break;
    case "orders":
      query = query.order("orders_count", { ascending: false });
      break;
    case "name":
      query = query.order("name");
      break;
    case "new":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("last_order_at", { ascending: false, nullsFirst: false });
  }
  return query.order("created_at", { ascending: false });
}

export async function loadCustomers(f: CustomerFilters) {
  const supabase = await createClient();
  const from = (f.page - 1) * CUSTOMERS_PER_PAGE;
  const [list, all] = await Promise.all([
    filteredCustomers(supabase, f, true).range(from, from + CUSTOMERS_PER_PAGE - 1),
    fetchAll((a, b) =>
      supabase
        .from("customer_summaries")
        .select("city, orders_count, total_spent, created_at, whatsapp_opt_in")
        .order("id")
        .range(a, b),
    ),
  ]);
  const everyone = all as Pick<
    CustomerSummary,
    "city" | "orders_count" | "total_spent" | "created_at" | "whatsapp_opt_in"
  >[];

  // Month boundaries in Pakistan time.
  const now = new Date();
  const monthKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
  }).format(now);
  const monthStart = new Date(`${monthKey}-01T00:00:00+05:00`);
  const prevStart = startOfDayPk(new Date(monthStart.getTime() - 86_400_000));
  const prevMonthStart = new Date(
    `${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit" }).format(prevStart)}-01T00:00:00+05:00`,
  );
  const buyers = everyone.filter((c) => c.orders_count > 0);
  const newThis = everyone.filter((c) => Date.parse(c.created_at) >= monthStart.getTime()).length;
  const newPrev = everyone.filter(
    (c) =>
      Date.parse(c.created_at) >= prevMonthStart.getTime() &&
      Date.parse(c.created_at) < monthStart.getTime(),
  ).length;

  return {
    rows: (list.data ?? []) as CustomerSummary[],
    count: list.count ?? 0,
    cities: [...new Set(everyone.map((c) => c.city?.trim()).filter((c): c is string => !!c))].sort(
      (a, b) => a.localeCompare(b),
    ),
    kpis: {
      total: everyone.length,
      returning: everyone.filter((c) => c.orders_count >= 2).length,
      buyers: buyers.length,
      newThisMonth: newThis,
      newPrevMonth: newPrev,
      prevMonthLabel: new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Karachi",
        month: "long",
      }).format(prevMonthStart),
      averageSpend: buyers.length
        ? Math.round(buyers.reduce((s, c) => s + c.total_spent, 0) / buyers.length)
        : 0,
      whatsapp: everyone.filter((c) => c.whatsapp_opt_in).length,
    },
  };
}

export async function loadCustomer(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const [customer, orders, store] = await Promise.all([
    supabase.from("customer_summaries").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("orders")
      .select(
        "id, number, created_at, total, fulfilment_status, payment_status, lines:order_lines(name, variant_label, quantity)",
      )
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    fetchAll<{ total: number }>((a, b) =>
      supabase
        .from("orders")
        .select("total")
        .not("fulfilment_status", "in", "(cancelled,returned)")
        .order("id")
        .range(a, b),
    ),
  ]);
  if (!customer.data) return null;
  const totals = store.map((o) => o.total);
  return {
    customer: customer.data as CustomerSummary,
    orders: (orders.data ?? []) as {
      id: string;
      number: string;
      created_at: string;
      total: number;
      fulfilment_status: string;
      payment_status: string;
      lines: { name: string; variant_label: string; quantity: number }[];
    }[],
    storeAverage: totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : 0,
  };
}
