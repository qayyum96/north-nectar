import type { IsoDateString } from "./common";

export const CONTACT_SUBJECTS = [
  { value: "order", label: "Order question" },
  { value: "product", label: "Product question" },
  { value: "wholesale", label: "Wholesale and export" },
  { value: "other", label: "Other" },
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]["value"];

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: ContactSubject;
  message: string;
  createdAt: IsoDateString;
  /** Page the message was sent from. */
  source?: string;
}

export interface NewsletterSubscription {
  email: string;
  createdAt: IsoDateString;
  source?: string;
}
