import { siteConfig } from "@/lib/seo/config";
import type { PolicyDocument } from "./types";

// DRAFT placeholder text for a Pakistan-based store. Replace before setting status to "final".
const { contact, address } = siteConfig;

export const privacyPolicy: PolicyDocument = {
  path: "/privacy-policy",
  title: "Privacy Policy",
  shortTitle: "Privacy policy",
  metaDescription:
    "How North Nectar collects, uses and protects your personal information when you shop with us or contact us.",
  status: "final",
  lastUpdated: "2026-11-24",
  intro: `This policy explains what personal information ${siteConfig.name} ("we") collects when you visit ${siteConfig.domain}, place an order or contact us, and how we use and protect it.`,
  sections: [
    {
      heading: "Information we collect",
      list: [
        "Contact details: your name, mobile number and email address.",
        "Delivery details: your address, city, province and postal code.",
        "Order details: the products you buy, payment method and order history. We do not store card numbers.",
        "Messages you send us through the contact form, email or WhatsApp.",
        "Basic technical data such as your browser type and pages visited, used to keep the site secure and working well.",
      ],
    },
    {
      heading: "How we use it",
      list: [
        "To process, deliver and support your orders, including calling or messaging you to confirm cash on delivery orders.",
        "To send order updates by email, SMS or WhatsApp.",
        "To reply to your questions and wholesale enquiries.",
        "To send our newsletter, only if you subscribe. You can unsubscribe at any time.",
        "To prevent fraud and meet our legal and tax obligations.",
      ],
    },
    {
      heading: "Who we share it with",
      paragraphs: [
        "We share only what is needed with the companies that help us run the store: courier partners (to deliver your parcel), banks and mobile wallet providers (to process payments and refunds), and our website, email and hosting providers. We never sell your personal information.",
        "We may disclose information if required by the laws of Pakistan or by a lawful request from the authorities.",
      ],
    },
    {
      heading: "Cookies and local storage",
      paragraphs: [
        "Your cart and wishlist are saved in your own browser so they are still there when you come back. After checkout, a short-lived cookie lets us show your order confirmation. These are essential for the store to work. If we add analytics in future, we will update this policy first.",
      ],
    },
    {
      heading: "How long we keep it",
      paragraphs: [
        "We keep order records for as long as required for accounting and tax purposes, and contact messages for as long as needed to help you. Newsletter details are deleted when you unsubscribe.",
      ],
    },
    {
      heading: "Keeping it safe",
      paragraphs: [
        "Our site uses HTTPS encryption, and access to customer information is limited to the people who need it to fulfil your order.",
      ],
    },
    {
      heading: "Your choices",
      paragraphs: [
        "You can ask us to see, correct or delete the personal information we hold about you, or to stop sending marketing messages. Contact us using the details below.",
      ],
    },
    {
      heading: "Contact",
      paragraphs: [
        `${siteConfig.name}, ${address.display}. Email ${contact.email} or call ${contact.phoneDisplay}.`,
      ],
    },
  ],
};
