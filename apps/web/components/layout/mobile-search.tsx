"use client";

import { SearchIcon } from "@northnectar/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { HeaderSearch } from "./header-search";

/**
 * Search icon for the mobile header. Tapping it opens the search field under the header. Without
 * JavaScript it is a plain link to the shop.
 */
export function MobileSearch() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close after navigating (e.g. submitting a search).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector("input")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setOpen((o) => !o);
  };

  return (
    <>
      <Link
        href="/shop"
        prefetch={false}
        role="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="mobile-search-panel"
        aria-label={open ? "Close search" : "Search products"}
        className="grid size-11 place-items-center rounded-full text-ink hover:bg-[#f1ebde]"
      >
        <SearchIcon size={22} />
      </Link>
      <div
        id="mobile-search-panel"
        ref={panelRef}
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-[#e8dfcc] bg-[#fbf8f1] px-4 pt-1 pb-3 shadow-[0_12px_24px_rgba(15,42,26,0.08)]"
      >
        <HeaderSearch id="search-mobile" size="mobile" />
      </div>
    </>
  );
}
