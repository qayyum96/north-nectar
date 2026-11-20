"use client";

import { HeartIcon } from "@northnectar/ui";
import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { useWishlist } from "./store";

export interface WishlistItem {
  id: string;
  card: ReactNode;
}

const subscribeNoop = () => () => {};

/**
 * Saved products. Cards are rendered on the server for every active product; the browser shows
 * the ones in the visitor's wishlist (stored locally, no account needed).
 */
export function WishlistGrid({ items }: { items: WishlistItem[] }) {
  const ids = useWishlist();
  // False during the server render and hydration, true once the browser can read storage.
  const ready = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const saved = items.filter((item) => ids.includes(item.id));

  if (!ready) return <div aria-busy="true" className="min-h-[40vh]" />;

  if (saved.length === 0) {
    return (
      <div className="mx-auto flex max-w-[1320px] flex-col items-center gap-4 rounded-[28px] border border-[#e8dfcc] bg-white px-[22px] py-11 text-center md:py-[72px]">
        <span className="inline-flex size-24 items-center justify-center rounded-full bg-[#efe7d6] text-[#b2561a]">
          <HeartIcon size={42} />
        </span>
        <h2 className="m-0 font-display text-[34px] leading-none font-bold text-[#0f2a1a] uppercase md:text-[52px]">
          Nothing saved yet
        </h2>
        <p className="m-0 max-w-[460px] text-[17px] leading-[1.6] text-[#4d4a40]">
          Tap the heart on any product to keep it here for later.
        </p>
        <Link
          href="/shop"
          className="mt-[6px] inline-flex h-[58px] items-center rounded-full bg-forest-600 px-8 font-display text-[18px] font-semibold tracking-[0.04em] text-white uppercase hover:bg-forest-700"
        >
          Shop the harvest
        </Link>
      </div>
    );
  }

  return (
    <ul className="m-0 mx-auto grid max-w-[1320px] list-none grid-cols-2 gap-x-3 gap-y-4 p-0 md:grid-cols-3 md:gap-x-6 md:gap-y-7 lg:grid-cols-4">
      {saved.map((item) => (
        <li key={item.id}>{item.card}</li>
      ))}
    </ul>
  );
}
