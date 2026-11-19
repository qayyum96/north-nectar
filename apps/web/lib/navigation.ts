/**
 * Navigation model shared by the header (desktop mega menu and mobile menu) and the footer.
 *
 * Phase 1 serves a static menu for the two live products. In Phase 2 `getShopMenu()` and
 * `getFooterShopLinks()` are derived from the data layer, so menu entries appear and disappear
 * with active products and categories. Callers are already async for that reason.
 */

export interface NavLink {
  label: string;
  href: string;
}

export interface NavGroup {
  title: string;
  href: string;
  links: NavLink[];
}

export type PrimaryNavKey = "home" | "shop" | "about" | "contact";

export const primaryNav: (NavLink & { key: PrimaryNavKey })[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "shop", label: "Shop", href: "/shop" },
  { key: "about", label: "Our story", href: "/about" },
  { key: "contact", label: "Contact", href: "/contact" },
];

export async function getShopMenu(): Promise<NavGroup[]> {
  return [
    {
      title: "Herbal Tea",
      href: "/shop/herbal-tea",
      links: [{ label: "Wild Thyme Tea (Tumuro)", href: "/products/hunza-wild-thyme-tea" }],
    },
    {
      title: "Superfoods",
      href: "/shop/superfoods",
      links: [{ label: "Sea Buckthorn Berries", href: "/products/dried-sea-buckthorn-berries" }],
    },
  ];
}

export async function getFooterShopLinks(): Promise<NavLink[]> {
  const groups = await getShopMenu();
  return [
    ...groups.map((g) => ({ label: g.title, href: g.href })),
    { label: "All products", href: "/shop" },
  ];
}

export const footerHelpLinks: NavLink[] = [
  { label: "Shipping and delivery", href: "/contact#faq" },
  { label: "Returns", href: "/contact#faq" },
  { label: "FAQ", href: "/contact#faq" },
  { label: "Contact us", href: "/contact" },
];

export const footerCompanyLinks: NavLink[] = [
  { label: "Our story", href: "/about" },
  { label: "How we source", href: "/about#how-we-source" },
  { label: "Wholesale and export", href: "/contact?subject=wholesale" },
];
