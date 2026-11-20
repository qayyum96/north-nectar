"use client";

import { HeartIcon, cn } from "@northnectar/ui";
import { GridIcon, HomeIcon, MenuIcon } from "@northnectar/ui/icons";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";
import { useWishlist } from "@/features/wishlist/store";
import type { NavGroup } from "@/lib/routes";

/** The menu panel starts closed, so its code loads after the page becomes interactive. */
const MobileMenuPanel = dynamic(
  () => import("./mobile-menu-panel").then((m) => m.MobileMenuPanel),
  { ssr: false },
);

type IconType = ComponentType<{ size?: number; className?: string; fill?: string }>;

function TabInner({
  icon: Icon,
  label,
  active,
  badge,
}: {
  icon: IconType;
  label: string;
  active: boolean;
  badge?: number;
}) {
  return (
    <>
      <span
        className={cn(
          "relative inline-flex h-8 w-14 items-center justify-center rounded-full transition-colors",
          active ? "bg-[#e7efe2] text-forest-600" : "text-[#4d4a40]",
        )}
      >
        <Icon size={22} fill={active && Icon === HeartIcon ? "currentColor" : undefined} />
        {badge ? (
          <span
            aria-hidden="true"
            className="absolute -top-[6px] right-[2px] h-5 min-w-5 rounded-full bg-[#b2561a] px-[5px] text-center text-[14px] leading-5 font-bold text-white"
          >
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "text-[14px] leading-none",
          active ? "font-bold text-forest-600" : "font-semibold text-[#4d4a40]",
        )}
      >
        {label}
      </span>
    </>
  );
}

const tabClass =
  "flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 border-0 bg-transparent";

/**
 * App-style bottom navigation for phones and tablets (below lg): Home, Shop, Wishlist and Menu
 * (which opens the slide-out panel with the other pages and contact details).
 */
export function MobileTabBar({ shopMenu }: { shopMenu: NavGroup[] }) {
  const pathname = usePathname();
  const wishlist = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs = [
    { href: "/", label: "Home", icon: HomeIcon, active: pathname === "/" },
    {
      href: "/shop",
      label: "Shop",
      icon: GridIcon,
      active: pathname.startsWith("/shop") || pathname.startsWith("/products"),
    },
    {
      href: "/wishlist",
      label: "Wishlist",
      icon: HeartIcon,
      active: pathname === "/wishlist",
      badge: wishlist.length,
    },
  ];

  return (
    <>
      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e8dfcc] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_rgba(15,42,26,0.08)] lg:hidden"
      >
        <ul className="m-0 mx-auto grid h-16 max-w-xl list-none grid-cols-4 p-0">
          {tabs.map((tab) => (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={tab.active ? "page" : undefined}
                aria-label={tab.badge ? `${tab.label}, ${tab.badge} saved` : undefined}
                className={tabClass}
              >
                <TabInner icon={tab.icon} label={tab.label} active={tab.active} badge={tab.badge} />
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              className={tabClass}
            >
              <TabInner icon={MenuIcon} label="Menu" active={menuOpen} />
            </button>
          </li>
        </ul>
      </nav>
      <MobileMenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} shopMenu={shopMenu} />
    </>
  );
}
