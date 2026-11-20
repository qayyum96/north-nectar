"use client";

import { Drawer, buttonVariants } from "@northnectar/ui";
import { ChatIcon, ChevronRightIcon, MailIcon, PhoneIcon } from "@northnectar/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav, type NavGroup } from "@/lib/routes";
import { siteConfig } from "@/lib/seo/config";

/** The slide-out panel of the mobile menu. Loaded lazily by <MobileMenu>. */
export function MobileMenuPanel({
  open,
  onClose: close,
  shopMenu,
}: {
  open: boolean;
  onClose: () => void;
  shopMenu: NavGroup[];
}) {
  const pathname = usePathname();
  return (
    <Drawer open={open} onClose={close} title="Menu" side="left" closeLabel="Close menu">
      <nav aria-label="Mobile" className="px-5 py-4">
        <ul className="divide-y divide-line">
          {primaryNav.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                onClick={close}
                aria-current={pathname === item.href ? "page" : undefined}
                className="flex min-h-14 items-center justify-between font-display text-display-sm font-semibold text-forest-900 uppercase aria-[current=page]:text-forest-600"
              >
                {item.label}
                <ChevronRightIcon size={20} className="text-subtle" />
              </Link>
            </li>
          ))}
        </ul>

        {shopMenu.length > 0 ? (
          <div className="mt-6">
            <p className="text-sm font-bold tracking-eyebrow text-leaf-600 uppercase">
              Shop by category
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {shopMenu.map((group) => (
                <li key={group.href}>
                  <Link
                    href={group.href}
                    onClick={close}
                    className="inline-flex min-h-11 items-center rounded-full border border-line-strong bg-white px-4 text-md font-semibold text-ink"
                  >
                    {group.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-8 space-y-1 rounded-card bg-sand-100 p-4">
          <a
            href={`tel:${siteConfig.contact.phoneE164}`}
            className="flex min-h-11 items-center gap-3 text-md text-ink"
          >
            <PhoneIcon size={18} className="text-forest-600" /> {siteConfig.contact.phoneDisplay}
          </a>
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="flex min-h-11 items-center gap-3 text-md text-ink"
          >
            <MailIcon size={18} className="text-forest-600" /> {siteConfig.contact.email}
          </a>
          <a
            href={siteConfig.contact.whatsappUrl}
            className={buttonVariants({
              variant: "primary",
              size: "md",
              fullWidth: true,
              className: "mt-3",
            })}
          >
            <ChatIcon size={18} /> WhatsApp us
          </a>
        </div>
      </nav>
    </Drawer>
  );
}
