"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { mediaRef, removeMedia } from "@/lib/media";
import { revalidateStorefront } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.string().min(1).max(80),
  isNew: z.boolean(),
  name: z.string().trim().min(2, "Add a name").max(60),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  description: z.string().trim().max(400),
  image: z
    .object({
      src: z.string().url().or(z.string().startsWith("/")),
      alt: z.string(),
      width: z.number(),
      height: z.number(),
    })
    .nullable(),
  metaTitle: z.string().trim().max(120),
  metaDescription: z.string().trim().max(320),
  /** Page text; paragraphs are separated by a blank line. */
  content: z.string().max(8000, "Keep the page text under 8,000 characters"),
  faqs: z
    .array(
      z.object({
        question: z.string().trim().max(200, "Keep questions under 200 characters"),
        answer: z.string().trim().max(1500, "Keep answers under 1,500 characters"),
      }),
    )
    .max(12, "Up to 12 questions"),
});

/** "Para one\n\nPara two" -> ["Para one", "Para two"] (single line breaks stay inside a paragraph). */
function paragraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export type CategoryInput = z.input<typeof schema>;
export type CategoryResult =
  | { ok: true; id: string; message: string }
  | { ok: false; error: string; fields?: Record<string, string> };

async function after() {
  revalidatePath("/categories");
  revalidatePath("/products");
  await revalidateStorefront();
}

export async function saveCategory(input: CategoryInput): Promise<CategoryResult> {
  await requireStaff(["owner", "manager"]);
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[i.path.join(".")] ??= i.message;
    return { ok: false, error: "Please check the highlighted fields.", fields };
  }
  const v = parsed.data;
  const incomplete = v.faqs.findIndex((f) => !f.question !== !f.answer);
  if (incomplete >= 0) {
    return {
      ok: false,
      error: "Each question needs an answer (or remove it).",
      fields: { [`faqs.${incomplete}`]: "Add both the question and the answer" },
    };
  }
  const supabase = await createClient();
  const { data: clash } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", v.slug)
    .neq("id", v.id)
    .maybeSingle();
  if (clash)
    return {
      ok: false,
      error: "Another category uses this URL slug.",
      fields: { slug: "Already used" },
    };

  const before = v.isNew
    ? null
    : ((await supabase.from("categories").select("image").eq("id", v.id).maybeSingle()).data as {
        image: { src: string } | null;
      } | null);

  const seo =
    v.metaTitle || v.metaDescription
      ? {
          ...(v.metaTitle ? { title: v.metaTitle } : {}),
          ...(v.metaDescription ? { description: v.metaDescription } : {}),
        }
      : null;
  const row = {
    name: v.name,
    slug: v.slug,
    description: v.description,
    image: v.image ? { ...v.image, alt: v.image.alt || v.name } : null,
    seo,
    content: paragraphs(v.content),
    faqs: v.faqs.filter((f) => f.question && f.answer),
  };
  const { error } = v.isNew
    ? await supabase.from("categories").insert({ id: v.id, status: "active", ...row })
    : await supabase.from("categories").update(row).eq("id", v.id);
  if (error) return { ok: false, error: "The category couldn't be saved. Please try again." };

  const old = mediaRef(before?.image?.src);
  if (old && before?.image?.src !== v.image?.src && old.path.startsWith("categories/")) {
    await removeMedia([old]);
  }
  await after();
  return { ok: true, id: v.id, message: v.isNew ? `${v.name} added` : "Category saved" };
}

export async function deleteCategory(id: string): Promise<CategoryResult> {
  await requireStaff(["owner", "manager"]);
  const supabase = await createClient();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: `Move its ${count} ${count === 1 ? "product" : "products"} to another category first.`,
    };
  }
  const { data: cat } = await supabase
    .from("categories")
    .select("name, image")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: "The category couldn't be deleted." };
  const path = (cat as { image: { src: string } | null } | null)?.image?.src;
  const file = mediaRef(path);
  if (file?.path.startsWith("categories/")) await removeMedia([file]);
  await after();
  return {
    ok: true,
    id,
    message: `${(cat as { name: string } | null)?.name ?? "Category"} deleted`,
  };
}
