import {
  type CommerceSettings,
  DEFAULT_COMMERCE_SETTINGS,
  deliveryFacts,
} from "@northnectar/data/commerce-settings";
import { formatPkr } from "@northnectar/ui";
import { siteConfig } from "@/lib/seo/config";
import type { PolicyDocument } from "./types";

// DRAFT placeholder text for a Pakistan-based store. Replace before setting status to "final".
const { contact, address } = siteConfig;
const days = (a: number, b: number) => (a === b ? `${a}` : `${a} to ${b}`);

/** Shipping policy with the rates from Settings > Shipping. */
export function shippingPolicyFor(settings: CommerceSettings): PolicyDocument {
  const f = deliveryFacts(settings);
  const freeOver = f.freeOver !== null ? formatPkr(f.freeOver) : null;
  return {
    path: "/shipping-policy",
    title: "Shipping Policy",
    shortTitle: "Shipping policy",
    metaDescription: `How North Nectar delivers across Pakistan: delivery times, charges${freeOver ? `, free delivery ${f.freeOverVaries ? `from ${freeOver} depending on your city` : `over ${freeOver}`}` : ""}, cash on delivery and order tracking.`,
    status: "final",
    lastUpdated: "2026-11-24",
    intro: `We pack every order at our unit in ${address.district}, Gilgit-Baltistan, and deliver to all cities and most towns in Pakistan through trusted courier partners.`,
    sections: [
      {
        heading: "Processing time",
        paragraphs: [
          "Orders placed before 2pm (Monday to Saturday) are usually packed the same day, and always within 1 working day. Orders placed on Sundays or public holidays are packed on the next working day.",
          `For cash on delivery orders we may call or WhatsApp you on the number you gave to confirm the order before it is sent.`,
        ],
      },
      {
        heading: "Delivery options and charges",
        list: [
          ...f.zones.map(
            (z) =>
              `${z.isFallback ? "Everywhere else" : z.name}: ${days(z.daysMin, z.daysMax)} working days, ${formatPkr(z.rate)}${z.freeOver !== null ? `. Free on orders over ${formatPkr(z.freeOver)}` : ""}.`,
          ),
          ...(f.express.enabled
            ? [
                `Express delivery: ${days(f.express.daysMin, f.express.daysMax)} working days to major cities, ${formatPkr(f.express.rate)}.`,
              ]
            : []),
          "Remote areas of Gilgit-Baltistan, Balochistan, Azad Kashmir and the tribal districts can take 2 to 4 extra working days.",
        ],
        paragraphs: [
          "Delivery times are estimates from the day your order is dispatched. Weather, road closures (especially on the Karakoram Highway) and courier delays can occasionally add time.",
        ],
      },
      {
        heading: "Cash on delivery",
        paragraphs: [
          "Cash on delivery is available across Pakistan. Please keep the exact amount ready; riders may not carry change. You can check the outer packaging before paying, but opening the product packs before payment is not possible.",
          "If a cash on delivery order is refused without a valid reason, we may ask for advance payment on future orders.",
        ],
      },
      {
        heading: "Bank transfer, JazzCash and Easypaisa",
        paragraphs: [
          "Orders paid by bank transfer or mobile wallet are dispatched once the payment is received. Please share your payment receipt on WhatsApp to speed this up. Unpaid orders are cancelled after 3 days.",
        ],
      },
      {
        heading: "Tracking your order",
        paragraphs: [
          "Once your parcel is handed to the courier we send the tracking number by WhatsApp or SMS. You can also ask us for an update at any time.",
        ],
      },
      {
        heading: "Wrong address or failed delivery",
        paragraphs: [
          "Please check your address and phone number at checkout. If the courier cannot reach you after two attempts the parcel is returned to us, and the delivery charge for re-sending it may be payable.",
        ],
      },
      {
        heading: "Damaged parcels",
        paragraphs: [
          "If the parcel looks damaged when it arrives, please take photos before opening it and contact us within 48 hours. See our Refund and Return Policy for what happens next.",
        ],
      },
      {
        heading: "Wholesale and export",
        paragraphs: [
          "Bulk, wholesale and export shipments are quoted separately, including freight and documentation. Contact us with the products and quantities you need.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          `Questions about delivery? Call or WhatsApp ${contact.phoneDisplay} or email ${contact.email}. We reply ${contact.hours}.`,
        ],
      },
    ],
  };
}

/** Default rates, for lists and links that only need the title and path. */
export const shippingPolicy = shippingPolicyFor(DEFAULT_COMMERCE_SETTINGS);
