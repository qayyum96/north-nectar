/**
 * Client-safe route helpers and static navigation. Keep this file free of data-layer imports:
 * client components import it, and anything imported here ships to the browser.
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

export const categoryPath = (slug: string) => `/shop/${slug}`;

/** Product page URL, optionally preselecting a size (`?size=250g`). */
export const productPath = (slug: string, sizeLabel?: string) =>
  sizeLabel
    ? `/products/${slug}?size=${encodeURIComponent(sizeLabel.toLowerCase())}`
    : `/products/${slug}`;

export const wholesaleEnquiryPath = (productSlug?: string) =>
  productSlug ? `/contact?subject=wholesale&product=${productSlug}` : "/contact?subject=wholesale";

export const footerHelpLinks: NavLink[] = [
  { label: "Shipping and delivery", href: "/contact#faq" },
  { label: "Returns", href: "/contact#faq" },
  { label: "FAQ", href: "/contact#faq" },
  { label: "Contact us", href: "/contact" },
];

export const footerCompanyLinks: NavLink[] = [
  { label: "Our story", href: "/about" },
  { label: "How we source", href: "/about#how-we-source" },
  { label: "Wholesale and export", href: wholesaleEnquiryPath() },
];
