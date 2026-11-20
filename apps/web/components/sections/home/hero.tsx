import type { Product } from "@northnectar/types";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { homeContent } from "@/content/home";
import { images } from "@/lib/images";
import { productPath } from "@/lib/routes";

/*
 * Values below are taken 1:1 from the mockup. Base classes = mockup mobile (390px), `md:` = mockup
 * desktop (1440px). Large type scales fluidly between 768px and 1440px so it never overflows.
 */

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

/** Leaves floating top-right, with pointer parallax (data-ptr) and a CSS float. */
const LEAVES = [
  { img: images.decor.leaf3, left: "34%", top: "0%", width: "46%", rot: -28 },
  { img: images.decor.leaf2, left: "54%", top: "24%", width: "26%", rot: 18 },
  { img: images.decor.leaf1, left: "22%", top: "28%", width: "22%", rot: -14 },
  { img: images.decor.leaf3, left: "50%", top: "62%", width: "48%", rot: 12 },
  { img: images.decor.leaf1, left: "6%", top: "74%", width: "16%", rot: -150 },
] as const;

export function HomeHero({
  announcementProduct,
  showSocialProof,
}: {
  announcementProduct: Product | null;
  showSocialProof: boolean;
}) {
  const { hero } = homeContent;

  return (
    <section
      aria-labelledby="home-hero-title"
      data-ptr-root
      className="relative overflow-hidden bg-[#faf7f0]"
    >
      <div
        aria-hidden="true"
        data-ptr="-26"
        className="pointer-events-none absolute top-[10px] -right-10 h-[200px] w-[170px] md:top-5 md:right-0 md:h-[360px] md:w-[300px]"
      >
        {LEAVES.map((leaf, i) => (
          <span
            key={i}
            className="absolute block"
            style={{
              left: leaf.left,
              top: leaf.top,
              width: leaf.width,
              transform: `rotate(${leaf.rot}deg)`,
            }}
          >
            <Image
              src={leaf.img.src}
              width={leaf.img.width}
              height={leaf.img.height}
              alt=""
              sizes="150px"
              loading="eager"
              className="h-auto w-full animate-leaf-float drop-shadow-[0_14px_16px_rgba(30,60,20,0.22)]"
              style={{
                animationDuration: `${3.2 + (i % 5) * 0.7}s`,
                animationDelay: `${-i * 0.6}s`,
              }}
            />
          </span>
        ))}
      </div>

      <div className="relative mx-auto flex max-w-site flex-col gap-4 px-4 pt-7 pb-9 md:gap-[22px] md:px-8 md:py-14">
        {announcementProduct ? (
          <Link
            href={productPath(announcementProduct.slug)}
            className="inline-flex items-center gap-3 self-start rounded-full border border-[#e4ddcc] bg-white py-[5px] pr-4 pl-[5px] text-[15px] leading-[23px] font-medium text-ink"
          >
            <span className="rounded-full bg-[#1f6b3a] px-3 py-1 text-[14px] leading-[21px] font-bold text-white">
              {hero.announcement.label}
            </span>
            {hero.announcement.text}
          </Link>
        ) : null}

        <p className="text-[15px] leading-[23px] font-bold tracking-[0.14em] text-[#1f7a3f] uppercase">
          {hero.eyebrow}
        </p>

        <h1
          id="home-hero-title"
          className="m-0 font-display text-[50px] leading-[0.96] font-bold tracking-[0.005em] text-[#0f2a1a] uppercase md:text-[clamp(64px,7.78vw,112px)]"
        >
          <span data-line className="block animate-line-up md:whitespace-nowrap" style={delay(120)}>
            Picked in
            <span
              aria-hidden="true"
              data-ptr="12"
              className="relative -top-[0.05em] mx-2 inline-block h-[42px] w-[96px] rounded-full bg-[#bfe3c7] align-middle md:mx-[0.18em] md:h-[0.82em] md:w-[1.93em]"
            >
              <Image
                src={images.home.harvestBasketCutout.src}
                width={images.home.harvestBasketCutout.width}
                height={images.home.harvestBasketCutout.height}
                alt=""
                sizes="(min-width: 768px) 160px, 72px"
                loading="eager"
                className="absolute bottom-[4%] left-1/2 h-[128%] w-auto max-w-none -translate-x-1/2 animate-pill-pop drop-shadow-[0_10px_12px_rgba(0,0,0,0.25)]"
                style={delay(650)}
              />
            </span>
            the
          </span>
          <span data-line className="block animate-line-up md:whitespace-nowrap" style={delay(260)}>
            Himalayas
            <span
              aria-hidden="true"
              data-ptr="12"
              className="relative -top-[0.05em] mx-2 inline-block h-[42px] w-[96px] overflow-hidden rounded-full bg-[#f6dcb6] align-middle md:mx-[0.18em] md:h-[0.82em] md:w-[1.93em]"
            >
              {/* The panorama is shown at full pill height and pans end to end, back and forth. */}
              <span className="absolute inset-y-0 left-0 block w-max animate-pan-x motion-reduce:animate-none">
                <Image
                  src={images.home.harvestPanorama.src}
                  width={images.home.harvestPanorama.width}
                  height={images.home.harvestPanorama.height}
                  alt=""
                  sizes="(min-width: 768px) 520px, 240px"
                  loading="eager"
                  className="h-[42px] w-auto max-w-none animate-pill-pop md:h-[0.82em]"
                  style={delay(810)}
                />
              </span>
            </span>
          </span>
          <span data-line className="block animate-line-up md:whitespace-nowrap" style={delay(400)}>
            for you.
          </span>
        </h1>

        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-7 pt-[6px] md:pt-[18px]">
          <p className="m-0 max-w-[580px] flex-[1_1_420px] text-[17px] leading-[1.6] text-[#3b4239] md:text-[19px]">
            {hero.lead}
          </p>
          <div className="flex w-full flex-col items-stretch gap-[14px] md:w-auto md:flex-[0_1_auto] md:items-end">
            <div className="flex w-full flex-wrap gap-[14px] md:w-auto">
              <Link
                href={hero.primaryCta.href}
                data-mag
                className="inline-flex h-[62px] flex-[1_1_100%] items-center justify-center rounded-full bg-[#f4a12e] px-8 font-display text-[19px] font-semibold tracking-[0.04em] text-[#1b1a12] uppercase md:flex-none"
              >
                {hero.primaryCta.label}
              </Link>
              <Link
                href={hero.secondaryCta.href}
                data-mag
                className="inline-flex h-[62px] flex-[1_1_100%] items-center justify-center rounded-full border-2 border-[#0f2a1a] px-[30px] font-display text-[19px] font-semibold tracking-[0.04em] text-[#0f2a1a] uppercase md:flex-none"
              >
                {hero.secondaryCta.label}
              </Link>
            </div>
            <p className="inline-flex flex-wrap items-center gap-x-2 gap-y-[6px] text-[15px] leading-[23px] text-[#4d5249]">
              {showSocialProof ? (
                <>
                  <span
                    role="img"
                    aria-label="Rated 5 out of 5 by customers"
                    className="tracking-[2px] text-[#f4a12e]"
                  >
                    ★★★★★
                  </span>
                  <strong className="text-[#0f2a1a]">{hero.socialProof}</strong>
                  <span aria-hidden="true">·</span>
                </>
              ) : null}
              {hero.trustNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
