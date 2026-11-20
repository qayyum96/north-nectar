import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { loadStock, loadSuppliers } from "@/lib/inventory";
import { PurchaseForm } from "./purchase-form";

export const metadata: Metadata = { title: "Record purchase" };

export default async function NewPurchasePage({
  searchParams,
}: {
  searchParams: Promise<{ supplier?: string }>;
}) {
  await requireStaff(["owner", "manager"]);
  const { supplier = "" } = await searchParams;
  const [suppliers, stock] = await Promise.all([loadSuppliers(), loadStock()]);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
  return (
    <PurchaseForm
      suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
      sizes={stock.map((r) => ({
        id: r.id,
        label: `${r.productShort} · ${r.label}`,
        short: `${r.productShort} ${r.label}`,
        unitCost: r.unitCost,
      }))}
      initialSupplier={suppliers.some((s) => s.id === supplier) ? supplier : ""}
      today={today}
    />
  );
}
