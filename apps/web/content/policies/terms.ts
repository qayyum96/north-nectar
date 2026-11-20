import { siteConfig } from "@/lib/seo/config";
import type { PolicyDocument } from "./types";

// DRAFT placeholder text for a Pakistan-based store. Replace before setting status to "final".
const { contact, address } = siteConfig;

export const termsAndConditions: PolicyDocument = {
  path: "/terms-and-conditions",
  title: "Terms and Conditions",
  shortTitle: "Terms and conditions",
  metaDescription:
    "The terms that apply when you use the North Nectar website and buy our natural Himalayan products.",
  status: "draft",
  lastUpdated: "2026-11-20",
  intro: `These terms apply when you use ${siteConfig.domain} and buy from ${siteConfig.name}. By placing an order you agree to them, so please read them carefully.`,
  sections: [
    {
      heading: "About us",
      paragraphs: [
        `${siteConfig.name} sells natural products from Gilgit-Baltistan, packed at our unit at ${address.display}.`,
      ],
    },
    {
      heading: "Products",
      paragraphs: [
        "Our products are natural and hand-gathered, so colour, size, texture and aroma can vary between harvests and may differ slightly from the photos. Weights shown are net weights at the time of packing.",
        "Product information is for general use only and is not medical advice. If you are pregnant, breastfeeding, taking medication or have a medical condition, please check with a doctor before using herbal products.",
      ],
    },
    {
      heading: "Prices",
      paragraphs: [
        "All prices are in Pakistani rupees (PKR) and include applicable taxes. Delivery charges are shown at checkout. We may change prices at any time, but the price you see when you place your order is the price you pay.",
      ],
    },
    {
      heading: "Orders",
      paragraphs: [
        "Your order is an offer to buy. We accept it when we dispatch it. We may decline or cancel an order, for example if a product is out of stock, a price was shown incorrectly, or we cannot confirm a cash on delivery order. If you have already paid, we refund you in full.",
      ],
    },
    {
      heading: "Payment",
      paragraphs: [
        "You can pay by cash on delivery, bank transfer, JazzCash or Easypaisa. Orders paid by bank transfer or mobile wallet are dispatched once payment is received.",
      ],
    },
    {
      heading: "Delivery, returns and refunds",
      paragraphs: [
        "Delivery is covered by our Shipping Policy, and returns and refunds by our Refund and Return Policy. Both form part of these terms.",
      ],
    },
    {
      heading: "Wholesale and export",
      paragraphs: [
        "Wholesale, bulk and export orders are agreed separately in writing, including prices, quantities, payment and delivery terms.",
      ],
    },
    {
      heading: "Use of the website",
      paragraphs: [
        `All content on this website, including text, photos, logos and designs, belongs to ${siteConfig.name} and may not be copied or used without our written permission. Please don't misuse the site, for example by trying to access it in ways other than through the normal interface.`,
      ],
    },
    {
      heading: "Our responsibility",
      paragraphs: [
        "We take care to describe and deliver our products accurately. Nothing in these terms limits your rights under the consumer protection laws that apply to you. Otherwise, our responsibility for any order is limited to the amount you paid for it.",
      ],
    },
    {
      heading: "Governing law",
      paragraphs: [
        "These terms are governed by the laws of Pakistan. We will always try to resolve any problem with you directly first.",
      ],
    },
    {
      heading: "Changes and contact",
      paragraphs: [
        `We may update these terms from time to time; the version on this page applies to your order. Questions? Email ${contact.email} or call ${contact.phoneDisplay}.`,
      ],
    },
  ],
};
