/** What each kind of import expects, how columns are matched and how rows are checked. */
import { type Sheet, parseDate, parseNumber } from "./spreadsheet";

export type ImportKind = "products" | "purchases" | "movements";

export const KIND_LABEL: Record<ImportKind, string> = {
  products: "Products",
  purchases: "Purchases",
  movements: "Stock movements",
};

export interface ImportField {
  key: string;
  label: string;
  required?: boolean;
  synonyms: string[];
}

export const FIELDS: Record<ImportKind, ImportField[]> = {
  purchases: [
    {
      key: "date",
      label: "Purchase date",
      synonyms: ["date", "purchase date", "bill date", "day"],
    },
    {
      key: "supplier",
      label: "Supplier",
      required: true,
      synonyms: ["supplier", "vendor", "seller", "from"],
    },
    {
      key: "item",
      label: "Product and size",
      required: true,
      synonyms: ["item", "product", "product and size", "sku", "description"],
    },
    {
      key: "quantity",
      label: "Quantity",
      required: true,
      synonyms: ["qty", "quantity", "units", "pcs", "count"],
    },
    {
      key: "unitCost",
      label: "Unit cost",
      required: true,
      synonyms: ["rate", "unit cost", "cost", "price", "unit price"],
    },
    { key: "paid", label: "Amount paid", synonyms: ["paid", "amount paid", "payment"] },
    {
      key: "reference",
      label: "Bill or reference no.",
      synonyms: ["bill", "bill no", "reference", "ref", "invoice"],
    },
    { key: "notes", label: "Notes", synonyms: ["notes", "note"] },
  ],
  movements: [
    {
      key: "item",
      label: "Product and size (or SKU)",
      required: true,
      synonyms: ["item", "product", "sku", "product and size", "size"],
    },
    {
      key: "change",
      label: "Quantity change (+ or −)",
      synonyms: ["change", "qty", "quantity", "adjustment", "difference"],
    },
    {
      key: "count",
      label: "New on-hand count",
      synonyms: ["count", "counted", "on hand", "stock", "new count", "physical"],
    },
    { key: "reason", label: "Reason", synonyms: ["reason", "type"] },
    { key: "note", label: "Note", synonyms: ["note", "notes", "remarks", "comment"] },
  ],
  products: [
    {
      key: "name",
      label: "Product name",
      required: true,
      synonyms: ["product", "product name", "name", "title"],
    },
    { key: "size", label: "Size", required: true, synonyms: ["size", "variant", "weight", "pack"] },
    { key: "sku", label: "SKU", required: true, synonyms: ["sku", "code", "item code"] },
    {
      key: "price",
      label: "Price",
      required: true,
      synonyms: ["price", "sale price", "retail price", "rate"],
    },
    {
      key: "compare",
      label: "Compare-at price",
      synonyms: ["compare", "compare at", "mrp", "old price", "was"],
    },
    { key: "stock", label: "Opening stock", synonyms: ["stock", "qty", "quantity", "on hand"] },
    { key: "category", label: "Category", synonyms: ["category", "collection", "type"] },
    { key: "tagline", label: "Tagline", synonyms: ["tagline", "subtitle", "short description"] },
    { key: "description", label: "Description", synonyms: ["description", "details", "body"] },
    {
      key: "status",
      label: "Status (active or draft)",
      synonyms: ["status", "published", "visible"],
    },
  ],
};

export const TEMPLATES: Record<ImportKind, string[][]> = {
  purchases: [
    ["Date", "Supplier", "Item", "Qty", "Rate", "Paid", "Bill no", "Remarks"],
    [
      "02/11/2026",
      "Ghanche Berry Collectors",
      "NN-SBB-250",
      "120",
      "610",
      "73200",
      "GBC-2231",
      "Nov batch",
    ],
    [
      "02/11/2026",
      "Ghanche Berry Collectors",
      "Sea Buckthorn Berries 500g",
      "40",
      "1180",
      "0",
      "GBC-2231",
      "",
    ],
  ],
  movements: [
    ["SKU", "Change", "Count", "Reason", "Note"],
    ["NN-SBB-100", "-3", "", "Damaged", "Torn pouches"],
    ["NN-TEA-WT-050", "", "42", "Recount", "Monthly count"],
  ],
  products: [
    [
      "Product name",
      "Size",
      "SKU",
      "Price",
      "Compare-at price",
      "Opening stock",
      "Category",
      "Tagline",
      "Status",
    ],
    [
      "Hunza Apricot Oil",
      "100ml",
      "NN-APO-100",
      "1450",
      "",
      "20",
      "Natural Oils",
      "Cold-pressed in Hunza",
      "draft",
    ],
    ["Hunza Apricot Oil", "250ml", "NN-APO-250", "2900", "3200", "10", "Natural Oils", "", "draft"],
  ],
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Best field for each column ("" = Don't import). Each field is used once. */
export function autoMap(headers: string[], kind: ImportKind): string[] {
  const used = new Set<string>();
  return headers.map((h) => {
    const n = norm(h);
    const field =
      FIELDS[kind].find(
        (f) => !used.has(f.key) && (norm(f.label) === n || f.synonyms.includes(n)),
      ) ??
      FIELDS[kind].find(
        (f) => !used.has(f.key) && f.synonyms.some((s) => n.includes(s) && s.length > 2),
      );
    if (!field) return "";
    used.add(field.key);
    return field.key;
  });
}

export interface CatalogSize {
  id: string;
  sku: string;
  product: string;
  short: string;
  label: string;
}

const sizeKey = (s: string) =>
  s
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/gms?$|grams?$/, "g");

/** Finds the size for "NN-SBB-250", "Sea Buckthorn 250g" or "Sea Buckthorn Berries · 250g". */
export function matchSize(
  text: string,
  sizes: CatalogSize[],
): { id: string; label: string } | { error: string } {
  const t = text.trim();
  if (!t) return { error: "Product and size is missing" };
  const bySku = sizes.find((s) => s.sku.toLowerCase() === t.toLowerCase());
  if (bySku) return { id: bySku.id, label: `${bySku.short} · ${bySku.label}` };
  const n = norm(t);
  const compact = n.replace(/\s+/g, "");
  const candidates = sizes.filter((s) => {
    const label = sizeKey(s.label);
    if (!compact.includes(label)) return false;
    const words = [
      ...new Set(
        `${s.product} ${s.short}`
          .toLowerCase()
          .split(/[^a-z]+/)
          .filter((w) => w.length >= 4),
      ),
    ];
    return words.some((w) => n.includes(w));
  });
  if (candidates.length === 1)
    return { id: candidates[0]!.id, label: `${candidates[0]!.short} · ${candidates[0]!.label}` };
  if (candidates.length > 1) {
    // Prefer the product whose short name appears in full.
    const exact = candidates.filter((s) => n.includes(norm(s.short)));
    if (exact.length === 1)
      return { id: exact[0]!.id, label: `${exact[0]!.short} · ${exact[0]!.label}` };
    return { error: "Matches more than one size; use the SKU" };
  }
  return { error: "No product and size with this name or SKU" };
}

export interface PreviewRow {
  row: number;
  cells: string[];
  bad: number[];
  problem: string;
}

export interface ValidationResult {
  columns: string[];
  /** CSS grid columns for the preview table. */
  grid: string;
  rows: PreviewRow[];
  ready: Record<string, unknown>[];
  errors: { row: number; message: string }[];
  summary: string;
}

export function validateRows(
  kind: ImportKind,
  sheet: Sheet,
  mapping: string[],
  ctx: { sizes: CatalogSize[]; today: string; categories: string[] },
): ValidationResult {
  const col = (key: string) => mapping.indexOf(key);
  const get = (r: string[], key: string) => (col(key) >= 0 ? (r[col(key)] ?? "") : "");
  const rows: PreviewRow[] = [];
  const ready: Record<string, unknown>[] = [];
  const errors: { row: number; message: string }[] = [];
  let units = 0;
  let money = 0;
  const skusSeen = new Set<string>();

  sheet.rows.forEach((r, i) => {
    const rowNo = i + 2; // header is row 1
    const problems: string[] = [];
    const bad: number[] = [];
    const fail = (message: string, column?: number) => {
      problems.push(message);
      if (column !== undefined) bad.push(column);
    };
    if (kind === "purchases") {
      const date = get(r, "date") ? parseDate(get(r, "date")) : ctx.today;
      const qty = parseNumber(get(r, "quantity"));
      const cost = parseNumber(get(r, "unitCost"));
      const paid = parseNumber(get(r, "paid"));
      const size = matchSize(get(r, "item"), ctx.sizes);
      if (!date) fail("Date isn't a date", 1);
      if ("error" in size) fail(size.error, 2);
      if (qty === null) fail("Quantity is missing", 3);
      else if (Number.isNaN(qty) || qty <= 0 || !Number.isInteger(qty))
        fail("Quantity must be a number", 3);
      if (cost === null) fail("Unit cost is missing", 4);
      else if (Number.isNaN(cost) || cost < 0) fail("Unit cost must be a number", 4);
      if (!get(r, "supplier").trim()) problems.push("Supplier is missing");
      rows.push({
        row: rowNo,
        cells: [
          String(rowNo),
          get(r, "date") || "Today",
          "label" in size ? size.label : get(r, "item"),
          get(r, "quantity") || "Empty",
          get(r, "unitCost") || "Empty",
        ],
        bad,
        problem: problems[0] ?? "",
      });
      if (problems.length) errors.push({ row: rowNo, message: problems.join("; ") });
      else {
        units += qty!;
        money += qty! * Math.round(cost!);
        ready.push({
          row: rowNo,
          date,
          supplier: get(r, "supplier").trim(),
          variantId: (size as { id: string }).id,
          quantity: qty,
          unitCost: Math.round(cost!),
          paid: paid && !Number.isNaN(paid) ? Math.round(paid) : 0,
          reference: get(r, "reference").trim(),
          notes: get(r, "notes").trim(),
        });
      }
    } else if (kind === "movements") {
      const size = matchSize(get(r, "item"), ctx.sizes);
      const change = parseNumber(get(r, "change").replace(/^−/, "-"));
      const count = parseNumber(get(r, "count"));
      if ("error" in size) fail(size.error, 1);
      let mode: "add" | "remove" | "set" | null = null;
      let qty = 0;
      if (count !== null && !Number.isNaN(count) && count >= 0) {
        mode = "set";
        qty = Math.round(count);
      } else if (change !== null && !Number.isNaN(change) && change !== 0) {
        mode = change > 0 ? "add" : "remove";
        qty = Math.abs(Math.round(change));
      } else {
        problems.push(
          count !== null || change !== null
            ? "Change or count must be a number"
            : "Change or count is missing",
        );
        bad.push(2);
      }
      rows.push({
        row: rowNo,
        cells: [
          String(rowNo),
          "label" in size ? size.label : get(r, "item"),
          mode === "set"
            ? `Count ${qty}`
            : mode
              ? `${mode === "add" ? "+" : "−"}${qty}`
              : get(r, "change") || get(r, "count") || "Empty",
          get(r, "reason") || "Recount",
        ],
        bad,
        problem: problems[0] ?? "",
      });
      if (problems.length) errors.push({ row: rowNo, message: problems.join("; ") });
      else {
        units += mode === "set" ? 0 : qty;
        ready.push({
          row: rowNo,
          variantId: (size as { id: string }).id,
          mode,
          quantity: qty,
          reason: get(r, "reason").trim() || "Recount",
          note: get(r, "note").trim(),
        });
      }
    } else {
      const name = get(r, "name").trim();
      const sizeLabel = get(r, "size").trim();
      const sku = get(r, "sku").trim().toUpperCase();
      const price = parseNumber(get(r, "price"));
      const compare = parseNumber(get(r, "compare"));
      const stock = parseNumber(get(r, "stock"));
      if (!name) fail("Product name is missing", 1);
      if (!sizeLabel) fail("Size is missing", 2);
      if (!sku) fail("SKU is missing", 3);
      else if (skusSeen.has(sku)) fail("SKU appears twice in the file", 3);
      skusSeen.add(sku);
      if (price === null || Number.isNaN(price) || price <= 0)
        fail(price === null ? "Price is missing" : "Price must be a number", 4);
      if (compare !== null && Number.isNaN(compare))
        problems.push("Compare-at price must be a number");
      if (stock !== null && (Number.isNaN(stock) || stock < 0))
        problems.push("Opening stock must be a number");
      rows.push({
        row: rowNo,
        cells: [
          String(rowNo),
          name || "Empty",
          sizeLabel || "Empty",
          sku || "Empty",
          get(r, "price") || "Empty",
        ],
        bad,
        problem: problems[0] ?? "",
      });
      if (problems.length) errors.push({ row: rowNo, message: problems.join("; ") });
      else {
        units += stock && !Number.isNaN(stock) ? Math.round(stock) : 0;
        const status = /^(active|yes|true|published|1)$/i.test(get(r, "status").trim())
          ? "active"
          : "draft";
        ready.push({
          row: rowNo,
          name,
          size: sizeLabel,
          sku,
          price: Math.round(price!),
          compare: compare && !Number.isNaN(compare) ? Math.round(compare) : null,
          stock: stock && !Number.isNaN(stock) ? Math.round(stock) : 0,
          category: get(r, "category").trim(),
          tagline: get(r, "tagline").trim(),
          description: get(r, "description").trim(),
          status,
        });
      }
    }
  });

  const columns =
    kind === "purchases"
      ? ["Row", "Date", "Product and size", "Qty", "Unit cost", "Problem"]
      : kind === "movements"
        ? ["Row", "Product and size", "Change", "Reason", "Problem"]
        : ["Row", "Product", "Size", "SKU", "Price", "Problem"];

  let summary = "";
  if (kind === "purchases") {
    const groups = new Set(
      ready.map((x) => `${x.date}|${String(x.supplier).toLowerCase()}|${x.reference}`),
    ).size;
    summary = `This adds ${units.toLocaleString("en-US")} units to stock and Rs ${money.toLocaleString("en-US")} to purchases (${groups} ${groups === 1 ? "purchase" : "purchases"}).`;
  } else if (kind === "movements") {
    summary = `This changes stock for ${ready.length} ${ready.length === 1 ? "size" : "sizes"}. Each change is logged as an adjustment.`;
  } else {
    const products = new Set(ready.map((x) => String(x.name).toLowerCase())).size;
    summary = `This adds or updates ${ready.length} ${ready.length === 1 ? "size" : "sizes"} across ${products} ${products === 1 ? "product" : "products"}. New products are saved as drafts unless the status says active.`;
  }
  const grid =
    kind === "purchases"
      ? "50px 100px 1.6fr 70px 100px 1.4fr"
      : kind === "movements"
        ? "50px 1.6fr 100px 110px 1.4fr"
        : "50px 1.4fr 80px 1fr 80px 1.4fr";
  return { columns, grid, rows, ready, errors, summary };
}
