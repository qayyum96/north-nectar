import type { Product } from "@northnectar/types";
import { CheckIcon } from "@northnectar/ui/icons";
import Image from "next/image";
import { homeContent } from "@/content/home";
import { SpotlightPurchase } from "@/features/products/spotlight-purchase";
import { StepsList } from "@/features/products/steps-list";
import { toPurchasable } from "@/features/products/purchasable";
import { images } from "@/lib/images";

/** Signature product spotlight + brewing card (mockup values; mobile base, `md:` desktop). */
export function ProductSpotlight({ product }: { product: Product | null }) {
  if (!product || product.purchaseMode !== "retail") return null;
  const { spotlight } = homeContent;
  const image = product.images[0];

  return (
    <section
      aria-labelledby="spotlight-title"
      className="relative overflow-hidden bg-[#f3eadb] px-4 py-14 md:px-8 md:py-24"
    >
      <Image
        src={images.decor.seaBuckthornBranch.src}
        width={images.decor.seaBuckthornBranch.width}
        height={images.decor.seaBuckthornBranch.height}
        alt=""
        unoptimized
        aria-hidden="true"
        className="pointer-events-none absolute top-10 -right-10 h-[420px] w-auto -scale-x-100 opacity-[0.08]"
      />
      <div className="relative mx-auto flex max-w-[1320px] flex-col gap-14 md:gap-24">
        <div className="flex flex-wrap items-center gap-x-[72px] gap-y-10">
          {image ? (
            <div className="min-w-0 flex-[1_1_460px]">
              <div className="relative h-[340px] overflow-hidden rounded-[24px] md:h-[600px]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  data-rv="img"
                  sizes="(min-width: 1384px) 644px, (min-width: 768px) 48vw, 92vw"
                  className="object-cover"
                />
              </div>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-[18px]">
            <p className="text-[14px] leading-[21px] font-bold tracking-[0.14em] text-[#4e6a52] uppercase">
              {spotlight.eyebrow}
            </p>
            <h2
              id="spotlight-title"
              data-rv="mask"
              className="m-0 font-display text-[34px] leading-[1.15] font-semibold uppercase md:text-[54px]"
            >
              {spotlight.title}
            </h2>
            <p className="m-0 text-[17px] leading-[26px] text-[#4e6a52] italic">
              {spotlight.subtitle}
            </p>
            <p className="m-0 text-[17px] leading-[1.7] text-[#4b473d]">
              {spotlight.description ?? product.description[0]}
            </p>
            <ul className="m-0 flex list-none flex-col gap-[10px] p-0">
              {product.highlights.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-[10px] text-[16px] leading-6 font-semibold"
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex size-6 flex-none items-center justify-center rounded-full bg-forest-600 text-white"
                  >
                    <CheckIcon size={14} strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <SpotlightPurchase product={toPurchasable(product)} />
          </div>
        </div>

        {product.howToUse.length > 0 ? (
          <div className="flex flex-col gap-8 rounded-[24px] bg-white px-5 py-7 md:px-12 md:py-11">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="m-0 font-display text-[24px] leading-[1.5] font-semibold uppercase md:text-[30px]">
                {spotlight.brewTitle}
              </h3>
              <p className="text-[15px] leading-[23px] text-[#5e5a4e]">{spotlight.brewNote}</p>
            </div>
            <StepsList steps={product.howToUse} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
