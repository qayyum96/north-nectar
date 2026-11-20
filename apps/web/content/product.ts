import { type CommerceSettings, deliveryFacts } from "@northnectar/data/commerce-settings";
import { formatPkr } from "@northnectar/ui";
import { commerceConfig } from "@/lib/constants/commerce";
import { images } from "@/lib/images";

const returnDays = commerceConfig.structuredData.returnDays;

/** Shared product page copy. Product-specific text lives in the catalogue data. */
export const productContent = {
  usps: [
    { label: "Naturally dried", icon: images.icons.naturallyDriedGreen },
    { label: "Himalayan sourcing", icon: images.icons.himalayanSourcingGreen },
    { label: "Carefully selected", icon: images.icons.carefullySelectedGreen },
  ],
  socialProof: "Loved by customers across Pakistan",
  related: { eyebrow: "Pairs well with", title: "You may also like" },
  whatsappLabel: "Prefer WhatsApp? Order on",
};

const rateText = (f: ReturnType<typeof deliveryFacts>) =>
  f.minRate === f.maxRate
    ? formatPkr(f.minRate)
    : `${formatPkr(f.minRate)} to ${formatPkr(f.maxRate)} depending on your city`;

/** Delivery box under the buy buttons: [bold part, rest], from Settings > Shipping and Payments. */
export function productDelivery(settings: CommerceSettings) {
  const f = deliveryFacts(settings);
  return [
    f.cod
      ? { icon: "banknote", strong: "Cash on delivery", text: "available across Pakistan" }
      : null,
    { icon: "truck", strong: `Delivered in ${f.days}`, text: "to every city" },
    f.freeOver !== null
      ? { icon: "gift", strong: "Free delivery", text: `on orders over ${formatPkr(f.freeOver)}` }
      : null,
  ].filter(
    (r): r is { icon: "banknote" | "truck" | "gift"; strong: string; text: string } => r !== null,
  );
}

/** "Shipping & returns" tab cards. */
export function productShippingReturns(settings: CommerceSettings) {
  const f = deliveryFacts(settings);
  return [
    f.cod
      ? {
          title: "Cash on delivery",
          text: "Pay in cash when your order arrives, anywhere in Pakistan.",
        }
      : null,
    {
      title: "Delivery",
      text: `${f.days}. ${rateText(f)}${f.freeOver !== null ? `, or free on orders over ${formatPkr(f.freeOver)}` : ""}.`,
    },
    {
      title: "Easy returns",
      text: `Unopened items can be returned within ${returnDays} days of delivery.`,
    },
  ].filter((r): r is { title: string; text: string } => r !== null);
}
