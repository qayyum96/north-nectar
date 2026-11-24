import "server-only";
import type { ImageAsset } from "@/lib/catalogue-shared";
import { createClient } from "@/lib/supabase/server";

/** public.posts (supabase/migrations/20261127000100_blog_posts.sql). */
export interface PostRow {
  id: string;
  slug: string;
  status: "active" | "draft";
  title: string;
  excerpt: string;
  body: string[];
  cover_image: ImageAsset | null;
  related_products: string[];
  author: string;
  published_at: string | null;
  seo: { title?: string; description?: string } | null;
  created_at: string;
  updated_at: string;
}

/** Form values of the post editor (body as one text with blank lines between blocks). */
export interface PostForm {
  id: string;
  isNew: boolean;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage: ImageAsset | null;
  relatedProducts: string[];
  author: string;
  published: boolean;
  /** YYYY-MM-DD in Pakistan time; empty until first published. */
  publishDate: string;
  metaTitle: string;
  metaDescription: string;
}

/** All posts, newest first (drafts without a date at the top). */
export async function loadPosts(): Promise<PostRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: true })
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Blog: posts query failed: ${error.message}`);
  return data as PostRow[];
}

/** Date part (YYYY-MM-DD) of a timestamp, in Pakistan time. */
export function pkDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date(iso));
}

/** Today (YYYY-MM-DD) in Pakistan time. */
export function pkToday(): string {
  return pkDate(new Date().toISOString());
}

/** Draft, Scheduled (published with a future date) or Published. */
export function postStatus(p: Pick<PostRow, "status" | "published_at">): {
  key: "draft" | "pending" | "active";
  label: string;
} {
  if (p.status !== "active") return { key: "draft", label: "Draft" };
  if (p.published_at && new Date(p.published_at).getTime() > Date.now())
    return { key: "pending", label: "Scheduled" };
  return { key: "active", label: "Published" };
}

export function toPostForm(p: PostRow | null): PostForm {
  if (!p) {
    return {
      id: crypto.randomUUID(),
      isNew: true,
      title: "",
      slug: "",
      excerpt: "",
      body: "",
      coverImage: null,
      relatedProducts: [],
      author: "North Nectar",
      published: false,
      publishDate: "",
      metaTitle: "",
      metaDescription: "",
    };
  }
  return {
    id: p.id,
    isNew: false,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    body: (p.body ?? []).join("\n\n"),
    coverImage: p.cover_image?.src ? p.cover_image : null,
    relatedProducts: p.related_products ?? [],
    author: p.author,
    published: p.status === "active",
    publishDate: p.published_at ? pkDate(p.published_at) : "",
    metaTitle: p.seo?.title ?? "",
    metaDescription: p.seo?.description ?? "",
  };
}
