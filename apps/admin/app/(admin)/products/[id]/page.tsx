import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { loadCatalogue, toForm } from "@/lib/catalogue";
import { dateLabel } from "@/lib/format";
import { ProductEditor } from "./product-editor";

export const metadata: Metadata = { title: "Edit product" };

/** /products/new (empty editor) and /products/<id>. */
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff(["owner", "manager"]);
  const { id } = await params;
  const { products, categories } = await loadCatalogue();
  const product = id === "new" ? null : (products.find((p) => p.id === id) ?? null);
  if (id !== "new" && !product) notFound();

  return (
    <ProductEditor
      // A new key after each save remounts the editor with fresh stock and size ids.
      key={product ? `${product.id}-${product.updated_at}` : "new"}
      initial={toForm(product, categories)}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      others={products.map((p) => ({ id: p.id, name: p.name }))}
      lastEdited={product ? dateLabel(product.updated_at) : null}
      storefrontUrl={(process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://northnectar.com").replace(
        /\/$/,
        "",
      )}
    />
  );
}
