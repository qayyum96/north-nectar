"use client";

import type { ProductVariant } from "@northnectar/types";
import { useEffect, useRef, useState } from "react";
import type { PurchasableProduct } from "@/features/products/purchasable";
import { useCartStore } from "./store";

/**
 * Adds a product variant to the cart and exposes a short-lived `added` flag for button
 * feedback ("Added ✓"), as in the mockup.
 */
export function useAddToCart(product: PurchasableProduct) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const add = (variant: ProductVariant, quantity = 1) => {
    addItem(
      {
        productId: product.id,
        variantId: variant.id,
        slug: product.slug,
        name: product.name,
        variantLabel: variant.label,
        unitPrice: variant.price,
        image: product.image,
      },
      quantity,
    );
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 2200);
  };

  return { add, added };
}
