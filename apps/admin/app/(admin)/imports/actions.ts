"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { loadProduct } from "@/lib/catalogue";
import { slugify } from "@/lib/catalogue-shared";
import type { CatalogSize } from "@/lib/import-kinds";
import { loadStock } from "@/lib/inventory";
import { revalidateStorefront } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";

/** Sizes and categories the wizard matches against. */
export async function importContext(): Promise<{
  sizes: CatalogSize[];
  categories: string[];
  today: string;
}> {
  await requireStaff(["owner", "manager"]);
  const supabase = await createClient();
  const [stock, cats] = await Promise.all([
    loadStock(supabase),
    supabase.from("categories").select("name").order("name"),
  ]);
  return {
    sizes: stock.map((r) => ({
      id: r.id,
      sku: r.sku,
      product: r.product,
      short: r.productShort,
      label: r.label,
    })),
    categories: ((cats.data ?? []) as { name: string }[]).map((c) => c.name),
    today: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date()),
  };
}

const purchaseRow = z.object({
  row: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  supplier: z.string().min(1).max(80),
  variantId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitCost: z.number().int().min(0),
  paid: z.number().int().min(0),
  reference: z.string().max(60),
  notes: z.string().max(500),
});
const movementRow = z.object({
  row: z.number(),
  variantId: z.string().min(1),
  mode: z.enum(["add", "remove", "set"]),
  quantity: z.number().int().min(0),
  reason: z.string().max(40),
  note: z.string().max(500),
});
const productRow = z.object({
  row: z.number(),
  name: z.string().min(1).max(160),
  size: z.string().min(1).max(40),
  sku: z.string().min(1).max(60),
  price: z.number().int().positive(),
  compare: z.number().int().nullable(),
  stock: z.number().int().min(0),
  category: z.string().max(80),
  tagline: z.string().max(200),
  description: z.string().max(4000),
  status: z.enum(["active", "draft"]),
});

const input = z.object({
  kind: z.enum(["products", "purchases", "movements"]),
  fileName: z.string().min(1).max(200),
  fileSize: z.number().int().min(0),
  totalRows: z.number().int().min(0),
  errors: z.array(z.object({ row: z.number(), message: z.string().max(300) })).max(5000),
  rows: z.array(z.record(z.string(), z.unknown())).min(1).max(5000),
});

export type ImportInput = z.input<typeof input>;
export type ImportResult = { ok: true; id: string; message: string } | { ok: false; error: string };

export async function runImport(raw: ImportInput): Promise<ImportResult> {
  const staff = await requireStaff(["owner", "manager"]);
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "The file couldn't be read. Please try again." };
  const v = parsed.data;
  const supabase = await createClient();
  const errors = [...v.errors];

  const { data: imp, error: impErr } = await supabase
    .from("imports")
    .insert({
      kind: v.kind,
      file_name: v.fileName,
      file_size: v.fileSize,
      total_rows: v.totalRows,
      imported_rows: 0,
      status: "completed",
      errors,
      actor_id: staff.userId,
      actor_name: staff.name.split(" ")[0],
    })
    .select("id")
    .single<{ id: string }>();
  if (impErr || !imp) return { ok: false, error: "The import couldn't start. Please try again." };

  let imported = 0;
  let summary = "";
  try {
    if (v.kind === "purchases") {
      const rows = z.array(purchaseRow).parse(v.rows);
      // Suppliers by name (created when new).
      const { data: existing } = await supabase.from("suppliers").select("id, name");
      const byName = new Map(
        ((existing ?? []) as { id: string; name: string }[]).map((s) => [
          s.name.toLowerCase(),
          s.id,
        ]),
      );
      for (const name of new Set(rows.map((r) => r.supplier))) {
        if (byName.has(name.toLowerCase())) continue;
        const { data } = await supabase
          .from("suppliers")
          .insert({ name })
          .select("id")
          .single<{ id: string }>();
        if (data) byName.set(name.toLowerCase(), data.id);
      }
      // One purchase per supplier, date and bill number.
      const groups = new Map<string, typeof rows>();
      for (const r of rows) {
        const k = `${r.date}|${r.supplier.toLowerCase()}|${r.reference}`;
        groups.set(k, [...(groups.get(k) ?? []), r]);
      }
      let units = 0;
      for (const g of groups.values()) {
        const first = g[0]!;
        const { error } = await supabase.rpc("admin_record_purchase", {
          p: {
            supplier_id: byName.get(first.supplier.toLowerCase()),
            purchase_date: first.date,
            reference: first.reference,
            amount_paid: g.reduce((s, r) => s + r.paid, 0),
            notes: [...new Set(g.map((r) => r.notes).filter(Boolean))].join("; "),
            import_id: imp.id,
            lines: g.map((r) => ({
              variant_id: r.variantId,
              quantity: r.quantity,
              unit_cost: r.unitCost,
            })),
          },
        });
        if (error) g.forEach((r) => errors.push({ row: r.row, message: "Couldn't be saved" }));
        else {
          imported += g.length;
          units += g.reduce((s, r) => s + r.quantity, 0);
        }
      }
      summary = `${groups.size} purchases · ${units.toLocaleString("en-US")} units added`;
    } else if (v.kind === "movements") {
      const rows = z.array(movementRow).parse(v.rows);
      for (const r of rows) {
        const { error } = await supabase.rpc("admin_adjust_stock", {
          p_variant: r.variantId,
          p_mode: r.mode,
          p_quantity: r.quantity,
          p_reason: r.reason,
          p_note: r.note,
          p_reorder_at: null,
          p_unit_cost: null,
          p_import: imp.id,
        });
        if (error) {
          const reserved = /BELOW_RESERVED:(\d+)/.exec(error.message);
          errors.push({
            row: r.row,
            message: reserved
              ? `Stock can't go below ${reserved[1]} (held by open orders)`
              : error.message.includes("NOT_ENOUGH_STOCK")
                ? "Removes more than is on hand"
                : "Couldn't be saved",
          });
        } else imported++;
      }
      summary = `${imported} stock changes`;
    } else {
      const rows = z.array(productRow).parse(v.rows);
      const [{ data: cats }, { data: prods }, { data: skus }] = await Promise.all([
        supabase.from("categories").select("id, name"),
        supabase.from("products").select("id, name, slug"),
        supabase.from("product_variants").select("id, sku, product_id"),
      ]);
      const catByName = new Map(
        ((cats ?? []) as { id: string; name: string }[]).map((c) => [c.name.toLowerCase(), c.id]),
      );
      const firstCat = ((cats ?? []) as { id: string }[])[0]?.id;
      const prodByName = new Map(
        ((prods ?? []) as { id: string; name: string }[]).map((p) => [p.name.toLowerCase(), p.id]),
      );
      const slugs = new Set(((prods ?? []) as { slug: string }[]).map((p) => p.slug));
      const skuOwner = new Map(
        ((skus ?? []) as { sku: string; product_id: string }[]).map((s) => [
          s.sku.toUpperCase(),
          s.product_id,
        ]),
      );
      const groups = new Map<string, typeof rows>();
      for (const r of rows)
        groups.set(r.name.toLowerCase(), [...(groups.get(r.name.toLowerCase()) ?? []), r]);
      let created = 0;
      let updated = 0;
      for (const [key, g] of groups) {
        const first = g[0]!;
        const existingId = prodByName.get(key) ?? g.map((r) => skuOwner.get(r.sku)).find(Boolean);
        const existing = existingId ? await loadProduct(existingId) : null;
        const fail = (message: string) => g.forEach((r) => errors.push({ row: r.row, message }));
        if (g.some((r) => skuOwner.has(r.sku) && skuOwner.get(r.sku) !== existingId)) {
          fail("SKU belongs to a different product");
          continue;
        }
        const categoryId =
          catByName.get(first.category.toLowerCase()) ?? existing?.category_id ?? firstCat;
        if (!categoryId) {
          fail("Create a category first");
          continue;
        }
        let payload: Record<string, unknown>;
        if (existing) {
          const variants = existing.variants.map((ev) => {
            const r = g.find((x) => x.sku === ev.sku.toUpperCase());
            // Prices only: stock is left as it is in the database right now.
            return {
              ...ev,
              expected_stock: ev.stock,
              ...(r ? { price: r.price, compare_at_price: r.compare } : {}),
            };
          });
          for (const r of g) {
            if (!existing.variants.some((ev) => ev.sku.toUpperCase() === r.sku)) {
              variants.push({
                id: null as unknown as string,
                label: r.size,
                sku: r.sku,
                price: r.price,
                compare_at_price: r.compare,
                stock: r.stock,
              } as never);
            }
          }
          payload = { ...existing, variants };
          updated++;
        } else {
          let slug = slugify(first.name) || `product-${Date.now()}`;
          for (let n = 2; slugs.has(slug); n++) slug = `${slugify(first.name)}-${n}`;
          slugs.add(slug);
          payload = {
            slug,
            status: g.some((r) => r.status === "active") ? "active" : "draft",
            name: first.name,
            tagline: g.find((r) => r.tagline)?.tagline ?? "",
            description: (g.find((r) => r.description)?.description ?? "")
              .split(/\n\s*\n/)
              .filter(Boolean),
            category_id: categoryId,
            images: [],
            variants: g.map((r, i) => ({
              label: r.size,
              sku: r.sku,
              price: r.price,
              compare_at_price: r.compare,
              stock: r.stock,
              is_default: i === 0,
            })),
          };
          created++;
        }
        const { error } = await supabase.rpc("admin_save_product", { p: payload });
        if (error) {
          fail(
            error.message.includes("SKU_TAKEN")
              ? "SKU already used by another product"
              : "Couldn't be saved",
          );
          if (existing) updated--;
          else created--;
        } else imported += g.length;
      }
      summary = `${created} new products, ${updated} updated`;
    }
  } catch (e) {
    console.error("[import]", e);
    await supabase
      .from("imports")
      .update({
        status: "failed",
        imported_rows: imported,
        errors,
        summary: "The import stopped unexpectedly",
      })
      .eq("id", imp.id);
    return { ok: false, error: "The import stopped part way. Check Import history." };
  }

  await supabase
    .from("imports")
    .update({
      imported_rows: imported,
      status: imported === 0 ? "failed" : errors.length ? "completed_with_errors" : "completed",
      errors,
      summary,
    })
    .eq("id", imp.id);
  for (const p of ["/imports", "/stock", "/movements", "/purchases", "/suppliers", "/products"])
    revalidatePath(p);
  revalidatePath("/", "layout");
  await revalidateStorefront();
  return imported === 0
    ? { ok: false, error: "Nothing could be imported. See Import history for the reasons." }
    : { ok: true, id: imp.id, message: `Imported ${imported} of ${v.totalRows} rows · ${summary}` };
}

export async function undoImport(id: string): Promise<ImportResult> {
  await requireStaff(["owner", "manager"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_undo_import", { p_import: id });
  if (error) {
    if (error.message.includes("STOCK_ALREADY_USED"))
      return {
        ok: false,
        error: "Some of these units were already sold or adjusted, so the import can't be undone.",
      };
    if (error.message.includes("CANNOT_UNDO_PRODUCTS"))
      return { ok: false, error: "Product imports can't be undone; edit the products instead." };
    return { ok: false, error: "The import couldn't be undone." };
  }
  for (const p of ["/imports", "/stock", "/movements", "/purchases", "/suppliers", "/products"])
    revalidatePath(p);
  await revalidateStorefront();
  return { ok: true, id, message: "Import undone" };
}
