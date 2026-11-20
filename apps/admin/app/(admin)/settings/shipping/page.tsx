import { toCommerceSettings } from "@northnectar/data/commerce-settings";
import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { loadStore, loadZones } from "@/lib/settings";
import { ShippingForm } from "./shipping-form";

export const metadata: Metadata = { title: "Shipping" };

export default async function ShippingSettingsPage() {
  await requireStaff(["owner"]);
  const [store, zones] = await Promise.all([loadStore(), loadZones()]);
  const settings = toCommerceSettings(store, zones);
  return <ShippingForm initial={{ zones: settings.zones, express: settings.express }} />;
}
