"use client";

import { useEffect } from "react";
import type { VariantCatalog } from "@/lib/commerce/variant-catalog";
import { useCartStore } from "./store";

/**
 * Restores the persisted cart after the first client render (avoids hydration mismatches), brings
 * every line up to date with the live catalogue (price, name, stock), and keeps the cart in sync
 * across browser tabs.
 */
export function CartProvider({ catalog }: { catalog: VariantCatalog }) {
  useEffect(() => {
    const restore = async () => {
      await useCartStore.persist.rehydrate();
      useCartStore.getState().syncWithCatalog(catalog);
    };
    void restore();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "nn-cart") void restore();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [catalog]);

  return null;
}
