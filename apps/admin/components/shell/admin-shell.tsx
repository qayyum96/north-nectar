"use client";

import { cn } from "@northnectar/ui";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { signOut } from "@/app/(auth)/actions";
import { Icon } from "@/components/icon";
import type { NavGroup } from "@/lib/nav";

export interface ShellNotification {
  id: string;
  kind: "order" | "message";
  title: string;
  detail: string;
  href: string;
  time: string;
}

export interface ShellProps {
  nav: NavGroup[];
  counts: { orders: number; messages: number };
  notifications: ShellNotification[];
  staff: { name: string; email: string; role: string; initials: string };
  storefrontUrl: string;
  children: ReactNode;
}

const isActive = (href: string, pathname: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

function Sidebar({
  nav,
  counts,
  storefrontUrl,
  onNavigate,
}: Pick<ShellProps, "nav" | "counts" | "storefrontUrl"> & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const storeHost = storefrontUrl.replace(/^https?:\/\//, "");
  return (
    <div className="flex flex-col gap-[14px] px-3 pt-[14px] pb-5">
      {nav.map((group, gi) => (
        <div key={group.label ?? gi} className="flex flex-col gap-[2px]">
          {group.label ? (
            <span className="text-admin-label px-[10px] pb-1 text-[14px] font-semibold">
              {group.label}
            </span>
          ) : null}
          {group.items.map((item) => {
            const active = isActive(item.href, pathname);
            const count = item.badge ? counts[item.badge] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[34px] items-center gap-[10px] rounded-[9px] px-[10px] text-[14px]",
                  active
                    ? "text-admin-text bg-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                    : "text-admin-nav font-medium hover:bg-[#ebebe9]",
                )}
              >
                <Icon name={item.icon} />
                <span className="flex-1">{item.label}</span>
                {count > 0 ? (
                  <span className="h-5 min-w-[22px] rounded-full bg-[#dfe7dc] px-[7px] text-center text-[14px] leading-5 font-semibold text-[#1d4a2c]">
                    {count}
                    <span className="sr-only">
                      {" "}
                      {item.badge === "orders" ? "to confirm" : "unread"}
                    </span>
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
      <a
        href={storefrontUrl}
        target="_blank"
        rel="noreferrer"
        className="text-admin-text mt-[6px] flex items-center gap-[10px] rounded-[10px] border border-[#dcdcd8] bg-white p-[10px] hover:border-[#c7c7c2]"
      >
        <Image
          src="/images/emblem-green.svg"
          alt=""
          width={1488}
          height={660}
          unoptimized
          className="h-[22px] w-auto"
        />
        <span className="flex flex-col leading-[1.3]">
          <span className="font-semibold">View online store</span>
          <span className="text-admin-muted">{storeHost}</span>
        </span>
      </a>
    </div>
  );
}

/** Small menu anchored to its trigger; closes on outside click and Escape. */
function Dropdown({
  trigger,
  children,
}: {
  trigger: (state: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open ? children(() => setOpen(false)) : null}
    </div>
  );
}

const iconButton =
  "relative grid size-10 cursor-pointer place-items-center rounded-[10px] border-0 bg-transparent text-white hover:bg-white/10";

/**
 * Admin chrome from the mockup: dark 56px top bar (logo, search with Ctrl K, notifications,
 * account) and the grey sidebar, which becomes a slide-over menu below 768px.
 */
export function AdminShell({
  nav,
  counts,
  notifications,
  staff,
  storefrontUrl,
  children,
}: ShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close the mobile menu after navigating.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (searchRef.current && searchRef.current.offsetParent !== null) searchRef.current.focus();
        else router.push("/search");
      }
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <div className="bg-admin-bg min-h-screen">
      <header className="bg-admin-topbar sticky top-0 z-40 grid h-14 grid-cols-[1fr_auto] items-center gap-4 px-2 text-white md:grid-cols-[240px_1fr_240px] md:px-4">
        <div className="flex min-w-0 items-center gap-[10px]">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="admin-nav"
            className={cn(iconButton, "md:hidden")}
          >
            <Icon name="menu" size={22} />
          </button>
          <Link href="/" className="flex min-w-0 items-center gap-[10px] rounded-[8px]">
            <Image
              src="/images/emblem-cream.svg"
              alt=""
              width={1488}
              height={660}
              unoptimized
              priority
              className="h-6 w-auto"
            />
            <span className="text-[15px] font-bold whitespace-nowrap">North Nectar</span>
          </Link>
        </div>

        <form
          action="/search"
          role="search"
          className="hidden w-full max-w-[560px] justify-self-center md:block"
        >
          <label className="flex h-[38px] items-center gap-[10px] rounded-[10px] border border-[#3a3a3a] bg-[#2b2b2b] px-3 text-[#b5b5b5] focus-within:border-[#6b6b68]">
            <Icon name="search" size={16} />
            <input
              ref={searchRef}
              name="q"
              type="search"
              aria-label="Search the admin"
              placeholder="Search orders, products, customers"
              className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-white outline-none placeholder:text-[#b5b5b5]"
            />
            <kbd className="rounded-[6px] border border-[#4a4a4a] px-[6px] py-px font-sans text-[14px] text-[#b5b5b5]">
              Ctrl K
            </kbd>
          </label>
        </form>

        <div className="flex items-center gap-2 justify-self-end">
          <Link href="/search" aria-label="Search" className={cn(iconButton, "md:hidden")}>
            <Icon name="search" size={20} />
          </Link>

          <Dropdown
            trigger={({ open, toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-label={
                  notifications.length
                    ? `Notifications, ${notifications.length} new`
                    : "Notifications"
                }
                className={iconButton}
              >
                <Icon name="bell" size={20} />
                {notifications.length ? (
                  <span className="absolute top-2 right-[9px] size-2 rounded-full bg-[#f4a12e] shadow-[0_0_0_2px_#1a1a1a]" />
                ) : null}
              </button>
            )}
          >
            {(close) => (
              <div className="border-admin-line text-admin-text absolute top-12 right-0 z-50 w-[340px] max-w-[calc(100vw-16px)] overflow-hidden rounded-[12px] border bg-white shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
                <p className="border-admin-line-soft m-0 border-b px-4 py-3 font-semibold">
                  Notifications
                </p>
                {notifications.length === 0 ? (
                  <p className="text-admin-muted m-0 px-4 py-6 text-center">
                    You&apos;re all caught up.
                  </p>
                ) : (
                  <ul className="m-0 max-h-[360px] list-none overflow-y-auto p-0">
                    {notifications.map((n) => (
                      <li key={n.id} className="border-admin-line-soft border-b last:border-0">
                        <Link
                          href={n.href}
                          onClick={close}
                          className="hover:bg-admin-panel flex gap-3 px-4 py-3"
                        >
                          <span className="mt-[2px] grid size-8 shrink-0 place-items-center rounded-full bg-[#eef3ec] text-forest-600">
                            <Icon name={n.kind === "order" ? "orders" : "messages"} size={16} />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="flex justify-between gap-2">
                              <span className="font-semibold">{n.title}</span>
                              <span className="text-admin-muted shrink-0">{n.time}</span>
                            </span>
                            <span className="text-admin-muted truncate">{n.detail}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Dropdown>

          <Dropdown
            trigger={({ open, toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-label="Account menu"
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[10px] border-0 bg-transparent px-[6px] text-[14px] text-white hover:bg-white/10"
              >
                <span className="inline-flex size-[30px] items-center justify-center rounded-[8px] bg-[#2f7d45] font-bold">
                  {staff.initials}
                </span>
                <span className="hidden font-semibold md:inline">{staff.name.split(" ")[0]}</span>
              </button>
            )}
          >
            {() => (
              <div className="border-admin-line text-admin-text absolute top-12 right-0 z-50 w-[260px] overflow-hidden rounded-[12px] border bg-white shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
                <div className="border-admin-line-soft border-b px-4 py-3">
                  <p className="m-0 font-semibold">{staff.name}</p>
                  <p className="text-admin-muted m-0 truncate">{staff.email}</p>
                  <p className="text-admin-muted m-0 mt-1 capitalize">{staff.role}</p>
                </div>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="hover:bg-admin-panel flex w-full cursor-pointer items-center gap-[10px] border-0 bg-transparent px-4 py-3 text-left text-[14px] font-semibold"
                  >
                    <Icon name="logout" size={16} /> Sign out
                  </button>
                </form>
              </div>
            )}
          </Dropdown>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-56px)] items-stretch">
        <nav
          aria-label="Admin"
          className="border-admin-line bg-admin-panel sticky top-14 hidden h-[calc(100vh-56px)] w-60 shrink-0 self-start overflow-y-auto border-r md:block"
        >
          <Sidebar nav={nav} counts={counts} storefrontUrl={storefrontUrl} />
        </nav>

        {menuOpen ? (
          <div className="fixed inset-x-0 top-14 bottom-0 z-[45] md:hidden">
            <button
              type="button"
              aria-label="Close menu"
              tabIndex={-1}
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 cursor-default border-0 bg-[rgba(20,20,18,0.45)]"
            />
            <nav
              id="admin-nav"
              aria-label="Admin"
              className="border-admin-line bg-admin-panel relative h-full w-[280px] overflow-y-auto border-r"
            >
              <Sidebar
                nav={nav}
                counts={counts}
                storefrontUrl={storefrontUrl}
                onNavigate={() => setMenuOpen(false)}
              />
            </nav>
          </div>
        ) : null}

        <main id="main" className="min-w-0 flex-1 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
