import Image from "next/image";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { FloatingLeaf } from "@/components/decor/floating-leaf";
import { Eyebrow } from "@/components/sections/page-heading";
import { aboutContent } from "@/content/about";
import { images } from "@/lib/images";

const photoFrame =
  "absolute overflow-hidden rounded-[20px] border-[6px] border-[#f3eadb] shadow-[0_26px_44px_rgba(0,0,0,0.4)]";

/** Dark hero with the tilted photo stack (mockup values: mobile base, `md:` desktop). */
export function AboutHero() {
  const { hero } = aboutContent;
  const [basket, flatlay] = hero.images;

  return (
    <section
      aria-labelledby="about-title"
      className="on-dark relative overflow-hidden bg-[radial-gradient(at_80%_15%,#22573a_0%,#12321f_45%,#0b2114_100%)] text-white"
    >
      <Image
        src={images.decor.mountainsCream.src}
        width={images.decor.mountainsCream.width}
        height={images.decor.mountainsCream.height}
        alt=""
        aria-hidden="true"
        unoptimized
        className="pointer-events-none absolute -bottom-5 -left-10 h-auto w-[700px] max-w-none opacity-10 md:w-[1300px]"
      />
      <div className="relative mx-auto flex max-w-[1384px] flex-wrap items-center gap-x-14 gap-y-10 px-4 pt-7 pb-12 md:px-8 md:pt-16 md:pb-20">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-5">
          <Breadcrumbs tone="dark" items={[{ name: "Our story", path: "/about" }]} />
          <Eyebrow tone="dark">{hero.eyebrow}</Eyebrow>
          <h1
            id="about-title"
            data-rv="mask"
            className="m-0 font-display text-[52px] leading-[0.96] font-bold uppercase md:text-[96px]"
          >
            {hero.title} <span className="text-[#d1ae6c]">{hero.highlight}</span>
          </h1>
          <p className="m-0 max-w-[560px] text-[17px] leading-[1.65] text-[#c9d3c4] md:text-[19px]">
            {hero.lead}
          </p>
        </div>

        <div className="relative h-[340px] min-w-0 flex-[1_1_460px] md:h-[520px]">
          <FloatingLeaf
            image={images.decor.leaf2}
            rotate={-30}
            duration={3.4}
            width={120}
            className="-top-[10px] -left-[10px] z-[3] w-[70px] md:w-[120px]"
            imageClassName="drop-shadow-[0_14px_16px_rgba(0,0,0,0.4)]"
          />
          <FloatingLeaf
            image={images.decor.leaf3}
            rotate={18}
            duration={4.1}
            delay={-0.5}
            width={170}
            className="-right-[10px] bottom-[6px] z-[3] w-[110px] md:w-[170px]"
            imageClassName="drop-shadow-[0_14px_16px_rgba(0,0,0,0.4)]"
          />
          {/* The mockup sizes the photos as content-box percentages, so the 6px borders are added. */}
          <span
            data-rv="img"
            className={`${photoFrame} top-[6%] left-0 h-[calc(58%+12px)] w-[calc(74%+12px)] -rotate-4 bg-[#f3eadb]`}
          >
            <Image
              src={basket.src}
              alt={basket.alt}
              fill
              priority
              sizes="(min-width: 768px) 460px, 75vw"
              className="object-cover"
            />
          </span>
          <span
            data-rv="img"
            className={`${photoFrame} right-0 bottom-[4%] h-[calc(56%+12px)] w-[calc(52%+12px)] rotate-5 bg-[#f3eadb]`}
          >
            <Image
              src={flatlay.src}
              alt={flatlay.alt}
              fill
              sizes="(min-width: 768px) 330px, 55vw"
              className="object-cover object-[center_30%]"
            />
          </span>
        </div>
      </div>
    </section>
  );
}
