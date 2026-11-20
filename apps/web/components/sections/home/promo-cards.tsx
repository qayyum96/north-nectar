import type { Product } from "@northnectar/types";
import { cn, formatPkr } from "@northnectar/ui";
import { getMinPrice } from "@northnectar/data/utils";
import Image from "next/image";
import Link from "next/link";
import { productPath } from "@/lib/routes";

export interface Promo {
  product: Product;
  eyebrow: string;
  title: string;
  text: string;
  tone: "peach" | "dark";
}

/** Promo cards (mockup: whole card is a link, 24px radius, 220px image; 120px on mobile). */
export function PromoCards({ promos }: { promos: Promo[] }) {
  if (promos.length === 0) return null;

  return (
    <section aria-label="Featured products" className="px-4 pb-14 md:px-8 md:pb-24">
      <div
        data-rv="rise"
        className={cn("mx-auto grid max-w-[1320px] gap-6", promos.length > 1 && "md:grid-cols-2")}
      >
        {promos.map(({ product, eyebrow, title, text, tone }) => {
          const dark = tone === "dark";
          const minPrice = getMinPrice(product);
          const image = product.images[0];
          return (
            <Link
              key={product.id}
              href={productPath(product.slug)}
              className={cn(
                "flex items-center gap-6 overflow-hidden rounded-[24px] px-5 py-6 md:py-9 md:pr-9 md:pl-11",
                dark ? "on-dark bg-ink text-[#efe2c4]" : "bg-[#f6e2c8] text-ink",
              )}
            >
              <span className="flex flex-auto flex-col gap-3">
                <span
                  className={cn(
                    "text-[14px] leading-[21px] font-bold tracking-[0.12em] uppercase",
                    dark ? "text-[#d1ae6c]" : "text-[#8a4513]",
                  )}
                >
                  {eyebrow}
                </span>
                <span
                  className={cn(
                    "font-display text-[24px] leading-[1.2] font-bold uppercase md:text-[30px]",
                    dark && "text-white",
                  )}
                >
                  {title}
                </span>
                <span
                  className={cn(
                    "text-[15px] leading-[1.55]",
                    dark ? "text-[#d9cdb0]" : "text-[#4b3f30]",
                  )}
                >
                  {text}
                </span>
                {minPrice !== null ? (
                  <span className="text-[15px] leading-[23px]">
                    From{" "}
                    <strong className={cn("tabular-nums", dark && "text-white")}>
                      {formatPkr(minPrice)}
                    </strong>
                  </span>
                ) : null}
                <span
                  className={cn(
                    "mt-[6px] inline-flex h-[46px] items-center self-start rounded-[10px] px-[22px] text-[15px] font-bold",
                    dark ? "bg-[#d1ae6c] text-[#1a3a23]" : "bg-forest-600 text-white",
                  )}
                >
                  Shop now
                </span>
              </span>
              {image ? (
                <span className="relative size-[120px] flex-none overflow-hidden rounded-[18px] bg-white md:size-[220px]">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    data-rv="img"
                    sizes="(min-width: 768px) 220px, 120px"
                    className="object-cover"
                  />
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
