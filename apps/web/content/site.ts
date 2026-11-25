import { siteConfig } from "@/lib/seo/config";
import { type CommerceSettings, deliveryFacts } from "@northnectar/data/commerce-settings";

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

/**
 * Top bar promos from Settings > Payments. The delivery promo is per city (it depends on the
 * visitor’s zone), so it is rendered by <DeliveryPromo> in the browser.
 */
export function topBarPromos(settings: CommerceSettings) {
  const f = deliveryFacts(settings);
  return {
    cod: f.cod ? "Cash on delivery nationwide" : null,
  };
}
