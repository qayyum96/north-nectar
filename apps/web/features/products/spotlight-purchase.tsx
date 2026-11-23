"use client";

import { getDefaultVariant } from "@northnectar/data/utils";
import { CheckIcon, cn, formatPkr } from "@northnectar/ui";
import { IntentLink as Link } from "@/components/ui/intent-link";
import { useId, useState } from "react";
import { useAddToCart } from "@/features/cart/use-add-to-cart";
import { productPath } from "@/lib/routes";
import type { PurchasableProduct } from "./purchasable";

/**
 * Spotlight size cards + buttons, exactly as the mockup: 104x68 size cards (1.5px border, 12px
 * radius), then "Add to cart · Rs X" and "View details" (54px, 10px radius).
 */
export function SpotlightPurchase({ product }: { product: PurchasableProduct }) {
  const [variantId, setVariantId] = useState(() => getDefaultVariant(product)?.id);
  const variant = product.variants.find((v) => v.id === variantId);
  const { add, added } = useAddToCart(product);
  const name = useId();
  const soldOut = !variant || variant.stock <= 0;

  return (
    <>
      {product.variants.length > 1 ? (
        <fieldset className="pt-[6px]">
          <legend className="sr-only">Size for {product.name}</legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const checked = v.id === variantId;
              const out = v.stock <= 0;
              return (
                <label key={v.id} className={out ? "cursor-not-allowed" : "cursor-pointer"}>
                  <input
                    type="radio"
                    name={name}
                    value={v.id}
                    checked={checked}
                    disabled={out}
                    onChange={() => setVariantId(v.id)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "flex min-w-[104px] flex-col items-start gap-[2px] rounded-[12px] border-[1.5px] px-4 py-[10px] text-left peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest-600",
                      checked ? "border-forest-600 bg-white" : "border-[#d8ccb3] bg-[#fbf6ea]",
                      out && "opacity-50",
                    )}
                  >
                    <span className="text-[15px] leading-[23px] font-bold text-ink">{v.label}</span>
                    <span className="text-[14px] leading-[21px] text-[#5e5a4e] tabular-nums">
                      {out ? "Sold out" : formatPkr(v.price)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          disabled={soldOut}
          onClick={() => variant && add(variant)}
          className={cn(
            "inline-flex h-[54px] cursor-pointer items-center gap-2 rounded-[10px] px-[30px] text-[16px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-55",
            added ? "bg-[#3d7a4f]" : "bg-forest-600 hover:bg-forest-800",
          )}
        >
          {added ? <CheckIcon size={18} className="shrink-0" /> : null}
          {soldOut ? "Sold out" : added ? "Added" : `Add to cart · ${formatPkr(variant.price)}`}
        </button>
        <Link
          href={productPath(product.slug)}
          className="inline-flex h-[54px] items-center rounded-[10px] bg-[#e6dac2] px-6 text-[16px] font-semibold text-ink hover:bg-[#ddd0b4]"
        >
          View details<span className="sr-only">: {product.name}</span>
        </Link>
        <span className="sr-only" role="status" aria-live="polite">
          {added && variant ? `${product.name}, ${variant.label}, added to your cart` : ""}
        </span>
      </div>
    </>
  );
}
