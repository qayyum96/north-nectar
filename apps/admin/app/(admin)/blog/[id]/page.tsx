import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { loadPosts, pkToday, toPostForm } from "@/lib/blog";
import { loadCatalogue } from "@/lib/catalogue";
import { dateLabel } from "@/lib/format";
import { PostEditor } from "./post-editor";

export const metadata: Metadata = { title: "Edit post" };

/** /blog/new (empty editor) and /blog/<id>. */
export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff(["owner", "manager"]);
  const { id } = await params;
  const [posts, { products }] = await Promise.all([loadPosts(), loadCatalogue()]);
  const post = id === "new" ? null : (posts.find((p) => p.id === id) ?? null);
  if (id !== "new" && !post) notFound();

  return (
    <PostEditor
      key={post ? `${post.id}-${post.updated_at}` : "new"}
      initial={toPostForm(post)}
      products={products.map((p) => ({ slug: p.slug, name: p.name, live: p.status === "active" }))}
      lastEdited={post ? dateLabel(post.updated_at) : null}
      today={pkToday()}
      storefrontUrl={(process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://northnectar.com").replace(
        /\/$/,
        "",
      )}
    />
  );
}
