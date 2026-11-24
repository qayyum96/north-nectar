import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ImageAsset } from "@northnectar/types";
import { cache } from "react";

/** A published article (table public.posts, written in the admin under Blog). */
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** One string per block; "## " / "### " blocks are headings, the rest are rich paragraphs. */
  body: string[];
  coverImage: ImageAsset | null;
  relatedProducts: string[];
  author: string;
  publishedAt: string;
  updatedAt: string;
  seo: { title?: string; description?: string } | null;
}

interface PostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string[] | null;
  cover_image: ImageAsset | null;
  related_products: string[] | null;
  author: string;
  published_at: string;
  updated_at: string;
  seo: { title?: string; description?: string } | null;
}

let client: SupabaseClient | null = null;

/**
 * Public (anon) client: row level security only returns posts that are published and whose
 * publish date has passed, so drafts and scheduled posts can never reach the website.
 * Null when the shop runs on seed data without Supabase.
 */
function db(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (process.env.CATALOG_SOURCE !== "supabase" || !url || !key) return null;
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

function toPost(row: PostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: (row.body ?? []).filter((b) => b.trim().length > 0),
    coverImage: row.cover_image?.src ? row.cover_image : null,
    relatedProducts: row.related_products ?? [],
    author: row.author,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    seo: row.seo,
  };
}

const COLUMNS =
  "id, slug, title, excerpt, body, cover_image, related_products, author, published_at, updated_at, seo";

/** Published posts, newest first. Empty (never throws) if the database can't be reached. */
export const getPosts = cache(async (): Promise<BlogPost[]> => {
  const supabase = db();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("posts")
    .select(COLUMNS)
    .order("published_at", { ascending: false });
  if (error) {
    console.error("[blog] posts query failed:", error.message);
    return [];
  }
  return (data as PostRow[]).map(toPost);
});

export const getPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  const posts = await getPosts();
  return posts.find((p) => p.slug === slug) ?? null;
});

/** Words per minute for the "x min read" label. */
export function readingMinutes(post: Pick<BlogPost, "body">): number {
  const words = post.body.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
