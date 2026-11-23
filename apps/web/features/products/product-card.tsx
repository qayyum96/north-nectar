import type { Product } from "@northnectar/types";
import { cn } from "@northnectar/ui";
import Image from "next/image";
import { IntentLink as Link } from "@/components/ui/intent-link";
import { productPath, wholesaleEnquiryPath } from "@/lib/routes";
import { ProductCardPurchase } from "./product-card-purchase";
import { toPurchasable } from "./purchasable";
import { WishlistButton } from "./wishlist-button";

export const PRODUCT_CARD_SIZES =
  "(min-width: 1384px) 282px, (min-width: 1024px) 21vw, (min-width: 768px) 30vw, 44vw";

const BADGE_TONES: Record<string, string> = {
  green: "bg-forest-600 text-white",
  orange: "bg-[#b2561a] text-white",
  kraft: "bg-[#efe2c4] text-ink",
  dark: "bg-ink text-white",
};

/**
 * Product card, matched to the mockup: full card from 768px (image padded 14px, tagline, size chips,
 * 46px button) and the compact card below it (8px image padding, 15px type, "Add" button).
 * The product name is a stretched link, so the whole card is clickable with one tab stop.
 */
export function ProductCard({
  product,
  categoryName,
  headingLevel: Heading = "h3",
  className,
}: {
  product: Product;
  categoryName?: string;
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const image = product.images[0];
  const href = productPath(product.slug);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col gap-3 overflow-hidden rounded-[18px] border border-[#e8dfcc] bg-white pb-4 transition-[translate,box-shadow,border-color] duration-[600ms,600ms,400ms] ease-out-expo hover:-translate-y-[6px] hover:border-[#d6c9a8] hover:shadow-[0_24px_44px_-18px_rgba(31,42,33,0.28)] motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <div className="relative border-b border-[#f0e9da] bg-white">
        <div className="relative aspect-square p-2 md:p-[14px]">
          {image ? (
            <div className="relative h-full w-full">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes={PRODUCT_CARD_SIZES}
                className="object-contain transition-[scale] duration-[900ms] ease-out-expo group-hover:scale-[1.06] motion-reduce:group-hover:scale-100"
              />
            </div>
          ) : null}
        </div>
        {product.badge ? (
          <span
            className={cn(
              "absolute top-3 left-3 rounded-full px-[11px] py-1 text-[14px] leading-[21px] font-bold",
              BADGE_TONES[product.badge.tone],
            )}
          >
            {product.badge.label}
          </span>
        ) : null}
        <WishlistButton productId={product.id} productName={product.name} />
      </div>

      <div className="flex flex-col gap-[6px] px-3 pt-1 md:px-4">
        {categoryName ? (
          <p className="text-[14px] leading-[21px] font-semibold text-[#4e6a52]">{categoryName}</p>
        ) : null}
        <Heading className="m-0 text-[15px] leading-[1.3] font-bold md:text-[17px]">
          <Link
            href={href}
            className="text-ink after:absolute after:inset-0 after:z-0 focus-visible:outline-none focus-visible:after:rounded-[18px] focus-visible:after:outline-3 focus-visible:after:-outline-offset-3 focus-visible:after:outline-forest-600"
          >
            {product.name}
          </Link>
        </Heading>
        <p className="m-0 hidden text-[14px] leading-[1.5] text-[#5e5a4e] md:block">
          {product.tagline}
        </p>
      </div>

      {product.purchaseMode === "quote" ? (
        <>
          <p className="-mt-[6px] px-3 pt-[2px] text-[15px] font-bold text-[#5e5a4e] md:px-4 md:text-[18px]">
            Bulk supply only
          </p>
          <div className="relative z-10 mt-auto px-3 pt-1 md:px-4">
            <Link
              href={wholesaleEnquiryPath(product.slug)}
              className="inline-flex h-10 w-full items-center justify-center rounded-[10px] bg-[#efe7d6] text-[15px] font-bold text-ink md:h-[46px]"
            >
              Request a quote
            </Link>
          </div>
        </>
      ) : (
        <ProductCardPurchase product={toPurchasable(product)} />
      )}
    </article>
  );
}
