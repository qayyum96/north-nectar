"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { loadProduct, storagePath } from "@/lib/catalogue";
import {
  type ProductForm,
  gramsFromLabel,
  lines,
  parseAmount,
  slugify,
} from "@/lib/catalogue-shared";
import { revalidateStorefront } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";

export type SaveResult =
  | { ok: true; id: string; message: string; refreshed: boolean }
  | { ok: false; error: string; problems?: string[]; fields?: Record<string, string> };

const EDITORS = ["owner", "manager"] as const;

/** Checks the form like the mockup's error state: a summary sentence plus a message per field. */
function validate(f: ProductForm) {
  const problems: string[] = [];
  const fields: Record<string, string> = {};
  const add = (key: string, field: string, summary: string) => {
    fields[key] ??= field;
    problems.push(summary);
  };
  if (!f.name.trim())
    add("name", "Add a title so customers know what this is", "Add a product title.");
  if (!f.categoryId) add("categoryId", "Choose a category", "Choose a category.");
  const slug = f.slug.trim() || slugify(f.name);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))
    add("slug", "Use lowercase letters, numbers and hyphens", "Fix the URL slug.");
  if (f.variants.length === 0) add("variants", "Add at least one size", "Add at least one size.");
  const skus = new Map<string, number>();
  f.variants.forEach((v, i) => {
    const name = v.label.trim() || `size ${i + 1}`;
    if (!v.label.trim())
      add(`variants.${i}.label`, "Add a size", `Add a size name for row ${i + 1}.`);
    const price = parseAmount(v.price);
    if (f.purchaseMode === "retail" && (price === null || price <= 0))
      add(`variants.${i}.price`, "Add a price", `Add a price for the ${name} variant.`);
    else if (Number.isNaN(price))
      add(`variants.${i}.price`, "Numbers only", `Fix the price for ${name}.`);
    const compare = parseAmount(v.compare);
    if (Number.isNaN(compare))
      add(`variants.${i}.compare`, "Numbers only", `Fix the compare-at price for ${name}.`);
    else if (compare !== null && price !== null && compare <= price)
      add(
        `variants.${i}.compare`,
        "Higher than the price",
        `The compare-at price for ${name} must be higher than its price.`,
      );
    const sku = v.sku.trim().toUpperCase();
    if (!sku) add(`variants.${i}.sku`, "Add a SKU", `Add a SKU for the ${name} variant.`);
    else if (skus.has(sku)) add(`variants.${i}.sku`, "Used twice", `SKU ${sku} is used twice.`);
    skus.set(sku, i);
    const stock = Number(v.stock || "0");
    if (!Number.isInteger(stock) || stock < 0)
      add(`variants.${i}.stock`, "Whole number", `Fix the stock for ${name}.`);
    else if (stock < v.reserved)
      add(
        `variants.${i}.stock`,
        `At least ${v.reserved}`,
        `${name} has ${v.reserved} units in open orders, so stock can't be lower.`,
      );
  });
  if (f.status === "active" && f.images.length === 0)
    add("images", "Add at least one image", "Add at least one image before making it active.");
  return { problems, fields, slug };
}

function payload(f: ProductForm, slug: string) {
  const badge = f.badgeLabel.trim() ? { label: f.badgeLabel.trim(), tone: f.badgeTone } : null;
  const seo =
    f.metaTitle.trim() || f.metaDescription.trim()
      ? {
          ...(f.metaTitle.trim() ? { title: f.metaTitle.trim() } : {}),
          ...(f.metaDescription.trim() ? { description: f.metaDescription.trim() } : {}),
        }
      : null;
  return {
    id: f.id,
    slug,
    status: f.status,
    name: f.name.trim(),
    short_name: f.shortName.trim(),
    tagline: f.tagline.trim(),
    description: f.description
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean),
    botanical_name: f.botanicalName.trim(),
    origin: f.origin.trim(),
    category_id: f.categoryId,
    images: f.images.map((img, i) => ({
      ...img,
      alt: img.alt?.trim() || `${f.name.trim()}${i ? ` (${i + 1})` : ""}`,
    })),
    purchase_mode: f.purchaseMode,
    badge,
    highlights: lines(f.highlights),
    ways_to_enjoy: lines(f.waysToEnjoy),
    how_to_use: f.howToUse
      .map((s) => ({ title: s.title.trim(), description: s.description.trim() }))
      .filter((s) => s.title || s.description),
    attributes: f.attributes
      .map((a) => ({ label: a.label.trim(), value: a.value.trim() }))
      .filter((a) => a.label && a.value),
    is_featured: f.isFeatured,
    is_best_seller: f.isBestSeller,
    is_new_arrival: f.isNewArrival,
    popularity_rank: Math.max(0, Math.min(9999, Number.parseInt(f.popularityRank, 10) || 999)),
    related_product_ids: f.relatedIds.filter((id) => id !== f.id).slice(0, 8),
    vendor: f.vendor.trim(),
    tags: f.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20),
    seo,
    variants: f.variants.map((v, i) => ({
      id: v.id || null,
      label: v.label.trim(),
      sku: v.sku.trim().toUpperCase(),
      price: parseAmount(v.price) ?? 0,
      compare_at_price: parseAmount(v.compare),
      stock: Number(v.stock || "0"),
      expected_stock: v.loadedStock,
      weight_grams: gramsFromLabel(v.label),
      shipping_weight_grams: parseAmount(v.weight.replace(/g$/i, "")),
      tag: v.tag.trim(),
      is_default: f.variants.some((x) => x.isDefault) ? v.isDefault : i === 0,
    })),
  };
}

function friendly(message: string): string {
  if (message.includes("SLUG_TAKEN")) return "Another product already uses this URL slug.";
  const sku = /SKU_TAKEN:([^\s"]+)/.exec(message);
  if (sku) return `SKU ${sku[1]} is already used by another product.`;
  if (message.includes("SIZE_IN_OPEN_ORDERS"))
    return "A size you removed is in open orders. Finish or cancel those orders first.";
  if (message.includes("STOCK_CHANGED"))
    return "Stock for a size changed while you were editing (an order or purchase). Reload the page to see the new count, then save again.";
  if (message.includes("STOCK_BELOW_RESERVED"))
    return "Stock can't be lower than the units in open orders.";
  if (message.includes("NOT_ALLOWED")) return "Only owners and managers can edit products.";
  return "The product couldn't be saved. Please try again.";
}

async function afterChange(id?: string) {
  revalidatePath("/products");
  if (id) revalidatePath(`/products/${id}`);
  revalidatePath("/categories");
  revalidatePath("/", "layout");
  return revalidateStorefront();
}

export async function saveProduct(form: ProductForm): Promise<SaveResult> {
  await requireStaff([...EDITORS]);
  const { problems, fields, slug } = validate(form);
  if (problems.length) {
    return {
      ok: false,
      error: `There ${problems.length === 1 ? "is 1 problem" : `are ${problems.length} problems`} with this product`,
      problems,
      fields,
    };
  }
  const supabase = await createClient();
  const before = form.isNew ? null : await loadProduct(form.id);
  const { data, error } = await supabase.rpc("admin_save_product", { p: payload(form, slug) });
  if (error) return { ok: false, error: friendly(error.message) };
  const id = data as string;

  // Remove uploaded files that are no longer used by this product.
  if (before) {
    const kept = new Set(form.images.map((i) => i.src));
    const gone = before.images
      .filter((i) => !kept.has(i.src))
      .map((i) => storagePath(i.src))
      .filter((p): p is string => !!p && p.startsWith(`products/${id}/`));
    if (gone.length) await supabase.storage.from("catalog").remove(gone);
  }
  const refreshed = await afterChange(id);
  return { ok: true, id, message: form.isNew ? "Product created" : "Product saved", refreshed };
}

/** Copy as a draft: new slug and SKUs, no stock, images copied to the new product's folder. */
export async function duplicateProduct(id: string): Promise<SaveResult> {
  await requireStaff([...EDITORS]);
  const p = await loadProduct(id);
  if (!p) return { ok: false, error: "That product no longer exists." };
  const supabase = await createClient();
  const newId = crypto.randomUUID();

  const [{ data: slugs }, { data: skus }] = await Promise.all([
    supabase.from("products").select("slug").like("slug", `${p.slug}-copy%`),
    supabase.from("product_variants").select("sku").like("sku", "%-COPY%"),
  ]);
  const taken = new Set(((slugs ?? []) as { slug: string }[]).map((s) => s.slug));
  let slug = `${p.slug}-copy`;
  for (let n = 2; taken.has(slug); n++) slug = `${p.slug}-copy-${n}`;
  const takenSku = new Set(((skus ?? []) as { sku: string }[]).map((s) => s.sku));
  const copySku = (sku: string) => {
    let s = `${sku}-COPY`;
    for (let n = 2; takenSku.has(s); n++) s = `${sku}-COPY${n}`;
    takenSku.add(s);
    return s;
  };

  const images = [];
  for (const img of p.images) {
    const from = storagePath(img.src);
    if (!from) {
      images.push(img);
      continue;
    }
    const to = `products/${newId}/${crypto.randomUUID()}.webp`;
    const { error } = await supabase.storage.from("catalog").copy(from, to);
    images.push(
      error
        ? img
        : { ...img, src: supabase.storage.from("catalog").getPublicUrl(to).data.publicUrl },
    );
  }

  const { error } = await supabase.rpc("admin_save_product", {
    p: {
      ...p,
      id: newId,
      slug,
      status: "draft",
      name: `${p.name} (copy)`,
      images,
      variants: p.variants.map((v) => ({ ...v, id: null, sku: copySku(v.sku), stock: 0 })),
    },
  });
  if (error) return { ok: false, error: friendly(error.message) };
  await afterChange();
  return { ok: true, id: newId, message: "Product duplicated as a draft", refreshed: false };
}

export async function deleteProduct(
  id: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  await requireStaff([...EDITORS]);
  const p = await loadProduct(id);
  if (!p) return { ok: false, error: "That product no longer exists." };
  if (p.variants.some((v) => v.reserved > 0)) {
    return {
      ok: false,
      error:
        "This product is in open orders. Set it to Draft instead, or finish those orders first.",
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: "The product couldn't be deleted. Please try again." };
  const { data: files } = await supabase.storage
    .from("catalog")
    .list(`products/${id}`, { limit: 100 });
  if (files?.length)
    await supabase.storage.from("catalog").remove(files.map((f) => `products/${id}/${f.name}`));
  await afterChange();
  return { ok: true, message: `${p.name} deleted` };
}
