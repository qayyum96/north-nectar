import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ImageAsset } from "./catalogue-shared";
import { cleanSearch } from "./orders";
import { addDays, startOfDayPk } from "./time";

type Supabase = Awaited<ReturnType<typeof createClient>>;
const one = (sp: Record<string, string | string[] | undefined>, k: string) => {
  const v = sp[k];
  return (Array.isArray(v) ? v[0] : v) ?? "";
};

/* ----------------------------------------------------------------------------------------------
 * Stock
 * -------------------------------------------------------------------------------------------- */

export type StockStatus = "in" | "low" | "out";

export interface StockRow {
  id: string;
  productId: string;
  product: string;
  productShort: string;
  label: string;
  sku: string;
  image: ImageAsset | null;
  stock: number;
  reserved: number;
  available: number;
  reorderAt: number;
  unitCost: number | null;
  status: StockStatus;
  value: number;
  productStatus: "active" | "draft";
}

export const stockStatus = (available: number, reorderAt: number): StockStatus =>
  available <= 0 ? "out" : available <= reorderAt ? "low" : "in";

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  in: "In stock",
  low: "Low stock",
  out: "Out of stock",
};

/** "Hunza Herbal Tea, Wild Thyme (Tumuro)" -> "Hunza Herbal Tea" (short_name wins). */
export const shortProduct = (name: string, short?: string | null) =>
  short?.trim() ||
  name
    .split(/[,(]/)[0]!
    .replace(/^((Premium|Dried)\s+)+/i, "")
    .trim();

export async function loadStock(supabase?: Supabase): Promise<StockRow[]> {
  const db = supabase ?? (await createClient());
  const { data } = await db
    .from("product_variants")
    .select(
      "id, label, sku, stock, reserved, reorder_at, unit_cost, sort_order, product:products(id, name, short_name, images, status, popularity_rank)",
    )
    .order("sort_order");
  type Row = {
    id: string;
    label: string;
    sku: string;
    stock: number;
    reserved: number;
    reorder_at: number;
    unit_cost: number | null;
    sort_order: number;
    product: {
      id: string;
      name: string;
      short_name: string | null;
      images: ImageAsset[];
      status: "active" | "draft";
      popularity_rank: number;
    };
  };
  return ((data ?? []) as unknown as Row[])
    .filter((r) => r.product)
    .sort(
      (a, b) =>
        a.product.popularity_rank - b.product.popularity_rank ||
        a.product.name.localeCompare(b.product.name) ||
        a.sort_order - b.sort_order,
    )
    .map((r) => {
      const available = Math.max(0, r.stock - r.reserved);
      return {
        id: r.id,
        productId: r.product.id,
        product: r.product.name,
        productShort: shortProduct(r.product.name, r.product.short_name),
        label: r.label,
        sku: r.sku,
        image: r.product.images?.[0] ?? null,
        stock: r.stock,
        reserved: r.reserved,
        available,
        reorderAt: r.reorder_at,
        unitCost: r.unit_cost,
        status: stockStatus(available, r.reorder_at),
        value: r.stock * (r.unit_cost ?? 0),
        productStatus: r.product.status,
      };
    });
}

export interface StockFilters {
  q: string;
  product: string;
  status: "" | StockStatus;
  sort: "product" | "available" | "value";
}

export const STOCK_SORTS = [
  { value: "product", label: "Product" },
  { value: "available", label: "Lowest available first" },
  { value: "value", label: "Highest stock value first" },
];

export function parseStockFilters(sp: Record<string, string | string[] | undefined>): StockFilters {
  const status = one(sp, "status");
  const sort = one(sp, "sort");
  return {
    q: cleanSearch(one(sp, "q")).toLowerCase(),
    product: one(sp, "product").slice(0, 80),
    status: (["in", "low", "out"] as const).includes(status as StockStatus)
      ? (status as StockStatus)
      : "",
    sort: sort === "available" || sort === "value" ? sort : "product",
  };
}

export function filterStock(rows: StockRow[], f: StockFilters) {
  const out = rows.filter(
    (r) =>
      (!f.product || r.productId === f.product) &&
      (!f.status || r.status === f.status) &&
      (!f.q || `${r.product} ${r.label} ${r.sku}`.toLowerCase().includes(f.q)),
  );
  if (f.sort === "available") out.sort((a, b) => a.available - b.available);
  if (f.sort === "value") out.sort((a, b) => b.value - a.value);
  return out;
}

/* ----------------------------------------------------------------------------------------------
 * Suppliers
 * -------------------------------------------------------------------------------------------- */

export interface SupplierSummary {
  id: string;
  name: string;
  supplies: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  payment_terms: string;
  notes: string;
  created_at: string;
  purchases_count: number;
  total_bought: number;
  balance_due: number;
  first_purchase_date: string | null;
  last_purchase_date: string | null;
  last_purchase_number: string | null;
}

export async function loadSuppliers(): Promise<SupplierSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("supplier_summaries").select("*").order("name");
  return (data ?? []) as SupplierSummary[];
}

/* ----------------------------------------------------------------------------------------------
 * Purchases
 * -------------------------------------------------------------------------------------------- */

export interface PurchaseLine {
  id: string;
  variant_id: string | null;
  description: string;
  detail: string | null;
  quantity: number;
  unit_cost: number;
  line_total: number;
  sort_order: number;
}

export interface PurchaseRow {
  id: string;
  number: string;
  supplier_id: string | null;
  purchase_date: string;
  reference: string | null;
  items_total: number;
  delivery_cost: number;
  total: number;
  amount_paid: number;
  paid_by: string | null;
  notes: string;
  bill_path: string | null;
  bill_name: string | null;
  bill_size: number | null;
  import_id: string | null;
  created_at: string;
  supplier: { id: string; name: string } | null;
  lines: PurchaseLine[];
}

export type PaymentState = "paid" | "partly paid" | "unpaid";
export const paymentState = (p: Pick<PurchaseRow, "total" | "amount_paid">): PaymentState =>
  p.amount_paid >= p.total ? "paid" : p.amount_paid > 0 ? "partly paid" : "unpaid";

export const PURCHASE_COLUMNS = "*, supplier:suppliers(id, name), lines:purchase_lines(*)";

export interface PurchaseFilters {
  q: string;
  supplier: string;
  pay: "" | "paid" | "partly" | "unpaid";
  sort: "new" | "old" | "high";
}

export const PURCHASE_SORTS = [
  { value: "new", label: "Newest first" },
  { value: "old", label: "Oldest first" },
  { value: "high", label: "Total: high to low" },
];

export function parsePurchaseFilters(
  sp: Record<string, string | string[] | undefined>,
): PurchaseFilters {
  const pay = one(sp, "pay");
  const sort = one(sp, "sort");
  return {
    q: cleanSearch(one(sp, "q")).toLowerCase(),
    supplier: one(sp, "supplier").slice(0, 40),
    pay: pay === "paid" || pay === "partly" || pay === "unpaid" ? pay : "",
    sort: sort === "old" || sort === "high" ? sort : "new",
  };
}

export async function loadPurchases(): Promise<PurchaseRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select(PURCHASE_COLUMNS)
    .order("purchase_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(2000);
  return ((data ?? []) as PurchaseRow[]).map((p) => ({
    ...p,
    lines: [...p.lines].sort((a, b) => a.sort_order - b.sort_order),
  }));
}

export function filterPurchases(rows: PurchaseRow[], f: PurchaseFilters) {
  const out = rows.filter((p) => {
    if (f.supplier && p.supplier_id !== f.supplier) return false;
    const state = paymentState(p);
    if (f.pay === "paid" && state !== "paid") return false;
    if (f.pay === "partly" && state !== "partly paid") return false;
    if (f.pay === "unpaid" && state !== "unpaid") return false;
    if (f.q) {
      const hay =
        `${p.number} ${p.reference ?? ""} ${p.supplier?.name ?? ""} ${p.lines.map((l) => l.description).join(" ")}`.toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    return true;
  });
  if (f.sort === "old") out.reverse();
  if (f.sort === "high") out.sort((a, b) => b.total - a.total);
  return out;
}

export async function loadPurchase(id: string): Promise<PurchaseRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select(PURCHASE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const p = data as PurchaseRow;
  return { ...p, lines: [...p.lines].sort((a, b) => a.sort_order - b.sort_order) };
}

/** Item line for the purchases table: "Sea Buckthorn Berries" + "250g × 120 · 500g × 40". */
export function purchaseItems(p: PurchaseRow): { title: string; sub: string } {
  if (p.lines.length === 0) return { title: "No items", sub: "" };
  const products = [
    ...new Set(p.lines.map((l) => (l.variant_id ? l.description.split(" · ")[0]! : l.description))),
  ];
  const title =
    products.length === 1
      ? shortProduct(products[0]!)
      : `${shortProduct(products[0]!)} and ${products.length - 1} more`;
  const sub = p.lines
    .map((l) => {
      if (l.variant_id)
        return `${l.description.split(" · ")[1] ?? ""} × ${l.quantity.toLocaleString("en-US")}`;
      return l.detail ?? "";
    })
    .filter(Boolean)
    .join(" · ");
  return { title, sub };
}

export function costRange(p: PurchaseRow): string {
  const costs = p.lines.map((l) => l.unit_cost);
  if (!costs.length) return "";
  const min = Math.min(...costs);
  const max = Math.max(...costs);
  return min === max
    ? `Rs ${min.toLocaleString("en-US")}`
    : `Rs ${min.toLocaleString("en-US")} to ${max.toLocaleString("en-US")}`;
}

/* ----------------------------------------------------------------------------------------------
 * Stock movements
 * -------------------------------------------------------------------------------------------- */

export type MovementType = "sale" | "purchase" | "adjustment" | "return";
export const MOVEMENT_TYPES: MovementType[] = ["sale", "purchase", "adjustment", "return"];

export interface MovementRow {
  id: string;
  variant_id: string;
  type: MovementType;
  quantity: number;
  balance_after: number;
  unit_cost: number | null;
  unit_price: number | null;
  reference: string | null;
  reason: string | null;
  note: string | null;
  purchase_id: string | null;
  created_at: string;
  variant: {
    label: string;
    sku: string;
    product: { id: string; name: string; short_name: string | null };
  } | null;
}

export interface MovementFilters {
  type: "" | MovementType;
  product: string;
  from: string;
  to: string;
  page: number;
}

export const MOVEMENTS_PER_PAGE = 25;

export function parseMovementFilters(
  sp: Record<string, string | string[] | undefined>,
): MovementFilters {
  const type = one(sp, "type");
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
  const monthAgo = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(
    addDays(new Date(), -30),
  );
  const from = one(sp, "from");
  const to = one(sp, "to");
  return {
    type: (MOVEMENT_TYPES as string[]).includes(type) ? (type as MovementType) : "",
    product: one(sp, "product").slice(0, 80),
    from: iso.test(from) ? from : monthAgo,
    to: iso.test(to) ? to : today,
    page: Math.max(1, Number.parseInt(one(sp, "page"), 10) || 1),
  };
}

const MOVEMENT_SELECT =
  "id, variant_id, type, quantity, balance_after, unit_cost, unit_price, reference, reason, note, purchase_id, created_at, variant:product_variants!inner(label, sku, product:products!inner(id, name, short_name))";

export function movementQuery(supabase: Supabase, f: Omit<MovementFilters, "page">, count = false) {
  let q = supabase
    .from("stock_movements")
    .select(MOVEMENT_SELECT, count ? { count: "exact" } : undefined)
    .gte("created_at", new Date(`${f.from}T00:00:00+05:00`).toISOString())
    .lt("created_at", addDays(new Date(`${f.to}T00:00:00+05:00`), 1).toISOString());
  if (f.type) q = q.eq("type", f.type);
  if (f.product) q = q.eq("variant.product.id", f.product);
  return q.order("created_at", { ascending: false });
}

export async function loadMovements(f: MovementFilters) {
  const supabase = await createClient();
  const from = (f.page - 1) * MOVEMENTS_PER_PAGE;
  const [page, all, earliest] = await Promise.all([
    movementQuery(supabase, f, true).range(from, from + MOVEMENTS_PER_PAGE - 1),
    movementQuery(supabase, { ...f, type: "" }).limit(20000),
    supabase.from("stock_movements").select("created_at").order("created_at").limit(1),
  ]);
  const rows = (all.data ?? []) as unknown as MovementRow[];
  const sum = (t: MovementType, pick: (m: MovementRow) => number) =>
    rows.filter((m) => m.type === t).reduce((s, m) => s + pick(m), 0);
  const purchasedUnits = sum("purchase", (m) => m.quantity);
  const purchasedCost = sum("purchase", (m) => m.quantity * (m.unit_cost ?? 0));
  const soldUnits = sum("sale", (m) => -m.quantity);
  const soldRevenue = sum("sale", (m) => -m.quantity * (m.unit_price ?? 0));
  const soldCost = sum("sale", (m) => -m.quantity * (m.unit_cost ?? 0));
  const costKnown = rows.filter((m) => m.type === "sale").every((m) => m.unit_cost !== null);
  return {
    rows: (page.data ?? []) as unknown as MovementRow[],
    count: page.count ?? 0,
    since: (earliest.data?.[0] as { created_at: string } | undefined)?.created_at ?? null,
    kpis: {
      purchasedUnits,
      purchasedCost,
      soldUnits,
      soldRevenue,
      net: rows.reduce((s, m) => s + m.quantity, 0),
      adjusted: rows.filter((m) => m.type === "adjustment").length,
      returned: sum("return", (m) => m.quantity),
      profit: costKnown ? soldRevenue - soldCost : null,
      margin:
        costKnown && soldRevenue > 0
          ? Math.round(((soldRevenue - soldCost) / soldRevenue) * 100)
          : null,
    },
  };
}

/* ----------------------------------------------------------------------------------------------
 * Imports
 * -------------------------------------------------------------------------------------------- */

export interface ImportRow {
  id: string;
  kind: "products" | "purchases" | "movements";
  file_name: string;
  file_size: number;
  total_rows: number;
  imported_rows: number;
  status: "completed" | "completed_with_errors" | "failed" | "undone";
  errors: { row: number; message: string }[];
  summary: string;
  actor_name: string | null;
  undone_at: string | null;
  created_at: string;
}

export async function loadImports(): Promise<ImportRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("imports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  return (data ?? []) as ImportRow[];
}

/** Month boundaries in Pakistan time. */
export function monthStartPk(d = new Date()): Date {
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
  }).format(d);
  return new Date(`${key}-01T00:00:00+05:00`);
}
export const prevMonthStartPk = (d = new Date()) =>
  monthStartPk(startOfDayPk(new Date(monthStartPk(d).getTime() - 86_400_000)));

/** Figures above the purchases table. */
export function purchaseKpis(all: PurchaseRow[], now = new Date()) {
  const monthStart = monthStartPk(now);
  const prevStart = prevMonthStartPk(now);
  const monthName = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "Asia/Karachi" });
  const inMonth = all.filter((p) => new Date(`${p.purchase_date}T00:00:00+05:00`) >= monthStart);
  const inPrev = all.filter((p) => {
    const d = new Date(`${p.purchase_date}T00:00:00+05:00`);
    return d >= prevStart && d < monthStart;
  });
  const owing = all.filter((p) => p.amount_paid < p.total);
  const stillToPay = owing.reduce((s, p) => s + (p.total - p.amount_paid), 0);
  const since30 = now.getTime() - 30 * 86_400_000;
  const recentLines = all
    .filter((p) => Date.parse(`${p.purchase_date}T00:00:00+05:00`) >= since30)
    .flatMap((p) => p.lines.filter((l) => l.variant_id));
  const units30 = recentLines.reduce((s, l) => s + l.quantity, 0);
  const avg = (lines: typeof recentLines) => {
    const u = lines.reduce((s, l) => s + l.quantity, 0);
    return u ? Math.round(lines.reduce((s, l) => s + l.line_total, 0) / u) : null;
  };
  const avgNow = avg(inMonth.flatMap((p) => p.lines.filter((l) => l.variant_id)));
  const avgPrev = avg(inPrev.flatMap((p) => p.lines.filter((l) => l.variant_id)));
  const change =
    avgNow !== null && avgPrev ? Math.round(((avgNow - avgPrev) / avgPrev) * 100) : null;

  return { monthStart, prevStart, monthName, inMonth, owing, stillToPay, units30, avgNow, change };
}
