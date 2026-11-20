import { StarIcon } from "@northnectar/ui/icons";
import Image from "next/image";
import { homeContent } from "@/content/home";
import { HomeHeading } from "./heading";

function Stars({ size, label }: { size: number; label?: string }) {
  return (
    <span
      className="flex gap-[2px] text-[#c8771f]"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} size={size} />
      ))}
    </span>
  );
}

/**
 * Customer reviews (mockup values). Rendered only when allowed: placeholder reviews never reach
 * production (see `homeContent.reviews.isPlaceholder`). No review structured data is emitted.
 */
export function Reviews({ visible }: { visible: boolean }) {
  const { reviews } = homeContent;
  if (!visible || reviews.items.length === 0) return null;

  return (
    <section aria-labelledby="reviews-title" className="px-4 py-14 md:px-8 md:py-24">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-9">
        <HomeHeading
          id="reviews-title"
          eyebrow={reviews.eyebrow}
          title={reviews.title}
          action={<Stars size={20} label="Rated 5 out of 5" />}
        />
        <ul
          data-rv="rise"
          className="m-0 grid [scroll-snap-type:x_mandatory] [scrollbar-width:none] list-none auto-cols-[86%] grid-flow-col gap-5 overflow-x-auto p-0 pb-1 md:auto-cols-auto md:grid-flow-row md:grid-cols-3"
        >
          {reviews.items.map((review) => (
            <li key={review.name} className="snap-start">
              <figure className="m-0 flex h-full flex-col gap-[14px] rounded-[18px] border border-[#e8dfcc] bg-white p-7">
                <Stars size={16} label="5 out of 5 stars" />
                <p className="m-0 text-[18px] leading-[27px] font-bold">{review.title}</p>
                <blockquote className="m-0 text-[16px] leading-[1.65] text-[#3d3a32]">
                  <p className="m-0">{review.quote}</p>
                </blockquote>
                <figcaption className="mt-auto flex items-center justify-between gap-3 border-t border-[#ece3d0] pt-[14px]">
                  <span className="flex flex-col">
                    <span className="text-[15px] leading-[23px] font-bold">{review.name}</span>
                    <span className="text-[14px] leading-[21px] text-[#5e5a4e]">
                      {review.city} · Verified buyer
                    </span>
                  </span>
                  <span className="relative size-[54px] flex-none overflow-hidden rounded-[10px] border border-[#f0e9da] bg-white">
                    <Image
                      src={review.image.src}
                      alt={review.image.alt}
                      fill
                      sizes="52px"
                      className="object-contain"
                    />
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
