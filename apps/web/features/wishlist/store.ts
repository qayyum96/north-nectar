"use client";

import { useSyncExternalStore } from "react";

/*
 * Wishlist: saved product ids live in localStorage (no account needed). Shared by the heart
 * buttons on product cards, the mobile tab bar badge and the /wishlist page.
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

export function toggleWishlist(id: string) {
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

/** Saved product ids ([] on the server and until the browser has read storage). */
export function useWishlist(): string[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}
