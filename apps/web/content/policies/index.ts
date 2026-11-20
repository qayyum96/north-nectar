import { privacyPolicy } from "./privacy";
import { refundPolicy } from "./refund";
import { shippingPolicy } from "./shipping";
import { termsAndConditions } from "./terms";
import type { PolicyDocument } from "./types";

export type { PolicyDocument, PolicySection } from "./types";
export { privacyPolicy, refundPolicy, shippingPolicy, termsAndConditions };

export const policies: PolicyDocument[] = [
  privacyPolicy,
  termsAndConditions,
  refundPolicy,
  shippingPolicy,
];
