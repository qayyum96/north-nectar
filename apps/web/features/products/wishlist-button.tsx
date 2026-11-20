"use client";

import { HeartIcon, cn } from "@northnectar/ui";
import { useSyncExternalStore } from "react";

/*
 * Lightweight wishlist (as shown on the mockup's product cards). Saved product ids live in
 * localStorage; there is no account or wishlist page yet. Kept separate from the cart store.
 */
const KEY = "nn-wishlist";
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

let cache: string[] | null = null;
function snapshot() {
  cache ??= read();
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function toggle(id: string) {
  const ids = snapshot();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode): keep the in-memory state only.
  }
  cache = next;
  listeners.forEach((l) => l());
}

const EMPTY: string[] = [];

export function WishlistButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const ids = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const saved = ids.includes(productId);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
      onClick={() => toggle(productId)}
      className={cn(
        "absolute top-[10px] right-[10px] z-10 inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-[#ece4d3] bg-white before:absolute before:-inset-[2px] before:content-['']",
        saved ? "text-[#b2561a]" : "text-ink",
      )}
    >
      <HeartIcon size={19} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
