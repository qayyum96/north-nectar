import { PolicyPage, policyMetadata } from "@/components/sections/policy-page";
import { shippingPolicyFor } from "@/content/policies/shipping";
import { getCommerceSettings } from "@/lib/commerce/settings";

/** Rates come from Settings > Shipping in the admin (refreshed when the owner saves). */
export async function generateMetadata() {
  return policyMetadata(shippingPolicyFor(await getCommerceSettings()));
}

export default async function Page() {
  return <PolicyPage policy={shippingPolicyFor(await getCommerceSettings())} />;
}
