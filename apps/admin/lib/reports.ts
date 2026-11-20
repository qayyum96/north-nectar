import "server-only";
import { fetchAll } from "@/lib/fetch-all";
import { createClient } from "@/lib/supabase/server";
import type { DashboardRange } from "./dashboard";
import { loadStock } from "./inventory";
import { addDays, dayLabel, startOfDayPk } from "./time";

export type ReportTab = "sales" | "purchases" | "profit" | "products";
export const REPORT_TABS: { key: ReportTab; label: string }[] = [
  { key: "sales", label: "Sales" },
  { key: "purchases", label: "Purchases" },
  { key: "profit", label: "Profit" },
  { key: "products", label: "Product performance" },
];

interface OrderRow {
  total: number;
  subtotal: number;
  discount: number;
  fulfilment_status: string;
  created_at: string;
  shipping_address: { city?: string } | null;
  lines: {
    variant_id: string | null;
    name: string;
    variant_label: string;
    quantity: number;
    line_total: number;
    unit_cost: number | null;
  }[];
}

interface PurchaseRow {
  total: number;
  amount_paid: number;
  purchase_date: string;
  supplier_id: string | null;
  supplier: { name: string } | null;
  lines: { variant_id: string | null; quantity: number; line_total: number }[];
}

export interface Week {
  label: string;
  start: Date;
  end: Date;
  /** "light" before the selected period, "dark" inside it, "latest" for the current week. */
  tone: "light" | "dark" | "latest";
}

const pct = (now: number, before: number) =>
  before > 0 ? Math.round(((now - before) / before) * 1000) / 10 : null;

export async function loadReports(range: DashboardRange, now = new Date()) {
  const supabase = await createClient();
  const end = addDays(startOfDayPk(now), 1);
  const weeks: Week[] = Array.from({ length: 12 }, (_, k) => {
    const start = addDays(end, -7 * (12 - k));
    const wEnd = addDays(end, -7 * (11 - k));
    return {
      label: dayLabel(start),
      start,
      end: wEnd,
      tone: k === 11 ? "latest" : start >= range.start && start < range.end ? "dark" : "light",
    };
  });
  const from = new Date(Math.min(range.prevStart.getTime(), weeks[0]!.start.getTime()));
  const dayKey = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(d);

  // Every page of rows: Supabase returns at most 1,000 per request.
  const [orders, purchases, allPurchases, stock] = await Promise.all([
    fetchAll<OrderRow>((a, b) =>
      supabase
        .from("orders")
        .select(
          "total, subtotal, discount, fulfilment_status, created_at, shipping_address, lines:order_lines(variant_id, name, variant_label, quantity, line_total, unit_cost)",
        )
        .neq("fulfilment_status", "cancelled")
        .gte("created_at", from.toISOString())
        .lt("created_at", new Date(Math.max(range.end.getTime(), end.getTime())).toISOString())
        .order("created_at")
        .order("id")
        .range(a, b),
    ),
    fetchAll<PurchaseRow>((a, b) =>
      supabase
        .from("purchases")
        .select(
          "total, amount_paid, purchase_date, supplier_id, supplier:suppliers(name), lines:purchase_lines(variant_id, quantity, line_total)",
        )
        .gte("purchase_date", dayKey(from))
        .order("id")
        .range(a, b),
    ),
    fetchAll<{ total: number; amount_paid: number; supplier_id: string | null }>((a, b) =>
      supabase.from("purchases").select("total, amount_paid, supplier_id").order("id").range(a, b),
    ),
    loadStock(),
  ]);
  const owing = allPurchases.filter((p) => p.amount_paid < p.total);
  const sizeName = new Map(stock.map((s) => [s.id, `${s.product} · ${s.label}`]));
  const shortName = new Map(stock.map((s) => [s.id, `${s.productShort} ${s.label}`]));

  const inPeriod = (iso: string, a: Date, b: Date) => {
    const t = Date.parse(iso);
    return t >= a.getTime() && t < b.getTime();
  };
  const cur = orders.filter((o) => inPeriod(o.created_at, range.start, range.end));
  const prev = orders.filter((o) => inPeriod(o.created_at, range.prevStart, range.start));
  const pDate = (p: PurchaseRow) => `${p.purchase_date}T00:00:00+05:00`;
  const curP = purchases.filter((p) => inPeriod(pDate(p), range.start, range.end));
  const prevP = purchases.filter((p) => inPeriod(pDate(p), range.prevStart, range.start));

  // ---- Sales
  const sum = (list: OrderRow[]) => list.reduce((s, o) => s + o.total, 0);
  const gross = sum(cur);
  const grossPrev = sum(prev);
  const aov = cur.length ? Math.round(gross / cur.length) : 0;
  const aovPrev = prev.length ? Math.round(grossPrev / prev.length) : 0;
  const returned = cur.filter((o) => o.fulfilment_status === "returned");
  const cities = new Map<string, { orders: number; units: number; sales: number }>();
  for (const o of cur) {
    const city = o.shipping_address?.city?.trim() || "Unknown";
    const c = cities.get(city) ?? { orders: 0, units: 0, sales: 0 };
    c.orders++;
    c.units += o.lines.reduce((s, l) => s + l.quantity, 0);
    c.sales += o.total;
    cities.set(city, c);
  }
  const weekly = <T>(items: T[], date: (x: T) => string, value: (x: T) => number) =>
    weeks.map((w) =>
      items.filter((x) => inPeriod(date(x), w.start, w.end)).reduce((s, x) => s + value(x), 0),
    );

  // ---- Products and profit (by size)
  const bySize = (list: OrderRow[]) => {
    const m = new Map<
      string,
      {
        key: string;
        label: string;
        units: number;
        revenue: number;
        cost: number;
        costKnown: boolean;
      }
    >();
    for (const o of list)
      for (const l of o.lines) {
        const key = l.variant_id ?? `${l.name}|${l.variant_label}`;
        const r = m.get(key) ?? {
          key,
          label: (l.variant_id && sizeName.get(l.variant_id)) || `${l.name} · ${l.variant_label}`,
          units: 0,
          revenue: 0,
          cost: 0,
          costKnown: true,
        };
        r.units += l.quantity;
        r.revenue += l.line_total;
        if (l.unit_cost === null) r.costKnown = false;
        else r.cost += l.unit_cost * l.quantity;
        m.set(key, r);
      }
    return [...m.values()];
  };
  // Profit and product figures leave out returned (refunded) orders; Sales shows them as Returns.
  const kept = (o: OrderRow) => o.fulfilment_status !== "returned";
  const curKept = cur.filter(kept);
  const prevKept = prev.filter(kept);
  const sizes = bySize(curKept);
  const sizesPrev = bySize(prevKept);
  const units = sizes.reduce((s, r) => s + r.units, 0);
  const unitsPrev = sizesPrev.reduce((s, r) => s + r.units, 0);
  const costKnown = sizes.every((r) => r.costKnown);
  const cogs = sizes.reduce((s, r) => s + r.cost, 0);
  const revenue = curKept.reduce((s, o) => s + o.subtotal - o.discount, 0);
  const profit = revenue - cogs;
  const prevCostKnown = sizesPrev.every((r) => r.costKnown);
  const revenuePrev = prevKept.reduce((s, o) => s + o.subtotal - o.discount, 0);
  const profitPrev = revenuePrev - sizesPrev.reduce((s, r) => s + r.cost, 0);
  const margin = revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : null;
  const marginPrev = revenuePrev > 0 ? Math.round((profitPrev / revenuePrev) * 1000) / 10 : null;
  const best = [...sizes].sort((a, b) => b.units - a.units)[0];
  const activeSizes = stock.filter((s) => s.productStatus === "active");
  const soldBy = new Map(sizes.map((r) => [r.key, r.units]));
  const slowest = [...activeSizes].sort(
    (a, b) => (soldBy.get(a.id) ?? 0) - (soldBy.get(b.id) ?? 0) || a.available - b.available,
  )[0];
  const available = activeSizes.reduce((s, r) => s + r.available, 0);
  const lineProfit = (o: OrderRow) =>
    o.lines.reduce((s, l) => s + l.line_total - (l.unit_cost ?? 0) * l.quantity, 0) - o.discount;

  // ---- Purchases
  const pTotal = curP.reduce((s, p) => s + p.total, 0);
  const productLines = (list: PurchaseRow[]) =>
    list.flatMap((p) => p.lines.filter((l) => l.variant_id));
  const pUnits = productLines(curP).reduce((s, l) => s + l.quantity, 0);
  const avgCost = (list: PurchaseRow[]) => {
    const ls = productLines(list);
    const u = ls.reduce((s, l) => s + l.quantity, 0);
    return u ? Math.round(ls.reduce((s, l) => s + l.line_total, 0) / u) : null;
  };
  const suppliers = new Map<
    string,
    { name: string; purchases: number; units: number; total: number }
  >();
  for (const p of curP) {
    const key = p.supplier_id ?? "none";
    const s = suppliers.get(key) ?? {
      name: p.supplier?.name ?? "No supplier",
      purchases: 0,
      units: 0,
      total: 0,
    };
    s.purchases++;
    s.units += p.lines.reduce((n, l) => n + l.quantity, 0);
    s.total += p.total;
    suppliers.set(key, s);
  }

  return {
    weeks,
    sales: {
      gross,
      grossChange: pct(gross, grossPrev),
      orders: cur.length,
      ordersChange: pct(cur.length, prev.length),
      aov,
      aovChange: pct(aov, aovPrev),
      returnsTotal: returned.reduce((s, o) => s + o.total, 0),
      returnsCount: returned.length,
      weekly: weekly(
        orders,
        (o) => o.created_at,
        (o) => o.total,
      ),
      byCity: [...cities.entries()]
        .map(([city, v]) => ({ city, ...v }))
        .sort((a, b) => b.sales - a.sales),
    },
    purchases: {
      total: pTotal,
      count: curP.length,
      units: pUnits,
      unpaid: owing.reduce((s, p) => s + p.total - p.amount_paid, 0),
      unpaidSuppliers: new Set(owing.map((p) => p.supplier_id)).size,
      avgCost: avgCost(curP),
      avgCostChange: (() => {
        const a = avgCost(curP);
        const b = avgCost(prevP);
        return a !== null && b ? pct(a, b) : null;
      })(),
      weekly: weekly(purchases, pDate, (p) => p.total),
      bySupplier: [...suppliers.values()].sort((a, b) => b.total - a.total),
    },
    profit: {
      revenue,
      cogs,
      profit,
      profitChange: costKnown && prevCostKnown ? pct(profit, profitPrev) : null,
      margin,
      marginChange:
        margin !== null && marginPrev !== null && costKnown && prevCostKnown
          ? Math.round((margin - marginPrev) * 10) / 10
          : null,
      costKnown,
      missingCosts: sizes.filter((r) => !r.costKnown).length,
      weekly: weekly(orders.filter(kept), (o) => o.created_at, lineProfit),
      byProduct: sizes
        .map((r) => ({
          label: r.label,
          units: r.units,
          revenue: r.revenue,
          profit: r.costKnown ? r.revenue - r.cost : null,
        }))
        .sort((a, b) => (b.profit ?? -1) - (a.profit ?? -1)),
    },
    products: {
      units,
      unitsChange: pct(units, unitsPrev),
      best: best
        ? { name: (best.key && shortName.get(best.key)) || best.label, units: best.units }
        : null,
      slowest: slowest
        ? {
            name: shortName.get(slowest.id) ?? slowest.label,
            units: soldBy.get(slowest.id) ?? 0,
            out: slowest.available <= 0,
          }
        : null,
      sellThrough: units + available > 0 ? Math.round((units / (units + available)) * 100) : null,
      weekly: weekly(
        orders.filter(kept),
        (o) => o.created_at,
        (o) => o.lines.reduce((s, l) => s + l.quantity, 0),
      ),
      byProduct: [
        ...sizes.map((r) => ({
          label: r.label,
          units: r.units,
          revenue: r.revenue,
          stockLeft: stock.find((s) => s.id === r.key)?.available ?? null,
        })),
        ...activeSizes
          .filter((s) => !soldBy.has(s.id))
          .map((s) => ({
            label: `${s.product} · ${s.label}`,
            units: 0,
            revenue: 0,
            stockLeft: s.available,
          })),
      ].sort((a, b) => b.units - a.units),
    },
  };
}

export type Reports = Awaited<ReturnType<typeof loadReports>>;

/** "?tab=profit&range=7d" (the defaults, Sales and 30 days, are left out). */
export function reportQuery(p: {
  tab?: string;
  range?: string;
  from?: string;
  to?: string;
}): string {
  const q = new URLSearchParams();
  if (p.tab && p.tab !== "sales") q.set("tab", p.tab);
  if (p.range) q.set("range", p.range);
  if (p.range === "custom") {
    if (p.from) q.set("from", p.from);
    if (p.to) q.set("to", p.to);
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}
