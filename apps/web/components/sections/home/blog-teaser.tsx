import type { ImageAsset } from "@northnectar/types";
import { ArrowRightIcon } from "@northnectar/ui/icons";
import { IntentLink as Link } from "@/components/ui/intent-link";
import { PostCard } from "@/features/blog/post-card";
import type { BlogPost } from "@/lib/blog";
import { HomeHeading } from "./heading";

/**
 * "From the blog": the latest three articles, linked from the home page so search engines and
 * visitors find the guides quickly. Hidden until the first article is published.
 */
export function BlogTeaser({
  posts,
  photoFor,
}: {
  posts: BlogPost[];
  /** Fallback photo for a post without a cover (its first related product's photo). */
  photoFor: (post: BlogPost) => ImageAsset | null;
}) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby="home-blog-title" className="px-4 py-14 md:px-8 md:py-24">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-8">
        <HomeHeading
          id="home-blog-title"
          eyebrow="Guides from the mountains"
          title="From the blog"
          action={
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-[16px] leading-6 font-bold text-forest-600 hover:underline"
            >
              All articles <ArrowRightIcon size={18} />
            </Link>
          }
        />
        <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <li key={post.id}>
              <PostCard post={post} fallback={photoFor(post)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
