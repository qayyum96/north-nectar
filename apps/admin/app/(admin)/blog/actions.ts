"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { pkDate } from "@/lib/blog";
import { mediaRef, removeMedia, removeMediaFolder } from "@/lib/media";
import { revalidateStorefront } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.string().min(1).max(80),
  isNew: z.boolean(),
  title: z.string().trim().min(5, "Add a title").max(140),
  slug: z
    .string()
    .trim()
    .min(3, "Add a URL slug")
    .max(100)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  excerpt: z.string().trim().max(300, "Keep the summary under 300 characters"),
  body: z.string().max(40000, "The article is too long (40,000 characters at most)"),
  coverImage: z
    .object({
      src: z.string().url().or(z.string().startsWith("/")),
      alt: z.string(),
      width: z.number(),
      height: z.number(),
    })
    .nullable(),
  relatedProducts: z.array(z.string().max(100)).max(4, "Up to 4 products"),
  author: z.string().trim().min(2, "Add an author").max(80),
  published: z.boolean(),
  publishDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  metaTitle: z.string().trim().max(120),
  metaDescription: z.string().trim().max(320),
});

export type PostInput = z.input<typeof schema>;
export type PostResult =
  | { ok: true; id: string; message: string }
  | { ok: false; error: string; fields?: Record<string, string> };

/**
 * Text -> blocks: blank lines separate blocks, and a "## " / "### " line always starts its own
 * block (so a heading typed directly above its paragraph still works).
 */
function blocks(text: string): string[] {
  const out: string[] = [];
  for (const chunk of text.replace(/\r\n/g, "\n").split(/\n\s*\n/)) {
    let current: string[] = [];
    const flush = () => {
      const b = current.join("\n").trim();
      if (b) out.push(b);
      current = [];
    };
    for (const line of chunk.split("\n")) {
      if (/^#{2,3}\s+\S/.test(line.trim())) {
        flush();
        out.push(line.trim());
      } else current.push(line);
    }
    flush();
  }
  return out;
}

/** Refreshes the admin list and asks the website to rebuild its pages (blog, sitemap) now. */
async function after() {
  revalidatePath("/blog");
  await revalidateStorefront();
}

export async function savePost(input: PostInput): Promise<PostResult> {
  await requireStaff(["owner", "manager"]);
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[i.path.join(".")] ??= i.message;
    return { ok: false, error: "Please check the highlighted fields.", fields };
  }
  const v = parsed.data;
  const body = blocks(v.body);
  if (v.published && body.length === 0) {
    return {
      ok: false,
      error: "Write the article before publishing it.",
      fields: { body: "The article is empty" },
    };
  }

  const supabase = await createClient();
  const { data: clash } = await supabase
    .from("posts")
    .select("id")
    .eq("slug", v.slug)
    .neq("id", v.id)
    .maybeSingle();
  if (clash) {
    return {
      ok: false,
      error: "Another post uses this URL slug.",
      fields: { slug: "Already used" },
    };
  }

  const before = v.isNew
    ? null
    : ((
        await supabase
          .from("posts")
          .select("cover_image, published_at")
          .eq("id", v.id)
          .maybeSingle()
      ).data as { cover_image: { src: string } | null; published_at: string | null } | null);

  // Keep the exact original time when the date is unchanged; a new date is published at 9:00 PKT.
  // Publishing without a date uses now. A future date schedules the post.
  let publishedAt: string | null = before?.published_at ?? null;
  if (v.publishDate) {
    if (!publishedAt || pkDate(publishedAt) !== v.publishDate) {
      publishedAt = new Date(`${v.publishDate}T09:00:00+05:00`).toISOString();
    }
  } else if (v.published && !publishedAt) {
    publishedAt = new Date().toISOString();
  }

  const seo =
    v.metaTitle || v.metaDescription
      ? {
          ...(v.metaTitle ? { title: v.metaTitle } : {}),
          ...(v.metaDescription ? { description: v.metaDescription } : {}),
        }
      : null;
  const row = {
    slug: v.slug,
    title: v.title,
    excerpt: v.excerpt,
    body,
    cover_image: v.coverImage ? { ...v.coverImage, alt: v.coverImage.alt || v.title } : null,
    related_products: v.relatedProducts,
    author: v.author,
    status: v.published ? "active" : "draft",
    published_at: publishedAt,
    seo,
  };
  const { error } = v.isNew
    ? await supabase.from("posts").insert({ id: v.id, ...row })
    : await supabase.from("posts").update(row).eq("id", v.id);
  if (error) return { ok: false, error: "The post couldn't be saved. Please try again." };

  const old = mediaRef(before?.cover_image?.src);
  if (old && before?.cover_image?.src !== v.coverImage?.src && old.path.startsWith("posts/")) {
    await removeMedia([old]);
  }
  await after();

  const scheduled = v.published && publishedAt && new Date(publishedAt) > new Date();
  return {
    ok: true,
    id: v.id,
    message: !v.published
      ? "Draft saved"
      : scheduled
        ? `Scheduled for ${v.publishDate}`
        : v.isNew
          ? "Post published"
          : "Post saved",
  };
}

export async function deletePost(id: string): Promise<PostResult> {
  await requireStaff(["owner", "manager"]);
  const supabase = await createClient();
  const { data: post } = await supabase.from("posts").select("title").eq("id", id).maybeSingle();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) return { ok: false, error: "The post couldn't be deleted." };
  await removeMediaFolder(`posts/${id}`);
  await after();
  return {
    ok: true,
    id,
    message: `${(post as { title: string } | null)?.title ?? "Post"} deleted`,
  };
}
