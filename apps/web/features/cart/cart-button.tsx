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
        className="relative grid size-11 place-items-center rounded-full text-forest-900 hover:bg-sand-200"
      >
        <BagIcon size={24} />
        {hydrated && count > 0 ? (
          <span
            aria-hidden="true"
            className="absolute top-0.5 right-0 grid min-w-5 place-items-center rounded-full bg-forest-600 px-1 text-sm leading-5 font-bold text-white"
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
      className="inline-flex h-12 items-center gap-2.5 rounded-full bg-forest-600 pr-2 pl-5 font-bold text-white transition-colors hover:bg-forest-800"
    >
      <BagIcon size={20} />
      <span>Cart</span>
      <span
        aria-hidden="true"
        className={cn(
          "grid size-8 place-items-center rounded-full bg-kraft text-sm font-bold text-forest-900 tabular-nums",
          !hydrated && "opacity-0",
        )}
      >
        {hydrated ? count : 0}
      </span>
    </Link>
  );
}
