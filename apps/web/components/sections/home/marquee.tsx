import { cn } from "@northnectar/ui";
import Image from "next/image";
import { homeContent } from "@/content/home";
import { images } from "@/lib/images";

/**
 * Scrolling ticker (CSS animation, 48s loop as in the mockup, paused for reduced motion).
 * Decorative: the same promises appear elsewhere in real text, so it is hidden from assistive tech.
 */
export function Marquee() {
  const words = homeContent.marquee;
  const track = (copy: number) =>
    words.map((word, i) => (
      <li
        key={`${copy}-${word}`}
        className={cn(
          "inline-flex shrink-0 items-center gap-4 pr-4 font-display text-[20px] leading-none font-bold tracking-[0.04em] whitespace-nowrap uppercase md:gap-6 md:pr-6 md:text-[26px]",
          i % 2
            ? "text-transparent [-webkit-text-stroke:1px_#0f2a1a]"
            : "text-[#0f2a1a] [-webkit-text-stroke:0px_transparent]",
        )}
      >
        {word}
        <Image
          src={images.brand.emblemGreen.src}
          width={images.brand.emblemGreen.width}
          height={images.brand.emblemGreen.height}
          alt=""
          unoptimized
          className="h-4 w-auto opacity-85 md:h-5"
        />
      </li>
    ));

  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-b border-[#e3d8c0] bg-[#f1e9da] py-3 md:py-4"
    >
      <ul className="flex w-max animate-marquee motion-reduce:animate-none">
        {track(0)}
        {track(1)}
      </ul>
    </div>
  );
}
