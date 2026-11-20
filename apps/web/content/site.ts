import { siteConfig } from "@/lib/seo/config";
import { type CommerceSettings, deliveryFacts } from "@northnectar/data/commerce-settings";
import { formatPkr } from "@northnectar/ui";

/** Static copy shared by the layout (top bar, footer, newsletter). Page copy lives next to each page. */

export const topBar = {
  contact: `Call or WhatsApp ${siteConfig.contact.phoneDisplay}`,
  wholesale: { label: "Wholesale and export", href: "/contact?subject=wholesale" },
};

export const footerCopy = {
  blurb: "Nature from the mountains of Gilgit-Baltistan. Picked by hand and packed at source.",
  copyright: (year: number) => `© ${year} ${siteConfig.name}. All rights reserved.`,
};

export const newsletterCopy = {
  light: {
    title: "Join the North Nectar circle",
    text: "Harvest news, recipes and first access to new batches.",
  },
  dark: {
    title: "Join the North Nectar circle",
    text: "Harvest news, brewing tips and first access to new batches.",
  },
};

/** Top bar promos from Settings > Shipping and Payments. */
export function topBarPromos(settings: CommerceSettings) {
  const f = deliveryFacts(settings);
  const free = f.freeOver !== null ? formatPkr(f.freeOver) : null;
  return {
    promos: [
      free
        ? `Free delivery on orders over ${free}`
        : `Delivery across Pakistan from ${formatPkr(f.minRate)}`,
      f.cod ? "Cash on delivery nationwide" : null,
    ].filter((p): p is string => p !== null),
    mobile: [
      free ? `Free delivery over ${free}` : "Delivery across Pakistan",
      f.cod ? "Cash on delivery" : null,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}
