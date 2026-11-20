import { ChevronRightIcon } from "@northnectar/ui/icons";
import Image from "next/image";
import Link from "next/link";
import { homeContent } from "@/content/home";
import { images } from "@/lib/images";

/** "From the valleys of Gilgit-Baltistan" (mockup values; mobile base, `md:` desktop). */
export function OriginSplit() {
  const { origin } = homeContent;
  const [photoA, photoB] = origin.photos;
  const { branchPatternCream, leafCutout1, leafCutout2 } = images.decor;

  return (
    <section aria-labelledby="origin-title" className="px-4 py-14 md:px-8 md:py-24">
      <div className="relative mx-auto max-w-[1320px]">
        {/* Leaves overlapping the card edge, with scroll parallax. */}
        <Image
          src={leafCutout1.src}
          width={leafCutout1.width}
          height={leafCutout1.height}
          alt=""
          aria-hidden="true"
          data-px="0.22"
          sizes="120px"
          className="pointer-events-none absolute -top-[46px] left-[58%] z-[2] h-auto w-[70px] rotate-[58deg] drop-shadow-[0_14px_16px_rgba(0,0,0,0.25)] md:left-[30%] md:w-[120px]"
        />
        <Image
          src={leafCutout2.src}
          width={leafCutout2.width}
          height={leafCutout2.height}
          alt=""
          aria-hidden="true"
          data-px="-0.16"
          sizes="110px"
          className="pointer-events-none absolute top-[300px] -left-[34px] z-[2] h-auto w-16 -rotate-[24deg] drop-shadow-[0_14px_16px_rgba(0,0,0,0.25)] md:top-[120px] md:w-[110px]"
        />

        <div className="flex flex-wrap overflow-hidden rounded-[24px] bg-[#f3f1ec]">
          <div className="relative min-h-[380px] min-w-0 flex-[1_1_560px] overflow-hidden bg-[#1f4a2f] md:min-h-[600px]">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-[6px] -translate-y-1/2 rotate-180 font-display text-[64px] leading-[0.95] font-bold whitespace-nowrap text-white uppercase opacity-[0.07] [writing-mode:vertical-rl] md:left-7 md:text-[120px]"
            >
              {origin.watermark}
            </span>
            <Image
              src={branchPatternCream.src}
              width={branchPatternCream.width}
              height={branchPatternCream.height}
              alt=""
              unoptimized
              aria-hidden="true"
              className="pointer-events-none absolute -top-[30px] -right-10 h-auto w-[300px] opacity-[0.12]"
            />
            <Image
              src={branchPatternCream.src}
              width={branchPatternCream.width}
              height={branchPatternCream.height}
              alt=""
              unoptimized
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-[70px] left-[30px] h-auto w-[240px] rotate-[160deg] opacity-[0.08]"
            />
            {photoA ? (
              <div className="absolute top-9 left-[16%] h-[170px] w-[74%] -rotate-4 overflow-hidden rounded-[18px] border-[6px] border-[#f3eadb] shadow-[0_24px_40px_rgba(0,0,0,0.35)] md:top-[72px] md:left-[20%] md:h-[300px] md:w-[62%]">
                <Image
                  src={photoA.src}
                  alt={photoA.alt}
                  fill
                  data-rv="img"
                  sizes="(min-width: 768px) 460px, 74vw"
                  className="object-cover"
                />
              </div>
            ) : null}
            {photoB ? (
              <div className="absolute right-[8%] bottom-[30px] h-[160px] w-[46%] rotate-5 overflow-hidden rounded-[18px] border-[6px] border-[#f3eadb] shadow-[0_24px_40px_rgba(0,0,0,0.35)] md:right-[9%] md:bottom-16 md:h-[250px] md:w-[40%]">
                <Image
                  src={photoB.src}
                  alt={photoB.alt}
                  fill
                  data-rv="img"
                  sizes="(min-width: 768px) 300px, 46vw"
                  className="object-cover object-[center_30%]"
                />
              </div>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-[1_1_460px] flex-col justify-center gap-5 px-[22px] pt-9 pb-10 md:px-[72px] md:py-16">
            <h2
              id="origin-title"
              data-rv="mask"
              className="m-0 font-display text-[34px] leading-[1.12] font-bold text-[#1f4a2f] uppercase md:text-[54px]"
            >
              {origin.title}
            </h2>
            <p className="m-0 max-w-[480px] text-[17px] leading-[1.7] text-[#3f4a40]">
              {origin.text}
            </p>
            <ul className="m-0 grid list-none grid-cols-2 gap-6 p-0 pt-2">
              {origin.features.map((feature) => (
                <li key={feature.title} className="flex flex-col gap-[10px]">
                  <Image
                    src={feature.icon.src}
                    width={feature.icon.width}
                    height={feature.icon.height}
                    alt=""
                    unoptimized
                    className="h-12 w-auto self-start"
                  />
                  <h3 className="m-0 text-[18px] leading-[27px] font-bold text-[#1f4a2f]">
                    {feature.title}
                  </h3>
                  <p className="m-0 text-[15px] leading-[1.55] text-[#5e5a4e]">{feature.text}</p>
                </li>
              ))}
            </ul>
            <Link
              href={origin.cta.href}
              className="mt-3 inline-flex h-[52px] items-center gap-[10px] self-start rounded-[10px] border-[1.5px] border-[#9dbb93] bg-white px-[26px] text-[16px] font-bold text-ink hover:border-forest-600"
            >
              {origin.cta.label} <ChevronRightIcon size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
