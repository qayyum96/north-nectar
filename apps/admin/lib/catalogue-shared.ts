/** Catalogue helpers used by both the server and the editor in the browser. */

export interface ImageAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
  background?: string;
}

export interface VariantForm {
  /** Database id; empty for a size added in the editor. */
  id: string;
  /** Stable React key. */
  key: string;
  label: string;
  price: string;
  compare: string;
  sku: string;
  stock: string;
  /** Stock when the editor loaded (null for a new size); the database refuses the save if it moved. */
  loadedStock: number | null;
  /** Shipping weight in grams (with packaging). */
  weight: string;
  tag: string;
  isDefault: boolean;
  /** Units held by open orders (stock can't go below this). */
  reserved: number;
}

export interface ProductForm {
  id: string;
  isNew: boolean;
  name: string;
  /** Paragraphs separated by a blank line. */
  description: string;
  images: ImageAsset[];
  status: "active" | "draft";
  categoryId: string;
  vendor: string;
  tags: string;
  variants: VariantForm[];
  slug: string;
  metaTitle: string;
  metaDescription: string;
  // Website details
  shortName: string;
  tagline: string;
  botanicalName: string;
  origin: string;
  purchaseMode: "retail" | "quote";
  badgeLabel: string;
  badgeTone: "green" | "orange" | "kraft" | "dark";
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  popularityRank: string;
  highlights: string;
  waysToEnjoy: string;
  howToUse: { title: string; description: string }[];
  attributes: { label: string; value: string }[];
  relatedIds: string[];
}

export const BADGE_TONES = [
  { value: "green", label: "Green" },
  { value: "orange", label: "Orange" },
  { value: "kraft", label: "Kraft" },
  { value: "dark", label: "Dark" },
] as const;

/** "Hunza Herbal Tea, Wild Thyme" -> "hunza-herbal-tea-wild-thyme" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Net weight from a size label: "100g" -> 100, "1kg" -> 1000, "Bulk 25kg" -> 25000, else null. */
export function gramsFromLabel(label: string): number | null {
  const m = /(\d+(?:\.\d+)?)\s*(kg|g)\b/i.exec(label);
  if (!m) return null;
  const n = Number(m[1]);
  return Math.round(m[2]!.toLowerCase() === "kg" ? n * 1000 : n);
}

/** "1,150" -> 1150; "" -> null. */
export function parseAmount(v: string): number | null {
  const clean = v.replace(/[,\s]/g, "").replace(/^rs\.?/i, "");
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) ? Math.round(n) : NaN;
}

export const META_TITLE_MAX = 60;
export const META_DESCRIPTION_MAX = 160;

const strip = (t: string) =>
  t
    .replace(/\[([^\]\n]+)\]\([^)\s]+\)/g, "$1")
    .replace(/\*\*|__|\*/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

export function defaultMetaTitle(name: string): string {
  return name ? `${name} | North Nectar` : "";
}

export function defaultMetaDescription(form: Pick<ProductForm, "tagline" | "description">): string {
  const first = strip(form.description.split(/\n\s*\n/)[0] ?? "");
  const text = [form.tagline.trim(), first].filter(Boolean).join(" ");
  if (text.length <= META_DESCRIPTION_MAX) return text;
  return `${text.slice(0, META_DESCRIPTION_MAX - 1).replace(/\s+\S*$/, "")}…`;
}

export function lines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
