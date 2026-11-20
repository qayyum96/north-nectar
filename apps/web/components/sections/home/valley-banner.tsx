import { ChevronRightIcon } from "@northnectar/ui/icons";
import Image from "next/image";
import Link from "next/link";
import { homeContent } from "@/content/home";
import { videos } from "@/lib/images";

/**
 * Full-bleed "Straight from the valley" banner with the looping valley video behind a dark scrim
 * (mockup: 640px tall desktop, 520px mobile, video scaled 1.25 with scroll parallax).
 * The video only downloads and plays while on screen (data-autoplay) and never for reduced motion.
 */
export function ValleyBanner() {
  const { banner } = homeContent;
  return (
    <section
      aria-labelledby="banner-title"
      className="on-dark relative isolate flex h-[520px] items-center justify-center overflow-hidden text-center text-white md:h-[640px]"
    >
      {/* Still frame shown until (or instead of) the video; lazy-loaded below the fold. */}
      <Image
        src={videos.story.poster.src}
        alt=""
        fill
        sizes="100vw"
        className="-z-30 scale-125 object-cover"
      />
      <video
        aria-hidden="true"
        data-autoplay
        data-px="0.18"
        className="absolute inset-0 -z-20 h-full w-full scale-125 object-cover"
        src={videos.story.src}
        poster={videos.story.poster.src}
        muted
        loop
        playsInline
        preload="none"
        tabIndex={-1}
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[rgba(12,30,18,0.66)]" />
      <div className="relative flex max-w-[768px] flex-col items-center gap-[18px] px-6">
        <p className="text-[14px] leading-[21px] font-bold tracking-[0.22em] text-[#b9d38f] uppercase">
          {banner.eyebrow}
        </p>
        <h2
          id="banner-title"
          data-rv="mask"
          className="m-0 font-display text-[32px] leading-[1.1] font-bold text-white uppercase md:text-[56px]"
        >
          {banner.title}
        </h2>
        <p className="m-0 text-[17px] leading-[1.65] text-[#e3dccb]">{banner.text}</p>
        <Link
          href={banner.cta.href}
          className="mt-[10px] inline-flex h-[52px] items-center gap-[10px] rounded-[10px] border-[1.5px] border-[#b9d38f] px-7 text-[16px] font-bold text-white hover:bg-white/10"
        >
          {banner.cta.label} <ChevronRightIcon size={18} />
        </Link>
      </div>
    </section>
  );
}
