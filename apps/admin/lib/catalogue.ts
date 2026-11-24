import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ImageAsset, ProductForm } from "./catalogue-shared";
import { cleanSearch } from "./orders";

export interface VariantRow {
  id: string;
  product_id: string;
  sku: string;
  label: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  reserved: number;
  unit_cost: number | null;
  weight_grams: number | null;
  shipping_weight_grams: number | null;
  tag: string | null;
  is_default: boolean;
  sort_order: number;
}

export interface ProductRow {
  id: string;
  slug: string;
  status: "active" | "draft";
  name: string;
  short_name: string | null;
  tagline: string;
  description: string[];
  botanical_name: string | null;
  origin: string;
  category_id: string;
  images: ImageAsset[];
  purchase_mode: "retail" | "quote";
  badge: { label: string; tone: ProductForm["badgeTone"] } | null;
  highlights: string[];
  ways_to_enjoy: string[];
  how_to_use: { title: string; description: string }[];
  attributes: { label: string; value: string }[];
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  popularity_rank: number;
  related_product_ids: string[];
  vendor: string;
  tags: string[];
  seo: { title?: string; description?: string } | null;
  created_at: string;
  updated_at: string;
  variants: VariantRow[];
}

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  description: string;
  image: ImageAsset | null;
  sort_order: number;
  status: "active" | "draft";
  seo: { title?: string; description?: string } | null;
  /** Page text below the products, one string per paragraph (20261126000100_category_content). */
  content?: string[] | null;
  faqs?: { question: string; answer: string }[] | null;
}

export const PRODUCT_COLUMNS = "*, variants:product_variants(*)";

export type ProductSort = "rank" | "name" | "new" | "stock";
export const PRODUCT_SORTS: { value: ProductSort; label: string }[] = [
  { value: "rank", label: "Store order (best sellers first)" },
  { value: "name", label: "Name, A to Z" },
  { value: "new", label: "Newest first" },
  { value: "stock", label: "Lowest stock first" },
];

export interface ProductFilters {
  q: string;
  category: string;
  status: "" | "active" | "draft" | "out";
  sort: ProductSort;
}

export function parseProductFilters(
  sp: Record<string, string | string[] | undefined>,
): ProductFilters {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };
  const status = one("status");
  const sort = one("sort");
  return {
    q: cleanSearch(one("q")),
    category: one("category").slice(0, 80),
    status: (["active", "draft", "out"] as const).includes(status as "active")
      ? (status as ProductFilters["status"])
      : "",
    sort: PRODUCT_SORTS.some((s) => s.value === sort) ? (sort as ProductSort) : "rank",
  };
}

export const onHand = (p: Pick<ProductRow, "variants">) =>
  p.variants.reduce((s, v) => s + v.stock, 0);

/** All products with sizes and categories. The catalogue is small, so filtering is done here. */
export async function loadCatalogue() {
  const supabase = await createClient();
  const [products, categories] = await Promise.all([
    supabase.from("products").select(PRODUCT_COLUMNS).order("popularity_rank").order("name"),
    supabase.from("categories").select("*").order("sort_order").order("name"),
  ]);
  const list = ((products.data ?? []) as ProductRow[]).map((p) => ({
    ...p,
    variants: [...p.variants].sort((a, b) => a.sort_order - b.sort_order),
  }));
  return { products: list, categories: (categories.data ?? []) as CategoryRow[] };
}

export function filterProducts(products: ProductRow[], f: ProductFilters) {
  const q = f.q.toLowerCase();
  const out = products.filter((p) => {
    if (f.category && p.category_id !== f.category) return false;
    if (f.status === "active" && p.status !== "active") return false;
    if (f.status === "draft" && p.status !== "draft") return false;
    if (f.status === "out" && !p.variants.some((v) => v.stock - v.reserved <= 0)) return false;
    if (q && !`${p.name} ${p.variants.map((v) => v.sku).join(" ")}`.toLowerCase().includes(q))
      return false;
    return true;
  });
  const sorted = [...out];
  if (f.sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
  if (f.sort === "new") sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (f.sort === "stock") sorted.sort((a, b) => onHand(a) - onHand(b));
  return sorted;
}

export async function loadProduct(id: string): Promise<ProductRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const p = data as ProductRow;
  return { ...p, variants: [...p.variants].sort((a, b) => a.sort_order - b.sort_order) };
}

/** "NN-TEA · 50g, 100g, 200g" */
export function skuSummary(p: ProductRow): string {
  const prefix = (() => {
    const skus = p.variants.map((v) => v.sku);
    if (skus.length === 0) return "";
    const parts = skus[0]!.split("-");
    for (let n = parts.length - 1; n > 0; n--) {
      const candidate = parts.slice(0, n).join("-");
      if (skus.every((s) => s.startsWith(`${candidate}-`)))
        return candidate.split("-").slice(0, 2).join("-");
    }
    return skus[0]!;
  })();
  const sizes = p.variants.map((v) => v.label).join(", ");
  return [prefix, sizes].filter(Boolean).join(" · ") || "No sizes yet";
}

/** Product row -> editor form. */
export function toForm(p: ProductRow | null, categories: CategoryRow[]): ProductForm {
  if (!p) {
    return {
      id: crypto.randomUUID(),
      isNew: true,
      name: "",
      description: "",
      images: [],
      status: "draft",
      categoryId: categories[0]?.id ?? "",
      vendor: "North Nectar",
      tags: "",
      variants: [
        {
          id: "",
          key: crypto.randomUUID(),
          label: "",
          price: "",
          compare: "",
          sku: "",
          stock: "0",
          loadedStock: null,
          weight: "",
          tag: "",
          isDefault: true,
          reserved: 0,
        },
      ],
      slug: "",
      metaTitle: "",
      metaDescription: "",
      shortName: "",
      tagline: "",
      botanicalName: "",
      origin: "",
      purchaseMode: "retail",
      badgeLabel: "",
      badgeTone: "green",
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: false,
      popularityRank: "999",
      highlights: "",
      waysToEnjoy: "",
      howToUse: [],
      attributes: [],
      relatedIds: [],
    };
  }
  const fmt = (n: number | null) =>
    n === null || n === undefined ? "" : n.toLocaleString("en-US");
  return {
    id: p.id,
    isNew: false,
    name: p.name,
    description: p.description.join("\n\n"),
    images: p.images ?? [],
    status: p.status,
    categoryId: p.category_id,
    vendor: p.vendor,
    tags: p.tags.join(", "),
    variants: p.variants.map((v) => ({
      id: v.id,
      key: v.id,
      label: v.label,
      price: fmt(v.price),
      compare: fmt(v.compare_at_price),
      sku: v.sku,
      stock: String(v.stock),
      loadedStock: v.stock,
      weight: v.shipping_weight_grams ? `${v.shipping_weight_grams} g` : "",
      tag: v.tag ?? "",
      isDefault: v.is_default,
      reserved: v.reserved,
    })),
    slug: p.slug,
    metaTitle: p.seo?.title ?? "",
    metaDescription: p.seo?.description ?? "",
    shortName: p.short_name ?? "",
    tagline: p.tagline,
    botanicalName: p.botanical_name ?? "",
    origin: p.origin,
    purchaseMode: p.purchase_mode,
    badgeLabel: p.badge?.label ?? "",
    badgeTone: p.badge?.tone ?? "green",
    isFeatured: p.is_featured,
    isBestSeller: p.is_best_seller,
    isNewArrival: p.is_new_arrival,
    popularityRank: String(p.popularity_rank),
    highlights: p.highlights.join("\n"),
    waysToEnjoy: p.ways_to_enjoy.join("\n"),
    howToUse: p.how_to_use ?? [],
    attributes: p.attributes ?? [],
    relatedIds: p.related_product_ids,
  };
}
