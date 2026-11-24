import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { IntentLink as Link } from "@/components/ui/intent-link";
import { PostCard } from "@/features/blog/post-card";
import { getPosts } from "@/lib/blog";
import { catalog } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo/metadata";

/** Refreshed hourly; the admin refreshes it straight away when a post is saved. */
export const revalidate = 3600;

const TITLE = "Blog and Guides";
const DESCRIPTION =
  "Guides to Himalayan foods from Gilgit-Baltistan: how to choose pure shilajit, use dried apricots, brew Hunza herbal tea and more, from the North Nectar team.";

export async function generateMetadata(): Promise<Metadata> {
  const posts = await getPosts();
  // An empty index is thin content: keep it out of search until the first article is published.
  return buildMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/blog",
    noIndex: posts.length === 0,
  });
}

export default async function BlogIndexPage() {
  const [posts, products] = await Promise.all([getPosts(), catalog.getProducts()]);
  const productPhoto = (slugs: string[]) =>
    slugs.map((s) => products.find((p) => p.slug === s)?.images[0]).find(Boolean) ?? null;
  return (
    <>
      <section aria-labelledby="blog-title" className="border-b border-[#ece4d3] bg-[#faf7f0]">
        <div className="mx-auto flex max-w-[1384px] flex-col gap-3 px-4 pt-[22px] pb-[26px] md:px-8 md:py-9">
          <Breadcrumbs items={[{ name: "Blog", path: "/blog" }]} />
          <h1
            id="blog-title"
            data-rv="mask"
            className="m-0 font-display text-[44px] leading-[0.95] font-bold text-[#0f2a1a] uppercase md:text-[80px]"
          >
            {TITLE}
          </h1>
          <p className="m-0 max-w-[640px] text-[17px] leading-[1.6] text-[#4d4a40]">
            How to choose, use and store natural foods from the mountains of Gilgit-Baltistan, from
            the people who source and pack them.
          </p>
        </div>
      </section>

      <section aria-label="Articles" className="px-4 pt-8 pb-14 md:px-8 md:pt-12 md:pb-24">
        <div className="mx-auto max-w-[1384px]">
          {posts.length > 0 ? (
            <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, i) => (
                <li key={post.id}>
                  <PostCard
                    post={post}
                    fallback={productPhoto(post.relatedProducts)}
                    priority={i < 3}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-start gap-4 rounded-[22px] border border-[#e8dfcc] bg-white p-8">
              <h2 className="m-0 font-display text-[28px] leading-[1.1] font-bold text-[#0f2a1a] uppercase">
                First articles coming soon
              </h2>
              <p className="m-0 max-w-[560px] text-[17px] leading-[1.6] text-[#4d4a40]">
                We are writing our first guides. In the meantime, browse our Himalayan teas, roots
                and dry fruits.
              </p>
              <Link
                href="/shop"
                className="inline-flex h-12 items-center rounded-full bg-forest-600 px-6 text-[16px] font-bold text-white hover:bg-forest-700"
              >
                Shop all products
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
