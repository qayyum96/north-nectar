"use client";

import { BagIcon, cn } from "@northnectar/ui";
import Link from "next/link";
import type { MouseEvent } from "react";
import { selectCount, useCartStore } from "./store";

/**
 * Header cart trigger. It is a real link to /cart (works without JavaScript); with JavaScript
 * it opens the slide-out drawer instead. The count appears only after the saved cart loads.
 */
export function CartButton({ variant }: { variant: "desktop" | "mobile" }) {
  const count = useCartStore(selectCount);
  const hydrated = useCartStore((s) => s.hasHydrated);
  const open = useCartStore((s) => s.openDrawer);
  const label = hydrated ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart";

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    open();
  };

  if (variant === "mobile") {
    return (
      <Link
        href="/cart"
        onClick={onClick}
        aria-label={label}
        aria-haspopup="dialog"
        className="relative grid size-11 place-items-center rounded-full text-ink"
      >
        <BagIcon size={24} />
        {hydrated && count > 0 ? (
          <span
            aria-hidden="true"
            className="absolute top-[2px] right-0 h-5 min-w-5 rounded-full bg-forest-600 px-[5px] text-center text-[14px] leading-5 font-bold text-white"
          >
            {count}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href="/cart"
      onClick={onClick}
      aria-label={label}
      aria-haspopup="dialog"
      className="inline-flex h-11 items-center gap-[10px] rounded-full bg-forest-600 px-4 text-[15px] font-semibold text-white transition-colors hover:bg-forest-800"
    >
      <BagIcon size={20} />
      <span>Cart</span>
      <span
        aria-hidden="true"
        className={cn(
          "h-[22px] min-w-[22px] rounded-full bg-kraft px-[6px] text-center text-[14px] leading-[22px] font-bold text-ink tabular-nums",
          !hydrated && "opacity-0",
        )}
      >
        {hydrated ? count : 0}
      </span>
    </Link>
  );
}
