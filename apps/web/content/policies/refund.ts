import { commerceConfig } from "@/lib/constants/commerce";
import { siteConfig } from "@/lib/seo/config";
import type { PolicyDocument } from "./types";

// DRAFT placeholder text for a Pakistan-based store. Replace before setting status to "final".
const days = commerceConfig.structuredData.returnDays;
const { contact } = siteConfig;

export const refundPolicy: PolicyDocument = {
  path: "/refund-policy",
  title: "Refund and Return Policy",
  shortTitle: "Refund and return policy",
  metaDescription: `North Nectar returns and refunds: unopened products within ${days} days, and damaged or wrong items replaced or refunded. Refunds by bank transfer, JazzCash or Easypaisa.`,
  status: "final",
  lastUpdated: "2026-11-24",
  intro:
    "We want you to be happy with every pouch. Because our products are natural foods and herbs, we handle returns carefully to keep everyone's orders safe and hygienic.",
  sections: [
    {
      heading: "Damaged, wrong or missing items",
      paragraphs: [
        "If your order arrives damaged, leaking, or with a wrong or missing item, contact us within 48 hours of delivery with your order number and clear photos of the parcel and the products. We will send a replacement or give you a full refund, including any delivery charge.",
      ],
    },
    {
      heading: `Change of mind (${days} days)`,
      paragraphs: [
        `You can return unopened products in their original, sealed packaging within ${days} days of delivery. Tell us first on WhatsApp or by email so we can arrange the return.`,
      ],
      list: [
        "Products must be unused, unopened and in resaleable condition.",
        "The return delivery charge is paid by the customer unless the item was faulty or wrong.",
        "The original delivery charge is not refundable for change-of-mind returns.",
      ],
    },
    {
      heading: "Items we can't take back",
      list: [
        "Opened or partly used food, herbal and tea products, for hygiene and safety reasons.",
        "Products damaged after delivery through incorrect storage.",
        "Wholesale, bulk and custom orders, unless they arrive damaged or wrong.",
      ],
    },
    {
      heading: "Quality concerns",
      paragraphs: [
        "Natural products vary from harvest to harvest in colour, size and aroma. If you are unhappy with the quality of an item, contact us within 48 hours with photos and we will review it with you.",
      ],
    },
    {
      heading: "How refunds are paid",
      paragraphs: [
        "Once we receive and check a returned item (or approve a claim for a damaged one), we refund you within 7 working days. Cash on delivery orders are refunded by bank transfer, JazzCash or Easypaisa to an account in your name. Orders paid by bank transfer or mobile wallet are refunded to the same account.",
      ],
    },
    {
      heading: "Cancelling an order",
      paragraphs: [
        "You can cancel free of charge until your order is dispatched. Once it has been handed to the courier, it can be returned under this policy instead.",
      ],
    },
    {
      heading: "Contact",
      paragraphs: [
        `To start a return or claim, WhatsApp ${contact.phoneDisplay} or email ${contact.email} with your order number.`,
      ],
    },
  ],
};
