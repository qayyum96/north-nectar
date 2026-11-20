"use client";

import { cn } from "@northnectar/ui";
import { ArrowRightIcon, ChevronDownIcon } from "@northnectar/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { primaryNav, type NavGroup, type PrimaryNavKey } from "@/lib/routes";

function activeKey(pathname: string): PrimaryNavKey | null {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/shop") || pathname.startsWith("/products")) return "shop";
  if (pathname.startsWith("/about")) return "about";
  if (pathname.startsWith("/contact")) return "contact";
  return null;
}

const itemClass = (active: boolean) =>
  cn(
    "inline-flex h-11 items-center px-4 text-[16px] font-semibold text-ink transition-colors hover:text-forest-600",
    active ? "shadow-[inset_0_-2px_0_#234c2e]" : "shadow-[inset_0_-2px_0_transparent]",
  );

/** Desktop navigation (lg and up). The mobile equivalent is <MobileMenu />. */
export function MainNav({ shopMenu }: { shopMenu: NavGroup[] }) {
  const pathname = usePathname();
  const current = activeKey(pathname);

  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {primaryNav.map((item) =>
          item.key === "shop" ? (
            <ShopMenu
              key={item.key}
              groups={shopMenu}
              active={current === "shop"}
              isPage={pathname === "/shop"}
            />
          ) : (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={
                  pathname === item.href ? "page" : current === item.key ? "true" : undefined
                }
                className={itemClass(current === item.key)}
              >
                {item.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

/**
 * "Shop" item with a disclosure panel: "Shop" stays a normal link to /shop, and the chevron
 * button toggles the panel (keyboard and touch). Pointer hover also opens it.
 */
function ShopMenu({
  groups,
  active,
  isPage,
}: {
  groups: NavGroup[];
  active: boolean;
  isPage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // A mouse click right after hover-opening should keep the panel open, not toggle it shut.
  const openedByHover = useRef(false);
  const pathname = usePathname();

  // Close whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  const hasGroups = groups.length > 0;

  // Hover (mouse only), Escape and focus-leave behaviour, attached natively so the list item
  // stays a plain, non-interactive element in the markup.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !hasGroups) return;
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      openedByHover.current = true;
      setOpen(true);
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      openedByHover.current = false;
      setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!root.contains(e.relatedTarget as Node | null)) setOpen(false);
    };
    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("keydown", onKey);
    root.addEventListener("focusout", onFocusOut);
    return () => {
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("keydown", onKey);
      root.removeEventListener("focusout", onFocusOut);
    };
  }, [hasGroups]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <li
      ref={rootRef}
      className={cn(
        "relative flex items-center",
        active ? "shadow-[inset_0_-2px_0_#234c2e]" : "shadow-[inset_0_-2px_0_transparent]",
      )}
    >
      <Link
        href="/shop"
        aria-current={isPage ? "page" : active ? "true" : undefined}
        className={cn(itemClass(false), hasGroups && "pr-[6px]")}
      >
        Shop
      </Link>
      {hasGroups ? (
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => {
            if (openedByHover.current) {
              openedByHover.current = false;
              setOpen(true);
              return;
            }
            setOpen((v) => !v);
          }}
          className="inline-flex h-11 cursor-pointer items-center pr-4 text-ink hover:text-forest-600"
        >
          <span className="sr-only">Shop categories</span>
          <ChevronDownIcon
            size={16}
            className={cn("transition-transform duration-200", open && "rotate-180")}
          />
        </button>
      ) : null}

      {hasGroups ? (
        <div
          id={panelId}
          hidden={!open}
          className="absolute top-full left-1/2 z-50 w-max max-w-[min(56rem,calc(100vw-4rem))] -translate-x-1/2 pt-3"
        >
          <div className="rounded-panel border border-line bg-white p-7 shadow-card-hover">
            <div
              className="grid gap-x-10 gap-y-6"
              style={{
                gridTemplateColumns: `repeat(${Math.min(groups.length, 4)}, minmax(10rem, 1fr))`,
              }}
            >
              {groups.map((group) => (
                <div key={group.href}>
                  <Link
                    href={group.href}
                    className="font-display text-lg font-semibold tracking-wide text-forest-900 uppercase hover:text-forest-600"
                  >
                    {group.title}
                  </Link>
                  <ul className="mt-3 space-y-1">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="inline-flex min-h-11 items-center text-md text-subtle hover:text-forest-600 hover:underline"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-line pt-4">
              <Link
                href="/shop"
                className="inline-flex min-h-11 items-center gap-2 font-bold text-forest-600 hover:underline"
              >
                Shop all products <ArrowRightIcon size={18} />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </li>
  );
}
