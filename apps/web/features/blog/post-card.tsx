import type { ImageAsset } from "@northnectar/types";
import Image from "next/image";
import { IntentLink as Link } from "@/components/ui/intent-link";
import { type BlogPost, readingMinutes } from "@/lib/blog";
import { images } from "@/lib/images";
import { postPath } from "@/lib/routes";

export const formatPostDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(iso),
  );

/**
 * Article card for the blog index. The whole card is one link. Without a cover photo it shows
 * `fallback` (the first related product photo), else a decorative leaf.
 */
export function PostCard({
  post,
  fallback = null,
  priority = false,
}: {
  post: BlogPost;
  fallback?: ImageAsset | null;
  priority?: boolean;
}) {
  const photo = post.coverImage ?? fallback;
  const cover = photo ?? images.decor.leaf3;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[#e8dfcc] bg-white transition-shadow hover:shadow-[0_14px_30px_rgba(30,50,20,0.10)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#f1e9da]">
        <Image
          src={cover.src}
          alt={photo ? photo.alt || post.title : ""}
          fill
          sizes="(min-width: 1024px) 420px, (min-width: 640px) 50vw, 100vw"
          preload={priority}
          className={
            photo
              ? "object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              : "object-contain p-10 opacity-60"
          }
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-[22px]">
        <p className="m-0 text-[14px] leading-[21px] text-[#6a665a]">
          <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time> ·{" "}
          {readingMinutes(post)} min read
        </p>
        <h2 className="m-0 font-display text-[24px] leading-[1.15] font-bold text-[#0f2a1a] uppercase">
          <Link
            href={postPath(post.slug)}
            className="after:absolute after:inset-0 after:content-[''] hover:text-forest-600"
          >
            {post.title}
          </Link>
        </h2>
        {post.excerpt ? (
          <p className="m-0 text-[16px] leading-[1.6] text-[#4d4a40]">{post.excerpt}</p>
        ) : null}
        <span className="mt-auto pt-1 text-[15px] font-bold text-[#1f6b3a]">Read more →</span>
      </div>
    </article>
  );
}
