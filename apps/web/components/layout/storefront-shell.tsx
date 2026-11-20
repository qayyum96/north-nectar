import type { ReactNode } from "react";
import { Motion } from "@/components/motion/motion";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/** Header + main landmark + footer, shared by every storefront route group. */
export function StorefrontShell({
  newsletter,
  children,
}: {
  newsletter: "light" | "dark" | "none";
  children: ReactNode;
}) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-forest-600 px-5 py-3 font-bold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter newsletter={newsletter} />
      {/* Keeps the end of the footer clear of the fixed mobile tab bar. */}
      <div
        aria-hidden="true"
        className="h-[calc(4rem+env(safe-area-inset-bottom))] bg-[#1a3a23] lg:hidden"
      />
      <Motion />
    </>
  );
}
