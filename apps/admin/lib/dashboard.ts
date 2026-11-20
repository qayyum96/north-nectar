import "server-only";
import { fetchAll } from "@/lib/fetch-all";
import { createClient } from "@/lib/supabase/server";
import { addDays, dayLabel, isDay, startOfDayPk } from "@/lib/time";

export type RangeKey = "today" | "7d" | "30d" | "custom";

export interface DashboardRange {
  key: RangeKey;
  start: Date;
  /** Exclusive. */
  end: Date;
  prevStart: Date;
  days: number;
  label: string;
  from?: string;
  to?: string;
}

/** Reads ?range=today|7d|30d|custom&from=YYYY-MM-DD&to=YYYY-MM-DD (Pakistan days). */
export function parseRange(
  params: { range?: string; from?: string; to?: string },
  now = new Date(),
): DashboardRange {
  const today = startOfDayPk(now);
  const tomorrow = addDays(today, 1);
  if (
    params.range === "custom" &&
    params.from &&
    params.to &&
    isDay(params.from) &&
    isDay(params.to)
  ) {
    let start = new Date(`${params.from}T00:00:00+05:00`);
    let end = addDays(new Date(`${params.to}T00:00:00+05:00`), 1);
    if (end <= start) [start, end] = [addDays(end, -1), addDays(start, 1)];
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
    return {
      key: "custom",
      start,
      end,
      prevStart: addDays(start, -days),
      days,
      label: `${dayLabel(start)} to ${dayLabel(addDays(end, -1))}`,
      from: params.from,
      to: params.to,
    };
  }
  const key: RangeKey = params.range === "today" || params.range === "7d" ? params.range : "30d";
  const days = key === "today" ? 1 : key === "7d" ? 7 : 30;
  const start = addDays(tomorrow, -days);
  return {
    key,
    start,
    end: tomorrow,
    prevStart: addDays(start, -days),
    days,
    label: key === "today" ? "Today" : `${days} days`,
  };
}

interface LineRow {
  name: string;
  variant_label: string;
  variant_id: string | null;
  image: string | null;
  quantity: number;
  line_total: number;
  unit_cost: number | null;
}
interface OrderRow {
  id: string;
  number: string;
  total: number;
  discount: number;
  fulfilment_status: string;
  created_at: string;
  shipping_address: { fullName?: string; city?: string } | null;
  order_lines: LineRow[];
}

export interface Kpi {
  label: string;
  value: number | null;
  format: "pkr" | "count";
  /** Percentage change vs the previous period, null when there's nothing to compare. */
  change: number | null;
  /** Shown instead of the comparison (e.g. why a value is missing). */
  note?: string;
}

const pctChange = (now: number, before: number) =>
  before > 0 ? Math.round(((now - before) / before) * 1000) / 10 : null;

export async function loadDashboard(range: DashboardRange) {
  const supabase = await createClient();
  const dayKey = (x: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(x);
  // Every page of rows (Supabase returns 1,000 at most per request), with any error kept.
  const all = <T>(page: Parameters<typeof fetchAll>[0]) =>
    fetchAll<T>(page).then(
      (data) => ({ data, error: null as unknown }),
      (error: unknown) => ({ data: [] as T[], error }),
    );
  const [ordersRes, recentRes, messagesRes, variantsRes, purchasesRes] = await Promise.all([
    // Sales figures leave out cancelled and returned (refunded) orders.
    all<OrderRow>((a, b) =>
      supabase
        .from("orders")
        .select(
          "id, number, total, discount, fulfilment_status, created_at, shipping_address, order_lines(name, variant_label, variant_id, image, quantity, line_total, unit_cost)",
        )
        .gte("created_at", range.prevStart.toISOString())
        .lt("created_at", range.end.toISOString())
        .not("fulfilment_status", "in", "(cancelled,returned)")
        .order("created_at")
        .order("id")
        .range(a, b),
    ),
    supabase
      .from("orders")
      .select("id, number, total, fulfilment_status, created_at, shipping_address")
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<Omit<OrderRow, "order_lines">[]>(),
    supabase
      .from("contact_messages")
      .select("id, name, subject, message, created_at")
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("product_variants")
      .select("id, sku, label, stock, reserved, reorder_at, products!inner(name, status)")
      .eq("products.status", "active")
      .returns<
        {
          id: string;
          sku: string;
          label: string;
          stock: number;
          reserved: number;
          reorder_at: number;
          products: { name: string; status: string };
        }[]
      >(),
    all<{ total: number; purchase_date: string }>((a, b) =>
      supabase
        .from("purchases")
        .select("total, purchase_date")
        .gte("purchase_date", dayKey(range.prevStart))
        .lt("purchase_date", dayKey(range.end))
        .order("id")
        .range(a, b),
    ),
  ]);
  const purchases = purchasesRes.data;
  const startKey = dayKey(range.start);
  const spentNow = purchases
    .filter((p) => p.purchase_date >= startKey)
    .reduce((s, p) => s + p.total, 0);
  const spentBefore = purchases
    .filter((p) => p.purchase_date < startKey)
    .reduce((s, p) => s + p.total, 0);
  const anyPurchases = purchases.length > 0;

  const orders = ordersRes.data;
  const inRange = (o: OrderRow) => new Date(o.created_at) >= range.start;
  const current = orders.filter(inRange);
  const previous = orders.filter((o) => !inRange(o));

  const revenue = (list: OrderRow[]) => list.reduce((s, o) => s + o.total, 0);
  const lines = (list: OrderRow[]) => list.flatMap((o) => o.order_lines);
  const profit = (list: OrderRow[]): number | null => {
    const all = lines(list);
    if (all.some((l) => l.unit_cost === null)) return null;
    const discounts = list.reduce((s, o) => s + o.discount, 0);
    return all.reduce((s, l) => s + l.line_total - (l.unit_cost ?? 0) * l.quantity, 0) - discounts;
  };

  const revNow = revenue(current);
  const revBefore = revenue(previous);
  const aovNow = current.length ? Math.round(revNow / current.length) : 0;
  const aovBefore = previous.length ? Math.round(revBefore / previous.length) : 0;
  const profitNow = profit(current);
  const profitBefore = profit(previous);

  const kpis: Kpi[] = [
    { label: "Revenue", value: revNow, format: "pkr", change: pctChange(revNow, revBefore) },
    {
      label: "Orders",
      value: current.length,
      format: "count",
      change: pctChange(current.length, previous.length),
    },
    {
      label: "Average order value",
      value: aovNow,
      format: "pkr",
      change: pctChange(aovNow, aovBefore),
    },
    {
      label: "Purchases spent",
      value: spentNow,
      format: "pkr",
      change: anyPurchases ? pctChange(spentNow, spentBefore) : null,
      note: anyPurchases ? "No purchases last period" : "No purchases recorded yet",
    },
    profitNow === null
      ? {
          label: "Gross profit",
          value: null,
          format: "pkr",
          change: null,
          note: "Add costs to see profit",
        }
      : {
          label: "Gross profit",
          value: profitNow,
          format: "pkr",
          change: profitBefore === null ? null : pctChange(profitNow, profitBefore),
        },
  ];

  // Daily series for the chart (this period and the one before, aligned by day).
  const buckets = (list: OrderRow[], from: Date) => {
    const revenueByDay = new Array<number>(range.days).fill(0);
    const ordersByDay = new Array<number>(range.days).fill(0);
    for (const o of list) {
      const i = Math.floor((new Date(o.created_at).getTime() - from.getTime()) / 86_400_000);
      if (i >= 0 && i < range.days) {
        revenueByDay[i]! += o.total;
        ordersByDay[i]! += 1;
      }
    }
    return { revenue: revenueByDay, orders: ordersByDay };
  };
  const series = {
    current: buckets(current, range.start),
    previous: buckets(previous, range.prevStart),
  };
  const tickCount = Math.min(5, range.days);
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const dayIndex = tickCount === 1 ? 0 : Math.round((i * (range.days - 1)) / (tickCount - 1));
    return dayLabel(addDays(range.start, dayIndex));
  });

  // Top products by revenue in the period.
  const byVariant = new Map<
    string,
    { name: string; image: string | null; revenue: number; sold: number }
  >();
  for (const l of lines(current)) {
    const key = l.variant_id ?? `${l.name}-${l.variant_label}`;
    const entry = byVariant.get(key) ?? {
      name: `${l.name} · ${l.variant_label}`,
      image: l.image,
      revenue: 0,
      sold: 0,
    };
    entry.revenue += l.line_total;
    entry.sold += l.quantity;
    byVariant.set(key, entry);
  }
  const top = [...byVariant.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 4);
  const topMax = top[0]?.revenue ?? 0;

  const lowStock = (variantsRes.data ?? [])
    .map((v) => ({ ...v, available: v.stock - v.reserved }))
    .filter((v) => v.available <= v.reorder_at)
    .sort((a, b) => a.available - b.available)
    .slice(0, 5);

  return {
    kpis,
    revenueTotal: revNow,
    ordersTotal: current.length,
    series,
    ticks,
    top: top.map((t) => ({
      ...t,
      share: topMax ? Math.max(4, Math.round((t.revenue / topMax) * 100)) : 0,
    })),
    lowStock,
    recent: recentRes.data ?? [],
    messages: messagesRes.data ?? [],
    errors: [ordersRes.error, recentRes.error, messagesRes.error, variantsRes.error].filter(
      Boolean,
    ),
  };
}

export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;
