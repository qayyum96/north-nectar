import type { IconName } from "@/components/icon";
import type { StaffRole } from "@/lib/auth";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  /** Key of a live count shown as a badge (e.g. pending orders). */
  badge?: "orders" | "messages";
  /** Roles that may open it (all staff when omitted). */
  roles?: StaffRole[];
  /** Phase that builds the page (shown on the placeholder until then). */
  phase: number;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

/**
 * Sidebar from the admin mockup. "Reviews" and "Pages and banners" are hidden until they are
 * designed (decision of 20 Nov 2026).
 */
export const NAV: NavGroup[] = [
  { items: [{ label: "Dashboard", href: "/", icon: "home", phase: 1 }] },
  {
    label: "Sales",
    items: [
      { label: "Orders", href: "/orders", icon: "orders", badge: "orders", phase: 2 },
      { label: "Customers", href: "/customers", icon: "customers", phase: 2 },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { label: "Products", href: "/products", icon: "products", phase: 3 },
      { label: "Categories", href: "/categories", icon: "categories", phase: 3 },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Stock", href: "/stock", icon: "stock", phase: 4 },
      {
        label: "Purchases",
        href: "/purchases",
        icon: "purchases",
        roles: ["owner", "manager"],
        phase: 4,
      },
      {
        label: "Suppliers",
        href: "/suppliers",
        icon: "suppliers",
        roles: ["owner", "manager"],
        phase: 4,
      },
      { label: "Stock movements", href: "/movements", icon: "movements", phase: 4 },
    ],
  },
  {
    label: "Website",
    items: [
      { label: "Messages", href: "/messages", icon: "messages", badge: "messages", phase: 2 },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        label: "Reports",
        href: "/reports",
        icon: "reports",
        roles: ["owner", "manager"],
        phase: 5,
      },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Store", href: "/settings/store", icon: "store", roles: ["owner"], phase: 5 },
      {
        label: "Payments",
        href: "/settings/payments",
        icon: "payments",
        roles: ["owner"],
        phase: 5,
      },
      {
        label: "Shipping",
        href: "/settings/shipping",
        icon: "shipping",
        roles: ["owner"],
        phase: 5,
      },
      { label: "Team and roles", href: "/settings/team", icon: "team", roles: ["owner"], phase: 5 },
    ],
  },
];

export function navFor(role: StaffRole): NavGroup[] {
  return NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.roles || i.roles.includes(role)),
  })).filter((g) => g.items.length > 0);
}

export function findNavItem(pathname: string): { group?: string; item: NavItem } | null {
  for (const g of NAV) {
    for (const item of g.items) {
      if (
        item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(`${item.href}/`)
      ) {
        return { group: g.label, item };
      }
    }
  }
  return null;
}
