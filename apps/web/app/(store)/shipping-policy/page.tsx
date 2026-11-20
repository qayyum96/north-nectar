import { PolicyPage, policyMetadata } from "@/components/sections/policy-page";
import { shippingPolicy } from "@/content/policies";

export const metadata = policyMetadata(shippingPolicy);

export default function Page() {
  return <PolicyPage policy={shippingPolicy} />;
}
