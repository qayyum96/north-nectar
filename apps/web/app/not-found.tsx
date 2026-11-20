import type { Metadata } from "next";
import { NotFoundContent } from "@/components/layout/not-found-content";
import { StorefrontShell } from "@/components/layout/storefront-shell";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you are looking for has moved or no longer exists.",
  // Next.js adds `noindex` to 404 responses automatically.
};

/** Unmatched URLs: rendered inside the root layout only, so it brings its own header and footer. */
export default function NotFound() {
  return (
    <StorefrontShell newsletter="dark">
      <NotFoundContent />
    </StorefrontShell>
  );
}
