import { siteConfig } from "@/lib/seo/config";

/** Shop and category page copy. Nothing here depends on how many products exist. */
export const shopContent = {
  title: "Shop the harvest",
  intro:
    "Pure products from Gilgit-Baltistan, gathered by hand, naturally dried and packed at source.",
  meta: {
    title: "Shop Natural Himalayan Products",
    description:
      "Shop natural Himalayan products from Hunza and Gilgit-Baltistan: wild thyme herbal tea, dried sea buckthorn berries and more. Packed at source, cash on delivery across Pakistan.",
  },
  allLabel: "All products",
  /** Category chip order (mockup: Herbal tea, Herbal roots, Dry fruits, Superfoods); others follow. */
  categoryOrder: ["herbal-tea", "herbal-roots", "dry-fruits", "superfoods"],
  bulk: {
    title: "Buying in bulk?",
    text: "Wholesale and export prices for retailers, hakeems and exporters.",
    cta: `WhatsApp ${siteConfig.contact.phoneDisplay}`,
  },
  wholesale: {
    eyebrow: "For businesses",
    title: "Wholesale and export",
    text: "Bulk herbs, roots, dry fruits and nuts with export-ready packing.",
    primaryCta: { label: "Send an enquiry", href: "/contact?subject=wholesale" },
    secondaryCta: { label: "WhatsApp us" },
  },
  empty: {
    title: "No products match these filters",
    text: "Try a different price range or category.",
    cta: "Clear filters",
  },
};
