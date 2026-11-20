"use client";

import { BagIcon, CheckIcon, buttonVariants, formatPkr } from "@northnectar/ui";
import type { ButtonStyleOptions } from "@northnectar/ui";
import type { ProductVariant } from "@northnectar/types";

/** Add-to-cart button with "Added" feedback, sold-out state and a live announcement. */
export function AddToCartButton({
  variant,
  added,
  onAdd,
  label = "Add to cart",
  showPrice = false,
  quantity = 1,
  className,
  style,
}: {
  variant: ProductVariant | undefined;
  added: boolean;
  onAdd: (variant: ProductVariant) => void;
  label?: string;
  /** Appends " · Rs 1,150" (price × quantity). */
  showPrice?: boolean;
  quantity?: number;
  className?: string;
  style?: Omit<ButtonStyleOptions, "className">;
}) {
  const soldOut = !variant || variant.stock <= 0;
  return (
    <>
      <button
        type="button"
        disabled={soldOut}
        onClick={() => variant && onAdd(variant)}
        className={buttonVariants({
          shape: "rounded",
          fullWidth: true,
          ...style,
          className: added ? `bg-forest-400 hover:bg-forest-400 ${className ?? ""}` : className,
        })}
      >
        {added ? <CheckIcon size={18} /> : <BagIcon size={18} />}
        {soldOut ? "Sold out" : added ? "Added" : label}
        {showPrice && variant && !soldOut && !added ? (
          <span className="-ml-1 tabular-nums">· {formatPkr(variant.price * quantity)}</span>
        ) : null}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {added && variant ? `${variant.label} added to your cart` : ""}
      </span>
    </>
  );
}
