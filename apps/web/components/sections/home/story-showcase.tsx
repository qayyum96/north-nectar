import Image from "next/image";
import { homeContent } from "@/content/home";
import { images, videos } from "@/lib/images";
import { StoryPlayer } from "./story-player";

/** Story showcase card. All sizes are the mockup's (mobile base, `md:` desktop). */
export function StoryShowcase() {
  const { story } = homeContent;
  const [left, right] = story.sideImages;

  const sticker =
    "absolute z-[3] flex flex-col items-center justify-center rounded-full font-display text-[#0f2a1a]";

  return (
    <section
      aria-labelledby="story-title"
      className="overflow-x-clip bg-[linear-gradient(#faf7f0_50%,#f1e9da_50%)] px-4 pt-7 pb-12 md:px-8 md:pt-6 md:pb-24"
    >
      <div className="relative mx-auto max-w-[1180px]">
        <p
          aria-hidden="true"
          className={`${sticker} -top-[30px] -left-[6px] size-[86px] -rotate-10 bg-[#ffe13a] shadow-[0_14px_30px_rgba(0,0,0,0.18)] md:-top-11 md:-left-11 md:size-32`}
        >
          <span className="text-[22px] leading-none font-bold md:text-[38px]">
            {story.stickerTop.big}
          </span>
          <span className="text-[14px] leading-[21px] font-semibold tracking-[0.06em] uppercase">
            {story.stickerTop.small}
          </span>
        </p>
        <p
          aria-hidden="true"
          className={`${sticker} -right-[6px] -bottom-[26px] size-[86px] rotate-10 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.16)] md:-right-10 md:bottom-[60px] md:size-32`}
        >
          <span className="text-[22px] leading-none font-bold md:text-[38px]">
            {story.stickerBottom.big}
          </span>
          <span className="text-center text-[14px] leading-[1.15] font-semibold tracking-[0.06em] uppercase">
            {story.stickerBottom.small}
          </span>
        </p>

        <div className="rounded-[44px] bg-[linear-gradient(#2c8a4b_50%,#ffffff_50%)] p-[10px] shadow-[0_30px_60px_-30px_rgba(15,42,26,0.45)]">
          <div className="on-dark relative h-[400px] overflow-hidden rounded-[36px] bg-[radial-gradient(at_50%_38%,#1f5a35_0%,#123a22_45%,#0c2616_100%)] md:h-[560px]">
            <span
              aria-hidden="true"
              className="absolute top-[4%] left-[13%] block w-[50px] -rotate-[24deg] md:w-[90px]"
            >
              <Image
                src={images.decor.leaf2.src}
                width={images.decor.leaf2.width}
                height={images.decor.leaf2.height}
                alt=""
                sizes="90px"
                className="h-auto w-full animate-leaf-float drop-shadow-[0_12px_14px_rgba(0,0,0,0.4)]"
              />
            </span>
            <span
              aria-hidden="true"
              className="absolute right-[9%] bottom-[8%] block w-[90px] rotate-[20deg] md:w-[150px]"
            >
              <Image
                src={images.decor.leaf3.src}
                width={images.decor.leaf3.width}
                height={images.decor.leaf3.height}
                alt=""
                sizes="150px"
                className="h-auto w-full animate-leaf-float drop-shadow-[0_12px_14px_rgba(0,0,0,0.4)] [animation-delay:-1.8s]"
              />
            </span>

            {left ? (
              <div
                data-fan="l"
                className="absolute top-[19%] left-[3%] hidden h-[56%] w-[33%] -rotate-7 overflow-hidden rounded-[18px] border-[6px] border-white bg-white shadow-[0_24px_40px_rgba(0,0,0,0.35)] md:block"
              >
                <Image src={left.src} alt={left.alt} fill sizes="420px" className="object-cover" />
              </div>
            ) : null}
            {right ? (
              <div
                data-fan="r"
                className="absolute top-[21%] right-[3%] hidden h-[56%] w-[33%] rotate-7 overflow-hidden rounded-[18px] border-[6px] border-white bg-white shadow-[0_24px_40px_rgba(0,0,0,0.35)] md:block"
              >
                <Image
                  src={right.src}
                  alt={right.alt}
                  fill
                  sizes="420px"
                  className="object-cover"
                />
              </div>
            ) : null}
            <div
              data-fan="c"
              className="absolute top-[12%] left-1/2 h-[66%] w-[86%] -translate-x-1/2 overflow-hidden rounded-[18px] border-[6px] border-white bg-white shadow-[0_30px_50px_rgba(0,0,0,0.45)] md:top-[9%] md:h-[68%] md:w-1/2"
            >
              <StoryPlayer label={story.label} title={story.title} />
            </div>

            <div className="absolute right-0 bottom-5 left-0 flex items-center justify-center gap-[14px] md:bottom-[26px]">
              <h2
                id="story-title"
                className="m-0 font-display text-[20px] leading-[30px] font-semibold tracking-[0.06em] text-white uppercase"
              >
                {story.title}
              </h2>
              <span className="rounded-full bg-[#ffe13a] px-[14px] py-[6px] text-[14px] leading-[21px] font-bold text-[#0f2a1a]">
                Watch · {videos.story.durationLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
