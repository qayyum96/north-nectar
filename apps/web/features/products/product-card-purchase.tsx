"use client";

import { getDefaultVariant } from "@northnectar/data/utils";
import { BagIcon, CheckIcon, cn, formatPkr } from "@northnectar/ui";
import { useId, useState } from "react";
import { useAddToCart } from "@/features/cart/use-add-to-cart";
import type { PurchasableProduct } from "./purchasable";

/**
 * Interactive part of the product card (mockup values): price row, 34px size chips (desktop) and the
 * add-to-cart button (46px desktop / 40px "Add" on mobile). Rendered as direct children of the card
 * <article> so the card's flex gaps match the mockup. Controls sit above the stretched link (z-10).
 */
export function ProductCardPurchase({ product }: { product: PurchasableProduct }) {
  const [variantId, setVariantId] = useState(() => getDefaultVariant(product)?.id);
  const variant = product.variants.find((v) => v.id === variantId);
  const { add, added } = useAddToCart(product);
  const name = useId();

  const prices = product.variants.map((v) => v.price);
  const range =
    prices.length > 1
      ? `${formatPkr(Math.min(...prices))} to ${formatPkr(Math.max(...prices))}`
      : null;
  const onSale = variant?.compareAtPrice && variant.compareAtPrice > variant.price;
  const soldOut = !variant || variant.stock <= 0;

  return (
    <>
      {/* Price row: belongs to the info block above (6px gap there vs 12px card gap). */}
      <p className="-mt-[6px] flex flex-wrap items-baseline gap-2 px-3 pt-[2px] md:px-4">
        {variant ? (
          <>
            <span className="text-[15px] font-bold text-ink tabular-nums md:hidden">
              {range ?? formatPkr(variant.price)}
            </span>
            <span className="hidden text-[18px] font-bold text-ink tabular-nums md:inline">
              {formatPkr(variant.price)}
            </span>
            {onSale ? (
              <s
                className={cn(
                  "text-[14px] text-[#6f6a5d] tabular-nums",
                  range && "hidden md:inline",
                )}
              >
                <span className="sr-only">Was </span>
                {formatPkr(variant.compareAtPrice!)}
              </s>
            ) : null}
          </>
        ) : null}
      </p>

      {product.variants.length > 1 ? (
        <fieldset className="relative z-10 hidden px-4 md:block">
          <legend className="sr-only">Size for {product.name}</legend>
          <div className="flex flex-wrap gap-[6px]">
            {product.variants.map((v) => {
              const checked = v.id === variantId;
              const out = v.stock <= 0;
              return (
                <label
                  key={v.id}
                  className={cn("relative", out ? "cursor-not-allowed" : "cursor-pointer")}
                >
                  <input
                    type="radio"
                    name={name}
                    value={v.id}
                    checked={checked}
                    disabled={out}
                    onChange={() => setVariantId(v.id)}
                    className="peer sr-only"
                  />
                  {/* 34px chip as designed; the ::before extends the tap area vertically. */}
                  <span
                    className={cn(
                      "relative inline-flex h-[34px] min-w-[52px] items-center justify-center rounded-full border px-3 text-[14px] font-semibold peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest-600 before:absolute before:inset-x-0 before:-inset-y-[5px] before:content-['']",
                      checked
                        ? "border-forest-600 bg-forest-600 text-white"
                        : "border-[#d8ccb3] bg-white text-ink",
                      out && "line-through opacity-50",
                    )}
                  >
                    {v.label}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="relative z-10 mt-auto px-3 pt-1 md:px-4">
        <button
          type="button"
          disabled={soldOut}
          onClick={() => variant && add(variant)}
          className={cn(
            "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-55 md:h-[46px]",
            added ? "bg-[#3d7a4f]" : "bg-forest-600 hover:bg-forest-800",
          )}
        >
          {added ? (
            <CheckIcon size={18} className="shrink-0" />
          ) : (
            <BagIcon size={18} className="shrink-0" />
          )}
          {soldOut ? (
            "Sold out"
          ) : added ? (
            "Added"
          ) : (
            <>
              <span className="md:hidden">Add</span>
              <span className="hidden md:inline">Add to cart</span>
            </>
          )}
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {added && variant ? `${product.name}, ${variant.label}, added to your cart` : ""}
        </span>
      </div>
    </>
  );
}
