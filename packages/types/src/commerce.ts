import type { IsoDateString, Pkr } from "./common";

/** A line in the client-side cart. Price is a snapshot and is re-checked at checkout. */
export interface CartLine {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  variantLabel: string;
  unitPrice: Pkr;
  quantity: number;
  image: { src: string; alt: string };
}

export type PaymentMethodId = "cod" | "bank_transfer" | "mobile_wallet" | "card";

/**
 * enabled: offered at checkout.
 * coming_soon: shown but not selectable.
 * hidden: not shown anywhere.
 */
export type PaymentMethodStatus = "enabled" | "coming_soon" | "hidden";

export interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
  description: string;
  status: PaymentMethodStatus;
  /** Extra fee for this method, in PKR. */
  fee: Pkr;
  /** Short labels shown as payment badges in the footer and cart. */
  badges: string[];
}

export type DeliveryMethodId = "standard" | "express";

export interface DeliveryMethod {
  id: DeliveryMethodId;
  label: string;
  description: string;
  price: Pkr;
  /** Whether the free-delivery threshold applies to this method. */
  freeOverThreshold: boolean;
}

export interface Address {
  fullName: string;
  street: string;
  landmark?: string;
  city: string;
  province: string;
  postalCode?: string;
  country: "PK";
}

export type OrderStatus =
  "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled";

export interface OrderLine {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  variantLabel: string;
  unitPrice: Pkr;
  quantity: number;
  lineTotal: Pkr;
}

export interface OrderTotals {
  subtotal: Pkr;
  delivery: Pkr;
  paymentFee: Pkr;
  discount: Pkr;
  total: Pkr;
}

export interface Order {
  id: string;
  /** Human-friendly order number, e.g. "NN-10482". */
  number: string;
  status: OrderStatus;
  createdAt: IsoDateString;
  customer: {
    email: string;
    phone: string;
    whatsappUpdates: boolean;
  };
  shippingAddress: Address;
  lines: OrderLine[];
  deliveryMethodId: DeliveryMethodId;
  paymentMethodId: PaymentMethodId;
  totals: OrderTotals;
  discountCode?: string | null;
}
