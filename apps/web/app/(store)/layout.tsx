import type { ReactNode } from "react";
import { StorefrontShell } from "@/components/layout/storefront-shell";

/** All other storefront pages (shop, product, about, contact, cart, confirmation). */
export default function StoreLayout({ children }: { children: ReactNode }) {
  return <StorefrontShell newsletter="dark">{children}</StorefrontShell>;
}
