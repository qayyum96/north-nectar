import type { Category } from "@northnectar/types";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { homeContent } from "@/content/home";
import { categoryPath } from "@/lib/routes";
import { HomeHeading } from "./heading";

/**
 * "Browse by category" (mockup: 8 x 151px columns, 132px circles on desktop; a horizontal strip
 * of 96px columns with 88px circles on mobile). Fewer categories stay the same size and centre.
 * Hidden when there are fewer than two active categories.
 */
export function CategoryCircles({ categories }: { categories: Category[] }) {
  if (categories.length < 2) return null;
  const { eyebrow, title } = homeContent.categories;
  const style = { "--n": categories.length } as CSSProperties;

  return (
    <section aria-labelledby="categories-title" className="px-4 pt-14 md:px-8 md:pt-24">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-8">
        <HomeHeading id="categories-title" eyebrow={eyebrow} title={title} align="center" />
        <ul
          data-rv="rise"
          style={style}
          className="grid [scrollbar-width:none] auto-cols-[96px] grid-flow-col [justify-content:safe_center] gap-x-4 gap-y-5 overflow-x-auto pb-[6px] md:auto-cols-auto md:grid-flow-row md:grid-cols-[repeat(var(--n),minmax(0,151px))]"
        >
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={categoryPath(category.slug)}
                className="flex flex-col items-center gap-3 text-center text-ink"
              >
                <span
                  className="relative block size-[90px] overflow-hidden rounded-full border border-[#e8dfcc] bg-white shadow-[0_0_0_6px_#f3eadb] md:size-[134px]"
                  style={
                    category.image.background
                      ? { background: category.image.background }
                      : undefined
                  }
                >
                  <Image
                    src={category.image.src}
                    alt=""
                    fill
                    data-zoom
                    sizes="(min-width: 768px) 132px, 88px"
                    className="object-cover"
                  />
                </span>
                <span className="text-[15px] leading-[1.3] font-bold">{category.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
