import { PolicyPage, policyMetadata } from "@/components/sections/policy-page";
import { privacyPolicy } from "@/content/policies";

export const metadata = policyMetadata(privacyPolicy);

export default function Page() {
  return <PolicyPage policy={privacyPolicy} />;
}
