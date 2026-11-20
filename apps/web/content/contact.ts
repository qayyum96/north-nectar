import { enabledPaymentMethods } from "@/lib/constants/commerce";
import { siteConfig } from "@/lib/seo/config";

const { contact, address } = siteConfig;

/** "a, b or c" */
const listOr = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} or ${items.at(-1)}`;

/**
 * Other ways to pay, from the payment config, so this answer never mentions a method that can't be
 * selected at checkout (cards appear here automatically once enabled).
 */
const otherPaymentMethods = listOr(
  enabledPaymentMethods()
    .filter((m) => m.id !== "cod")
    .flatMap((m) => (m.id === "mobile_wallet" ? m.badges : [m.label.toLowerCase()])),
);

/** Copy for /contact. Contact facts come from siteConfig so they stay in one place. */
export const contactContent = {
  meta: {
    title: "Contact Us",
    description: `Questions about an order, a product or wholesale? Call or WhatsApp ${contact.phoneDisplay}, email ${contact.email}, or send us a message. We usually reply within one working day.`,
  },
  hero: {
    title: "Get in touch",
    intro:
      "Questions about an order, a product or wholesale? We usually reply within one working day.",
    actions: {
      call: `Call ${contact.phoneDisplay}`,
      whatsapp: "WhatsApp us",
      email: contact.email,
    },
  },
  form: {
    title: "Send us a message",
    requiredNote: "Fields marked * are required.",
    submit: "Send message",
    sending: "Sending…",
    success: {
      title: "Message sent",
      /** Rendered as: Thank you, {name}. We will reply to <strong>{email}</strong> within… */
      before: (firstName: string) => `Thank you, ${firstName}. We will reply to `,
      after: ` within one working day. For anything urgent, WhatsApp us on ${contact.phoneDisplay}.`,
      shop: "Continue shopping",
      again: "Send another message",
    },
    /** Prefilled message when arriving from a product's wholesale link (?subject=wholesale&product=). */
    wholesaleMessage: (productName: string) =>
      `Hello, I would like wholesale prices for ${productName}. Quantity needed: `,
  },
  details: {
    title: "Contact details",
    rows: [
      {
        label: "Phone and WhatsApp",
        value: contact.phoneDisplay,
        href: `tel:${contact.phoneE164}`,
      },
      { label: "Email", value: contact.email, href: `mailto:${contact.email}` },
      { label: "Packing unit", value: address.display },
      { label: "Hours", value: contact.hours },
    ],
    cta: "Chat on WhatsApp",
  },
  faq: {
    /** Anchor used by footer links ("FAQ", "Shipping and delivery", "Returns"). */
    id: "faq",
    eyebrow: "FAQ",
    title: "Questions, answered",
    text: "Can't find what you need? Message us and we'll help.",
    items: [
      {
        question: "How long does delivery take?",
        answer:
          "Most orders arrive in 3 to 5 working days. Remote areas of Gilgit-Baltistan and Balochistan can take a little longer.",
      },
      {
        question: "Do you offer cash on delivery?",
        answer: `Yes. Cash on delivery is available across Pakistan. You can also pay by ${otherPaymentMethods}.`,
      },
      {
        question: "Are your products really 100% natural?",
        answer:
          "Yes. Nothing is added. Each pouch contains only the plant, dried and packed at source.",
      },
      {
        question: "How should I store dried berries and herbs?",
        answer:
          "Keep them in a cool, dry place away from sunlight. Reseal the pouch after opening and use a clean, dry spoon.",
      },
      {
        question: "Do you supply wholesale and export orders?",
        answer:
          'We do. Use the form with the subject "Wholesale and export" or WhatsApp us for bulk prices.',
      },
    ],
  },
};
