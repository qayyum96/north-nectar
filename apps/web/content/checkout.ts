import { formatPkr } from "@northnectar/ui";
import type { PaymentSettings } from "@northnectar/data/commerce-settings";
import { siteConfig } from "@/lib/seo/config";

type Bank = PaymentSettings["bank_transfer"];

/** Copy for /checkout and /order-confirmation. */
export const checkoutContent = {
  meta: {
    title: "Checkout",
    description: "Secure guest checkout. Cash on delivery, bank transfer, JazzCash or Easypaisa.",
  },
  header: { secure: "Secure checkout" },
  backToCart: "← Back to cart",
  title: "Checkout",
  steps: ["Cart", "Details", "Done"] as const,
  summaryToggle: { show: "Show order summary", hide: "Hide order summary" },
  errorSummary: {
    strong: "We couldn't place your order yet.",
    rest: (count: number) =>
      ` Please fix ${count} ${count === 1 ? "field" : "fields"} marked below.`,
  },
  contact: {
    title: "Contact",
    note: "Checking out as a guest. No account needed.",
    email: "Email for your receipt",
    phone: "Mobile number",
    whatsapp: "Send me order updates on WhatsApp",
  },
  address: {
    title: "Delivery address",
    fullName: "Full name",
    street: "Street address",
    streetPlaceholder: "House, street, area",
    landmark: "Apartment or landmark",
    landmarkPlaceholder: "Near ...",
    city: "City",
    cityOther: "City name",
    province: "Province",
    postalCode: "Postal code",
    select: "Select",
  },
  delivery: { title: "Delivery method", free: "Free" },
  payment: {
    title: "Payment",
    free: "Free",
    comingSoon: "Coming soon",
    bankDetails: (bank: Bank) =>
      `Transfer the total after placing your order. Bank: ${bank.bankName} · Account title: ${bank.accountTitle} · IBAN: ${bank.iban}. Share the receipt on WhatsApp ${siteConfig.contact.phoneDisplay}.`,
    walletNumber: (wallet: string) => `${wallet} mobile number`,
    /** No wallet gateway is connected yet, so payment is arranged on WhatsApp after the order. */
    walletNote: (wallet: string) =>
      `After you place your order we will WhatsApp you our ${wallet} account details. Your order is packed as soon as payment arrives.`,
  },
  placeOrder: (total: number) => `Place order · ${formatPkr(total)}`,
  placing: "Placing your order…",
  agreement: {
    before: "By placing your order you agree to our ",
    terms: "terms",
    middle: " and ",
    refund: "refund policy",
    after: ".",
  },
  summary: {
    title: "Order summary",
    subtotal: "Subtotal",
    discount: "Discount",
    delivery: (method: string) => `Delivery (${method})`,
    cod: "Cash on delivery",
    free: "Free",
    total: "Total",
    secure: "Secure checkout. Your details are safe.",
  },
  empty: {
    title: "Your cart is empty",
    text: "Add something from the valleys before checking out.",
    shop: "Shop the harvest",
  },
  errors: {
    unavailable:
      "Some items in your cart are no longer available. We have updated your cart, please review it and try again.",
    priceChanged:
      "Some prices changed while you were checking out. Your order summary now shows the current total. Please review it and place your order again.",
    tooMany: `You already have several orders waiting to be confirmed. Please WhatsApp us on ${siteConfig.contact.phoneDisplay} and we will help you with this one.`,
    generic: `Something went wrong and your order was not placed. Please try again, or WhatsApp us on ${siteConfig.contact.phoneDisplay}.`,
  },
  footer: {
    copyright: (year: number) => `© ${year} ${siteConfig.name}`,
    links: [
      { label: "Privacy", href: "/privacy-policy" },
      { label: "Terms", href: "/terms-and-conditions" },
      { label: "Refund policy", href: "/refund-policy" },
    ],
  },
};

/** City options from the mockup. "Other" asks for the city name. */
export const CITIES = [
  "Islamabad",
  "Rawalpindi",
  "Lahore",
  "Karachi",
  "Peshawar",
  "Quetta",
  "Faisalabad",
  "Multan",
  "Gujranwala",
  "Sialkot",
  "Hyderabad",
  "Abbottabad",
  "Gilgit",
  "Skardu",
  "Hunza",
  "Muzaffarabad",
  "Other",
] as const;

export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Kashmir",
] as const;

/** Copy for /order-confirmation. */
export const confirmationContent = {
  meta: {
    title: "Order Confirmed",
    description: "Thank you for your North Nectar order.",
  },
  /** "Order NN-10482 · placed today" */
  eyebrow: (number: string, when: string) => `Order ${number} · placed ${when}`,
  title: (firstName: string) => `Thank you, ${firstName}!`,
  lead: {
    // TODO(email): change to "We sent a receipt to" once order emails are connected.
    receipt: "Your order is confirmed. We will email a receipt to ",
    updates: " and will WhatsApp updates to ",
    updatesNo: " and will call ",
    updatesNoAfter: " if we need anything.",
    end: ".",
  },
  track: {
    title: "Track your order",
    estimate: "Estimated delivery ",
    steps: (eta: string) => [
      { title: "Order placed", text: "Today" },
      { title: "Packed at source", text: "Within 1 working day" },
      { title: "On the way", text: "We will WhatsApp tracking" },
      { title: "Delivered", text: eta },
    ],
  },
  cards: {
    address: "Delivering to",
    payment: "Payment",
    delivery: "Delivery",
    codText: (total: string) => ({
      before: "Please keep ",
      strong: total,
      after: " ready when your rider arrives.",
    }),
    bankText: (total: string, bank: Bank) => ({
      before: "Please transfer ",
      strong: total,
      after: ` to ${bank.bankName}, account title ${bank.accountTitle}, IBAN ${bank.iban}, and share the receipt on WhatsApp ${siteConfig.contact.phoneDisplay}.`,
    }),
    walletText: (total: string, wallet: string) => ({
      before: "We will WhatsApp you our ",
      strong: `${wallet} details`,
      after: ` to pay ${total}. Your order is packed as soon as payment arrives.`,
    }),
    deliveryText: (method: string) =>
      `${method === "express" ? "1 to 2 working days." : "3 to 5 working days."} Packed and sent from Khaplu.`,
  },
  order: {
    title: "Your order",
    qty: (label: string, qty: number) => `${label} · Qty ${qty}`,
    subtotal: "Subtotal",
    discount: "Discount",
    delivery: "Delivery",
    paymentFee: "Payment fee",
    free: "Free",
    total: "Total",
  },
  actions: { shop: "Continue shopping", whatsapp: "Questions? WhatsApp us" },
  missing: {
    title: "We couldn't find your order details",
    text: `If you just placed an order, it went through and we will be in touch. For anything else, WhatsApp us on ${siteConfig.contact.phoneDisplay}.`,
  },
};
