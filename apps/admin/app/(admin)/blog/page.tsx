import { cn } from "@northnectar/ui";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ButtonLink,
  Card,
  EmptyState,
  PageBody,
  PageHeader,
  StatusBadge,
  tableStyles,
} from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { loadPosts, postStatus as status } from "@/lib/blog";
import { dateLabel, imageSrc, plural } from "@/lib/format";
import { ProductThumb } from "../products/products-table";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogPage() {
  await requireStaff(["owner", "manager"]);
  const posts = await loadPosts();
  const live = posts.filter((p) => status(p).key === "active").length;
  const site = new URL(process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://northnectar.com").host;
  const grid = "grid-cols-[minmax(0,1fr)_120px] md:grid-cols-[minmax(0,1fr)_130px_150px_140px]";

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Website" }, { label: "Blog" }]}
        title="Blog"
        subtitle={`${plural(posts.length, "post")} · ${live} published on ${site}/blog`}
        actions={
          <ButtonLink href="/blog/new" variant="primary" icon="plus">
            New post
          </ButtonLink>
        }
      />
      <PageBody>
        <Card className="overflow-hidden p-0">
          {posts.length === 0 ? (
            <div className="py-12">
              <EmptyState icon="file" title="No posts yet">
                Write guides about your products: how to choose, use and store them. Each post is a
                new page that can appear in Google searches.
              </EmptyState>
            </div>
          ) : (
            <>
              <div className={cn(tableStyles.head, "bg-[#f4f2ee]", grid)}>
                <span>Post</span>
                <span>Status</span>
                <span className="hidden md:block">Publish date</span>
                <span className="hidden md:block">Last edited</span>
              </div>
              <ul className="m-0 list-none p-0">
                {posts.map((p) => {
                  const s = status(p);
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/blog/${p.id}`}
                        className={cn(tableStyles.row, grid, "bg-white hover:bg-[#fafaf9]")}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <ProductThumb src={imageSrc(p.cover_image?.src)} />
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate font-semibold text-forest-600">
                              {p.title}
                            </span>
                            <span className="text-admin-muted truncate">/blog/{p.slug}</span>
                          </span>
                        </span>
                        <StatusBadge status={s.key} label={s.label} />
                        <span className="text-admin-muted hidden md:block">
                          {p.published_at ? dateLabel(p.published_at) : "Not set"}
                        </span>
                        <span className="text-admin-muted hidden md:block">
                          {dateLabel(p.updated_at)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Card>
      </PageBody>
    </>
  );
}
