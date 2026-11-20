import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { loadStore } from "@/lib/settings";
import { StoreForm } from "./store-form";

export const metadata: Metadata = { title: "Store details" };

export default async function StoreSettingsPage() {
  await requireStaff(["owner"]);
  const s = await loadStore();
  return (
    <StoreForm
      initial={{
        store_name: s?.store_name ?? "North Nectar",
        email: s?.email ?? "",
        phone: s?.phone ?? "",
        currency: "PKR",
        time_zone: s?.time_zone ?? "Asia/Karachi",
        date_format: s?.date_format ?? "d MMM yyyy",
        address: s?.address ?? "",
        city: s?.city ?? "",
        province: s?.province ?? "Gilgit-Baltistan",
        postal_code: s?.postal_code ?? "",
      }}
    />
  );
}
