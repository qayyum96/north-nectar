import Image from "next/image";
import Link from "next/link";
import { homeContent } from "@/content/home";
import { siteConfig } from "@/lib/seo/config";

/** Gold wholesale band (mockup values; mobile base, `md:` desktop). */
export function WholesaleBand() {
  const { wholesale } = homeContent;
  return (
    <section aria-labelledby="wholesale-title" className="px-4 pb-14 md:px-8 md:pb-24">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-stretch overflow-hidden rounded-[28px] bg-[#d1ae6c]">
        <div className="flex flex-[1_1_568px] flex-col justify-center gap-[14px] px-6 pt-9 pb-2 text-[#1a3a23] md:flex-[1_1_632px] md:p-14">
          <p className="text-[14px] leading-[21px] font-bold tracking-[0.14em] uppercase">
            {wholesale.eyebrow}
          </p>
          <h2
            id="wholesale-title"
            data-rv="mask"
            className="m-0 font-display text-[34px] leading-[1.15] font-bold uppercase md:text-[54px]"
          >
            {wholesale.title}
          </h2>
          <p className="m-0 max-w-[520px] text-[17px] leading-[1.6] text-[#2c3a26]">
            {wholesale.text}
          </p>
          <div className="flex flex-wrap gap-3 pt-[6px]">
            <Link
              href={wholesale.primaryCta.href}
              className="inline-flex h-[54px] items-center rounded-[10px] bg-forest-600 px-7 text-[16px] font-bold text-white hover:bg-forest-800"
            >
              {wholesale.primaryCta.label}
            </Link>
            <a
              href={siteConfig.contact.whatsappUrl}
              className="inline-flex h-[54px] items-center rounded-[10px] bg-[#e3c88f] px-6 text-[16px] font-bold text-[#1a3a23] hover:bg-[#ecd6a6]"
            >
              {wholesale.secondaryCta.label}
            </a>
          </div>
        </div>
        <div className="grid flex-[1_1_468px] grid-cols-2 gap-3 px-6 pt-4 pb-7 md:flex-[1_1_448px] md:py-7 md:pr-7 md:pl-0">
          {wholesale.photos.map((photo) => (
            <div
              key={photo.src}
              className="relative aspect-square overflow-hidden rounded-[16px] bg-white"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                data-rv="img"
                sizes="(min-width: 768px) 264px, 45vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
