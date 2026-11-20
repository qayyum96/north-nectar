"use client";

import dynamic from "next/dynamic";

/**
 * The drawer starts closed, so its code loads right after the page becomes interactive instead of
 * being part of the first render and hydration (less main-thread work on every page).
 */
export const CartDrawerLazy = dynamic(() => import("./cart-drawer").then((m) => m.CartDrawer), {
  ssr: false,
});
