import { cn } from "@northnectar/ui";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";

const ITEMS: { key: string; label: string; href: string; icon: IconName }[] = [
  { key: "store", label: "Store details", href: "/settings/store", icon: "store" },
  { key: "payments", label: "Payments", href: "/settings/payments", icon: "payments" },
  { key: "shipping", label: "Shipping", href: "/settings/shipping", icon: "shipping" },
  { key: "team", label: "Team and roles", href: "/settings/team", icon: "team" },
];

/** Settings sub-navigation card on the left, the page's cards on the right (mockup). */
export function SettingsFrame({ active, children }: { active: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <nav aria-label="Settings" className="w-full md:w-auto md:min-w-[200px] md:flex-[0_1_240px]">
        <div className="border-admin-line rounded-[12px] border bg-white p-2 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
          <div className="flex flex-row gap-[2px] overflow-x-auto md:flex-col">
            {ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                aria-current={item.key === active ? "page" : undefined}
                className={cn(
                  "text-admin-text flex h-10 shrink-0 items-center gap-[10px] rounded-[10px] px-3 text-[14px] whitespace-nowrap",
                  item.key === active
                    ? "bg-admin-bg font-semibold"
                    : "font-medium hover:bg-[#f7f7f5]",
                )}
              >
                <Icon name={item.icon} size={16} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-4">{children}</div>
    </div>
  );
}
