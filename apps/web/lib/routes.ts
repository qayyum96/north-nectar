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

export type PrimaryNavKey = "home" | "shop" | "about" | "blog" | "contact";

export const primaryNav: (NavLink & { key: PrimaryNavKey })[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "shop", label: "Shop", href: "/shop" },
  { key: "about", label: "Our story", href: "/about" },
  { key: "blog", label: "Blog", href: "/blog" },
  { key: "contact", label: "Contact", href: "/contact" },
];

export const categoryPath = (slug: string) => `/shop/${slug}`;

/** Blog article URL. */
export const postPath = (slug: string) => `/blog/${slug}`;

/** Product page URL, optionally preselecting a size (`?size=250g`). */
export const productPath = (slug: string, sizeLabel?: string) =>
  sizeLabel
    ? `/products/${slug}?size=${encodeURIComponent(sizeLabel.toLowerCase())}`
    : `/products/${slug}`;

export const wholesaleEnquiryPath = (productSlug?: string) =>
  productSlug ? `/contact?subject=wholesale&product=${productSlug}` : "/contact?subject=wholesale";

export const footerHelpLinks: NavLink[] = [
  { label: "Shipping and delivery", href: "/shipping-policy" },
  { label: "Returns", href: "/refund-policy" },
  { label: "FAQ", href: "/contact#faq" },
  { label: "Contact us", href: "/contact" },
];

/** Legal links in the footer's bottom row. */
export const footerLegalLinks: NavLink[] = [
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms-and-conditions" },
];

export const footerCompanyLinks: NavLink[] = [
  { label: "Our story", href: "/about" },
  { label: "How we source", href: "/about#how-we-source" },
  { label: "Blog and guides", href: "/blog" },
  { label: "Wholesale and export", href: wholesaleEnquiryPath() },
];
