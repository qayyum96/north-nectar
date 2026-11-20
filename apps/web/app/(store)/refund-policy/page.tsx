import { PolicyPage, policyMetadata } from "@/components/sections/policy-page";
import { refundPolicy } from "@/content/policies";

export const metadata = policyMetadata(refundPolicy);

export default function Page() {
  return <PolicyPage policy={refundPolicy} />;
}
