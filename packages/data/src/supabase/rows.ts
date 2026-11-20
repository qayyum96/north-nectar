/**
 * Row shapes of the Supabase tables the catalogue reads (snake_case, as stored).
 * Kept by hand next to the migrations in supabase/migrations.
 */
export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  description: string;
  image: Record<string, unknown> | null;
  sort_order: number;
  status: "active" | "draft";
  seo: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface VariantRow {
  id: string;
  product_id: string;
  sku: string;
  label: string;
  weight_grams: number | null;
  shipping_weight_grams: number | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  reserved: number;
  reorder_at: number;
  unit_cost: number | null;
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
  images: unknown[];
  illustration: Record<string, unknown> | null;
  purchase_mode: "retail" | "quote";
  badge: Record<string, unknown> | null;
  highlights: string[];
  ways_to_enjoy: string[];
  how_to_use: unknown[];
  attributes: unknown[];
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  popularity_rank: number;
  related_product_ids: string[];
  vendor: string;
  tags: string[];
  seo: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  product_variants?: VariantRow[];
}
