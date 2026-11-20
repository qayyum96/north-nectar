import { PolicyPage, policyMetadata } from "@/components/sections/policy-page";
import { termsAndConditions } from "@/content/policies";

export const metadata = policyMetadata(termsAndConditions);

export default function Page() {
  return <PolicyPage policy={termsAndConditions} />;
}
