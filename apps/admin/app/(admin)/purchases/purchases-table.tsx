"use client";

import { cn } from "@northnectar/ui";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { RowMenu } from "@/components/menus";
import { StatusBadge, tableStyles } from "@/components/ui";
import { PaymentDialog } from "./payment-dialog";

export interface PurchaseRowView {
  id: string;
  number: string;
  date: string;
  supplierId: string | null;
  supplier: string;
  itemTitle: string;
  itemSub: string;
  qty: string;
  costs: string;
  total: string;
  state: "paid" | "partly paid" | "unpaid";
  due: number;
  hasBill: boolean;
}

const GRID = {
  gridTemplateColumns:
    "76px 96px minmax(130px,1.2fr) minmax(170px,1.6fr) 56px 104px 96px 104px 72px 40px",
};

export function PurchasesTable({ rows }: { rows: PurchaseRowView[] }) {
  const [paying, setPaying] = useState<PurchaseRowView | null>(null);
  return (
    <>
      <div className="border-admin-line hidden overflow-x-auto border-t md:block">
        <div className="min-w-[1000px]" role="table" aria-label="Purchases">
          <div role="row" className={cn(tableStyles.head, tableStyles.headShade)} style={GRID}>
            <span role="columnheader">Purchase</span>
            <span role="columnheader">Date</span>
            <span role="columnheader">Supplier</span>
            <span role="columnheader">Items</span>
            <span role="columnheader" className="text-right">
              Qty
            </span>
            <span role="columnheader" className="text-right">
              Unit cost
            </span>
            <span role="columnheader" className="text-right">
              Total
            </span>
            <span role="columnheader">Payment</span>
            <span role="columnheader">Bill</span>
            <span role="columnheader" aria-label="Actions" />
          </div>
          {rows.map((p) => (
            <div
              key={p.id}
              role="row"
              className={cn(tableStyles.row, tableStyles.rowShade, "min-h-[62px]")}
              style={GRID}
            >
              <span role="cell">
                <Link
                  href={`/purchases/${p.id}`}
                  className="font-bold text-forest-600 hover:underline"
                >
                  {p.number}
                </Link>
              </span>
              <span role="cell" className="text-admin-muted">
                {p.date}
              </span>
              <span role="cell" className="min-w-0">
                {p.supplierId ? (
                  <Link
                    href={`/suppliers/${p.supplierId}`}
                    className="font-semibold text-forest-600 hover:underline"
                  >
                    {p.supplier}
                  </Link>
                ) : (
                  <span className="text-admin-muted">No supplier</span>
                )}
              </span>
              <span role="cell" className="flex min-w-0 flex-col">
                <span className="truncate font-semibold">{p.itemTitle}</span>
                {p.itemSub ? <span className="text-admin-muted">{p.itemSub}</span> : null}
              </span>
              <span role="cell" className="text-right">
                {p.qty}
              </span>
              <span role="cell" className="text-admin-muted text-right">
                {p.costs}
              </span>
              <span role="cell" className="text-right font-bold whitespace-nowrap">
                {p.total}
              </span>
              <span role="cell">
                <StatusBadge
                  status={
                    p.state === "partly paid" ? "confirmed" : p.state === "paid" ? "paid" : "unpaid"
                  }
                  label={
                    p.state === "partly paid"
                      ? "Partly paid"
                      : p.state === "paid"
                        ? "Paid"
                        : "Unpaid"
                  }
                />
              </span>
              <span role="cell">
                {p.hasBill ? (
                  <a
                    href={`/purchases/${p.id}/bill`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-[6px] font-semibold text-forest-600 hover:underline"
                  >
                    <Icon name="image" size={16} />
                    Photo
                  </a>
                ) : (
                  <span className="text-[#9a9a96]">None</span>
                )}
              </span>
              <span role="cell">
                <RowMenu
                  label={`More actions for ${p.number}`}
                  actions={[
                    { label: "View", href: `/purchases/${p.id}` },
                    ...(p.due > 0
                      ? [{ label: "Record payment", onSelect: () => setPaying(p) }]
                      : []),
                    ...(p.hasBill
                      ? [
                          {
                            label: "Bill photo",
                            onSelect: () =>
                              window.open(`/purchases/${p.id}/bill`, "_blank", "noopener"),
                          },
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
        {rows.map((p) => (
          <li key={p.id}>
            <Link
              href={`/purchases/${p.id}`}
              className="flex flex-col gap-1 border-b border-[#efefed] px-4 py-3"
            >
              <span className="flex justify-between gap-2">
                <span className="font-bold">
                  <span className="text-forest-600">{p.number}</span> · {p.supplier}
                </span>
                <span className="font-bold whitespace-nowrap">{p.total}</span>
              </span>
              <span className="text-admin-muted text-[14px]">
                {p.date} · {p.itemTitle}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {paying ? (
        <PaymentDialog
          key={paying.id}
          purchase={{ id: paying.id, number: paying.number, due: paying.due }}
          onClose={() => setPaying(null)}
        />
      ) : null}
    </>
  );
}
