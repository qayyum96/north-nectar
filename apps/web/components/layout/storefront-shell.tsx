import type { ReactNode } from "react";
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
    </>
  );
}
