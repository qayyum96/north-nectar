import type { ReactNode } from "react";
import { StorefrontShell } from "@/components/layout/storefront-shell";

/** Home page group: same shell, with the light newsletter band shown in the mockup. */
export default function HomeLayout({ children }: { children: ReactNode }) {
  return <StorefrontShell newsletter="light">{children}</StorefrontShell>;
}
