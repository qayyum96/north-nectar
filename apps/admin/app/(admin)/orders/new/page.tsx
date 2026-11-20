import type { Metadata } from "next";
import { PageBody, PageHeader } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { imageSrc } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { CreateOrderForm, type PickCustomer, type PickVariant } from "./create-order-form";

export const metadata: Metadata = { title: "Create order" };

/** New order taken by phone or WhatsApp. */
export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  await requireStaff();
  const { customer: customerId } = await searchParams;
  const supabase = await createClient();
  const [products, customers] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, images, popularity_rank, variants:product_variants(id, label, sku, price, stock, reserved, sort_order)",
      )
      .eq("status", "active")
      .eq("purchase_mode", "retail")
      .order("popularity_rank")
      .order("name"),
    supabase
      .from("customers")
      .select("id, name, phone, email, whatsapp_opt_in, default_address")
      .order("name")
      .limit(1000),
  ]);

  type ProductRow = {
    id: string;
    name: string;
    images: { src?: string }[] | null;
    variants: {
      id: string;
      label: string;
      sku: string;
      price: number;
      stock: number;
      reserved: number;
      sort_order: number;
    }[];
  };
  const variants: PickVariant[] = ((products.data ?? []) as ProductRow[]).flatMap((p) =>
    [...p.variants]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => ({
        id: v.id,
        product: p.name,
        label: v.label,
        sku: v.sku,
        price: v.price,
        available: Math.max(0, v.stock - v.reserved),
        image: imageSrc(p.images?.[0]?.src),
      })),
  );

  const pickCustomers = (customers.data ?? []) as PickCustomer[];

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Orders", href: "/orders" }, { label: "New order" }]}
        title="Create order"
        subtitle="For orders taken by phone or WhatsApp. Stock is reserved as soon as you save."
      />
      <PageBody>
        <CreateOrderForm
          variants={variants}
          customers={pickCustomers}
          initialCustomerId={
            pickCustomers.some((c) => c.id === customerId) ? customerId : undefined
          }
        />
      </PageBody>
    </>
  );
}
