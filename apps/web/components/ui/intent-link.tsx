"use client";

import Link from "next/link";
import { type ComponentProps, useState } from "react";

/**
 * A `next/link` that downloads the target page only once the visitor shows intent (hover, touch or
 * keyboard focus) instead of as soon as the link scrolls into view. Use it for links that appear in
 * long lists (product cards, categories, footer, page sections): with the default, scrolling the
 * home page prefetched about 17 pages at once, which competed with images on slow connections and
 * made scrolling stutter on phones. Clicks still feel instant because hover/touch happens just
 * before the click. Pattern from the Next.js prefetching guide ("Hover-triggered prefetch").
 */
export function IntentLink({
  prefetch,
  onMouseEnter,
  onTouchStart,
  onFocus,
  ...props
}: ComponentProps<typeof Link>) {
  const [intent, setIntent] = useState(false);
  return (
    <Link
      {...props}
      prefetch={intent ? (prefetch ?? null) : false}
      onMouseEnter={(e) => {
        setIntent(true);
        onMouseEnter?.(e);
      }}
      onTouchStart={(e) => {
        setIntent(true);
        onTouchStart?.(e);
      }}
      onFocus={(e) => {
        setIntent(true);
        onFocus?.(e);
      }}
    />
  );
}
