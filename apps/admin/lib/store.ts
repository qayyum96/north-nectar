import "server-only";
import { loadStore } from "./settings";

/** Store details printed on invoices, from Settings > Store details (with safe fallbacks). */
export async function getStoreInfo() {
  const s = await loadStore();
  const website = new URL(process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://northnectar.com").host;
  return {
    name: s?.store_name || "North Nectar",
    website: website.startsWith("localhost") ? "northnectar.com" : website,
    phone: s?.phone || "0316 4354407",
    email: s?.email || "info@northnectar.com",
    address:
      [s?.address, s?.city, s?.province].filter(Boolean).join(", ") || "Gilgit-Baltistan, Pakistan",
  };
}
