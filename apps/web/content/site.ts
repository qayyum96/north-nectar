import { siteConfig } from "@/lib/seo/config";
import { commerceConfig } from "@/lib/constants/commerce";
import { formatPkr } from "@northnectar/ui";

/** Static copy shared by the layout (top bar, footer, newsletter). Page copy lives next to each page. */

const freeOver = formatPkr(commerceConfig.freeDeliveryThreshold);

export const topBar = {
  contact: `Call or WhatsApp ${siteConfig.contact.phoneDisplay}`,
  promos: [`Free delivery on orders over ${freeOver}`, "Cash on delivery nationwide"],
  mobile: `Free delivery over ${freeOver} · Cash on delivery`,
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
