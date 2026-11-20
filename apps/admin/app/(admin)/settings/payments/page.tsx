import { toCommerceSettings } from "@northnectar/data/commerce-settings";
import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { loadStore } from "@/lib/settings";
import { PaymentsForm } from "./payments-form";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentSettingsPage() {
  await requireStaff(["owner"]);
  const store = await loadStore();
  const { payments } = toCommerceSettings(store, null);
  return <PaymentsForm initial={{ ...payments, card: { enabled: false } }} />;
}
