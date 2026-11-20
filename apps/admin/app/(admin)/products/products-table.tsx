"use client";

import { cn } from "@northnectar/ui";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DangerButton, Dialog } from "@/components/dialog";
import { Icon } from "@/components/icon";
import { RowMenu } from "@/components/menus";
import { useToast } from "@/components/toast";
import { StatusBadge, buttonStyles, tableStyles } from "@/components/ui";
import { PRODUCT_COLUMNS_UI, type ProductColumn } from "@/lib/product-columns";
import { deleteProduct, duplicateProduct } from "./actions";

export interface ProductRowView {
  id: string;
  name: string;
  image: string | null;
  sub: string;
  status: "active" | "draft";
  inventory: string;
  out: boolean;
  sizes: number;
  price: string;
  category: string;
}

export function ProductThumb({ src, size = 40 }: { src: string | null; size?: number }) {
  return src ? (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      style={{ width: size + 2, height: size + 2 }}
      className="border-admin-line shrink-0 rounded-[10px] border object-cover"
    />
  ) : (
    <span
      style={{ width: size + 2, height: size + 2 }}
      className="border-admin-line bg-admin-bg grid shrink-0 place-items-center rounded-[10px] border text-[#a3a3a3]"
    >
      <Icon name="image" size={18} />
    </span>
  );
}

export function DeleteProductDialog({
  product,
  onClose,
  after,
}: {
  product: { id: string; name: string; sizes: number } | null;
  onClose: () => void;
  after?: () => void;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <Dialog
      open={!!product}
      onClose={onClose}
      title="Delete product?"
      footer={
        <>
          <button type="button" onClick={onClose} className={buttonStyles.secondary}>
            Cancel
          </button>
          <DangerButton
            disabled={pending}
            onClick={() =>
              product &&
              start(async () => {
                const result = await deleteProduct(product.id);
                if (!result.ok) return toast.error(result.error);
                toast.show(result.message);
                onClose();
                if (after) after();
                else router.refresh();
              })
            }
          >
            {pending ? "Deleting…" : "Delete product"}
          </DangerButton>
        </>
      }
    >
      {product ? (
        <div className="flex items-start gap-[14px]">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#fde8e6] text-[#b42318]">
            <Icon name="trash" size={18} />
          </span>
          <span className="flex flex-col gap-[6px]">
            <span className="font-bold">{product.name}</span>
            <span className="text-admin-muted leading-[1.6]">
              This removes the product, its {product.sizes} {product.sizes === 1 ? "size" : "sizes"}{" "}
              and its images from your store. Past orders keep their records. This can&apos;t be
              undone.
            </span>
          </span>
        </div>
      ) : null}
    </Dialog>
  );
}

export function ProductsTable({
  rows,
  hidden,
  compact,
  canEdit,
}: {
  rows: ProductRowView[];
  hidden: ProductColumn[];
  compact: boolean;
  canEdit: boolean;
}) {
  const [deleting, setDeleting] = useState<ProductRowView | null>(null);
  const [, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const cols = PRODUCT_COLUMNS_UI.filter((c) => !hidden.includes(c.key));
  const show = (k: ProductColumn) => !hidden.includes(k);
  const grid = { gridTemplateColumns: `2.2fr ${cols.map((c) => c.width).join(" ")} 40px` };

  const duplicate = (id: string) =>
    start(async () => {
      const result = await duplicateProduct(id);
      if (!result.ok) return toast.error(result.error);
      toast.show(result.message, {
        label: "Open",
        onClick: () => router.push(`/products/${result.id}`),
      });
      router.refresh();
    });

  return (
    <>
      <div className="border-admin-line hidden overflow-x-auto border-t md:block">
        <div className="min-w-[1000px]" role="table" aria-label="Products">
          <div role="row" className={cn(tableStyles.head, tableStyles.headShade)} style={grid}>
            <span role="columnheader">Product</span>
            {cols.map((c) => (
              <span key={c.key} role="columnheader">
                {c.label}
              </span>
            ))}
            <span role="columnheader" aria-label="Actions" />
          </div>
          {rows.map((r) => (
            <div
              key={r.id}
              role="row"
              className={cn(
                tableStyles.row,
                tableStyles.rowShade,
                compact ? "min-h-12 py-[6px]" : "min-h-[62px]",
                "hover:bg-[linear-gradient(to_left,#f4f3ef_62px,#fbfbfa_62px)]",
              )}
              style={grid}
            >
              <span role="cell" className="flex min-w-0 items-center gap-3">
                {compact ? null : <ProductThumb src={r.image} />}
                <span className="flex min-w-0 flex-col">
                  <Link
                    href={`/products/${r.id}`}
                    className="truncate font-semibold text-forest-600 hover:underline"
                  >
                    {r.name}
                  </Link>
                  <span className="text-admin-muted truncate">{r.sub}</span>
                </span>
              </span>
              {show("status") ? (
                <span role="cell">
                  <StatusBadge status={r.status} />
                </span>
              ) : null}
              {show("inventory") ? (
                <span role="cell" className={r.out ? "text-[#b42318]" : undefined}>
                  {r.inventory}
                </span>
              ) : null}
              {show("sizes") ? <span role="cell">{r.sizes}</span> : null}
              {show("price") ? (
                <span role="cell" className="whitespace-nowrap">
                  {r.price}
                </span>
              ) : null}
              {show("category") ? (
                <span role="cell" className="text-admin-muted truncate">
                  {r.category}
                </span>
              ) : null}
              <span role="cell">
                <RowMenu
                  label={`More actions for ${r.name}`}
                  actions={[
                    { label: "Edit", href: `/products/${r.id}` },
                    ...(canEdit
                      ? [
                          { label: "Duplicate", onSelect: () => duplicate(r.id) },
                          { label: "Delete", danger: true, onSelect: () => setDeleting(r) },
                        ]
                      : []),
                  ]}
                />
              </span>
            </div>
          ))}
        </div>
      </div>

      <ul className="m-0 flex list-none flex-col p-0 md:hidden">
        {rows.map((r) => (
          <li key={r.id}>
            <Link
              href={`/products/${r.id}`}
              className="text-admin-text flex items-center gap-3 border-b border-[#efefed] px-4 py-3"
            >
              <ProductThumb src={r.image} />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate font-bold text-forest-600">{r.name}</span>
                <span className={cn("text-[14px]", r.out ? "text-[#b42318]" : "text-admin-muted")}>
                  {r.inventory} · {r.price}
                </span>
              </span>
              <StatusBadge status={r.status} />
            </Link>
          </li>
        ))}
      </ul>

      <DeleteProductDialog product={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}
