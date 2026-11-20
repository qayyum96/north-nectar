"use client";

import { HeartIcon, cn } from "@northnectar/ui";
import { toggleWishlist, useWishlist } from "@/features/wishlist/store";

export function WishlistButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const ids = useWishlist();
  const saved = ids.includes(productId);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
      onClick={() => toggleWishlist(productId)}
      className={cn(
        "absolute top-[10px] right-[10px] z-10 inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-[#ece4d3] bg-white before:absolute before:-inset-[2px] before:content-['']",
        saved ? "text-[#b2561a]" : "text-ink",
      )}
    >
      <HeartIcon size={19} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
