import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { IntentLink as Link } from "@/components/ui/intent-link";
import { ArticleBody, headingsOf } from "@/features/blog/article-body";
import { formatPostDate } from "@/features/blog/post-card";
import { ProductGrid } from "@/features/products/product-grid";
import { getPostBySlug, getPosts, readingMinutes } from "@/lib/blog";
import { catalog } from "@/lib/catalog";
import { postPath } from "@/lib/routes";
import { blogPostingJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

/** Pre-built for every published post; new posts render on first visit; refreshed hourly. */
export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Article not found" };
  const description = post.seo?.description || post.excerpt;
  return buildMetadata({
    title: post.seo?.title || post.title,
    description:
      description.length > 160
        ? `${description.slice(0, 157).replace(/\s+\S*$/, "")}…`
        : description,
    path: postPath(post.slug),
    type: "article",
    ...(post.coverImage
      ? {
          image: {
            url: post.coverImage.src,
            width: post.coverImage.width,
            height: post.coverImage.height,
            alt: post.coverImage.alt || post.title,
          },
        }
      : {}),
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  // Drafts and scheduled posts are never returned (row level security), so they 404.
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [products, categories, posts] = await Promise.all([
    catalog.getProducts(),
    catalog.getCategories(),
    getPosts(),
  ]);
  const related = post.relatedProducts
    .map((s) => products.find((p) => p.slug === s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4);
  const more = posts.filter((p) => p.id !== post.id).slice(0, 3);
  const toc = headingsOf(post.body).filter((h) => h.level === 2);

  return (
    <>
      <JsonLd data={blogPostingJsonLd(post)} />

      <section aria-labelledby="post-title" className="border-b border-[#ece4d3] bg-[#faf7f0]">
        <div className="mx-auto flex max-w-[1384px] flex-col gap-4 px-4 pt-[22px] pb-[26px] md:px-8 md:py-9">
          <Breadcrumbs
            items={[
              { name: "Blog", path: "/blog" },
              { name: post.title, path: postPath(post.slug) },
            ]}
          />
          <h1
            id="post-title"
            className="m-0 max-w-[22ch] font-display text-[40px] leading-[0.98] font-bold text-[#0f2a1a] uppercase md:text-[68px]"
          >
            {post.title}
          </h1>
          <p className="m-0 text-[15px] leading-[1.5] text-[#6a665a]">
            By {post.author} ·{" "}
            <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time> ·{" "}
            {readingMinutes(post)} min read
          </p>
          {post.excerpt ? (
            <p className="m-0 max-w-[760px] text-[19px] leading-[1.6] text-[#1f2a21]">
              {post.excerpt}
            </p>
          ) : null}
        </div>
      </section>

      <section aria-label="Article" className="px-4 pt-8 pb-14 md:px-8 md:pt-12 md:pb-20">
        <div className="mx-auto flex max-w-[1384px] flex-wrap items-start gap-x-16 gap-y-10">
          <article className="flex min-w-0 flex-[2_1_620px] flex-col gap-8">
            {post.coverImage ? (
              <Image
                src={post.coverImage.src}
                alt={post.coverImage.alt || post.title}
                width={post.coverImage.width}
                height={post.coverImage.height}
                sizes="(min-width: 1024px) 820px, 100vw"
                preload
                fetchPriority="high"
                className="h-auto w-full rounded-[22px] object-cover"
              />
            ) : null}
            <ArticleBody body={post.body} />
          </article>

          <aside
            aria-label="In this article"
            className="flex min-w-0 flex-[1_1_280px] flex-col gap-5 md:sticky md:top-[150px]"
          >
            {toc.length > 1 ? (
              <nav
                aria-label="In this article"
                className="flex flex-col gap-2 rounded-[22px] border border-[#e8dfcc] bg-white p-[26px]"
              >
                <h2 className="m-0 font-display text-[22px] leading-[1.5] font-bold text-[#0f2a1a] uppercase">
                  In this article
                </h2>
                <ol className="m-0 flex list-none flex-col gap-1 p-0">
                  {toc.map((h) => (
                    <li key={h.id}>
                      <a
                        href={`#${h.id}`}
                        className="flex min-h-10 items-center text-[16px] leading-[1.4] font-semibold text-[#1f6b3a] hover:underline"
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}
            <div className="on-dark flex flex-col gap-[10px] rounded-[22px] bg-[#0f2a1a] p-[26px] text-[#e9efe4]">
              <h2 className="m-0 font-display text-[22px] leading-[1.4] font-bold text-white uppercase">
                From the mountains to your door
              </h2>
              <p className="m-0 text-[15px] leading-[1.6] text-[#c9d3c4]">
                Natural foods from Gilgit-Baltistan, packed at source. Cash on delivery across
                Pakistan.
              </p>
              <Link
                href="/shop"
                className="mt-1 inline-flex h-11 items-center justify-center rounded-full bg-[#f4a12e] text-[15px] font-bold text-[#1b1a12] hover:bg-orange-600"
              >
                Shop all products
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 ? (
        <section aria-labelledby="post-products-title" className="px-4 pb-14 md:px-8 md:pb-20">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-7">
            <h2
              id="post-products-title"
              className="m-0 font-display text-[34px] leading-[1.02] font-bold text-[#0f2a1a] uppercase md:text-[52px]"
            >
              Products in this article
            </h2>
            <ProductGrid products={related} categories={categories} className="md:gap-x-[22px]" />
          </div>
        </section>
      ) : null}

      {more.length > 0 ? (
        <section
          aria-labelledby="post-more-title"
          className="bg-[#f1e9da] px-4 py-12 md:px-8 md:py-20"
        >
          <div className="mx-auto flex max-w-[1320px] flex-col gap-5">
            <h2
              id="post-more-title"
              className="m-0 font-display text-[30px] leading-[1.05] font-bold text-[#0f2a1a] uppercase md:text-[44px]"
            >
              More from the blog
            </h2>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {more.map((p) => (
                <li key={p.id}>
                  <Link
                    href={postPath(p.slug)}
                    className="flex flex-col gap-1 rounded-[16px] border border-[#e3d8bf] bg-white px-5 py-4 hover:border-forest-600"
                  >
                    <span className="text-[18px] leading-[1.4] font-bold text-[#0f2a1a]">
                      {p.title}
                    </span>
                    <span className="text-[14px] text-[#6a665a]">
                      {formatPostDate(p.publishedAt)} · {readingMinutes(p)} min read
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
