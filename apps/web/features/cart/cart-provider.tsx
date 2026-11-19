"use client";

import { useEffect } from "react";
import { useCartStore } from "./store";

/**
 * Restores the persisted cart after the first client render (avoids hydration mismatches)
 * and keeps the cart in sync across browser tabs.
 */
export function CartProvider() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "nn-cart") void useCartStore.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}
