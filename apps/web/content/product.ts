import { formatPkr } from "@northnectar/ui";
import { commerceConfig, deliveryMethods } from "@/lib/constants/commerce";
import { images } from "@/lib/images";

const freeOver = formatPkr(commerceConfig.freeDeliveryThreshold);
const standard = deliveryMethods.find((m) => m.id === "standard");
const returnDays = commerceConfig.structuredData.returnDays;

/** Shared product page copy. Product-specific text lives in the catalogue data. */
export const productContent = {
  /** Delivery box under the buy buttons: [bold part, rest]. */
  delivery: [
    { icon: "banknote", strong: "Cash on delivery", text: "available across Pakistan" },
    { icon: "truck", strong: "Delivered in 3 to 5 working days", text: "to every city" },
    { icon: "gift", strong: "Free delivery", text: `on orders over ${freeOver}` },
  ] as const,
  usps: [
    { label: "Naturally dried", icon: images.icons.naturallyDriedGreen },
    { label: "Himalayan sourcing", icon: images.icons.himalayanSourcingGreen },
    { label: "Carefully selected", icon: images.icons.carefullySelectedGreen },
  ],
  shippingReturns: [
    {
      title: "Cash on delivery",
      text: "Pay in cash when your order arrives, anywhere in Pakistan.",
    },
    {
      title: "Delivery",
      text: `3 to 5 working days. ${formatPkr(standard?.price ?? 250)}, or free on orders over ${freeOver}.`,
    },
    {
      title: "Easy returns",
      text: `Unopened items can be returned within ${returnDays} days of delivery.`,
    },
  ],
  socialProof: "Loved by customers across Pakistan",
  related: { eyebrow: "Pairs well with", title: "You may also like" },
  whatsappLabel: "Prefer WhatsApp? Order on",
};
