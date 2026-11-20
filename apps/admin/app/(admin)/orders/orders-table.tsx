"use client";

import { cn } from "@northnectar/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExportDialog } from "@/components/export-dialog";
import { Icon } from "@/components/icon";
import { RowMenu } from "@/components/menus";
import { useToast } from "@/components/toast";
import { Avatar, StatusBadge, buttonStyles, tableStyles } from "@/components/ui";
import { ORDER_COLUMNS, type OrderColumn } from "@/lib/order-columns";
import { confirmOrders } from "./actions";
import { CancelOrderDialog } from "./order-dialogs";

export interface OrderRowView {
  id: string;
  number: string;
  date: string;
  name: string;
  initials: string;
  firstName: string;
  phone: string;
  city: string;
  payment: string;
  paymentStatus: string;
  fulfilment: string;
  total: string;
  units: number;
}

export function OrdersTable({
  rows,
  hidden,
  compact,
  exportColumns,
  filterQuery,
}: {
  rows: OrderRowView[];
  hidden: OrderColumn[];
  compact: boolean;
  exportColumns: { key: string; label: string; on: boolean }[];
  filterQuery: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [cancelling, setCancelling] = useState<OrderRowView | null>(null);
  const [exporting, setExporting] = useState(false);
  const [pending, start] = useTransition();

  const cols = ORDER_COLUMNS.filter((c) => !hidden.includes(c.key));
  const grid = { gridTemplateColumns: `28px 76px ${cols.map((c) => c.width).join(" ")} 40px` };
  const allOn = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const show = (key: OrderColumn) => !hidden.includes(key);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const selectedNumbers = rows.filter((r) => selected.includes(r.id)).map((r) => r.number);

  return (
    <>
      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-[#dfe8db] bg-[#f3f7f1] px-4 py-[10px]">
          <span className="mr-[6px] font-bold">{selected.length} selected</span>
          <button
            type="button"
            disabled={pending}
            className={buttonStyles.secondary}
            onClick={() =>
              start(async () => {
                const result = await confirmOrders(selected);
                if (result.ok) {
                  toast.show(result.message);
                  setSelected([]);
                  router.refresh();
                } else toast.error(result.error);
              })
            }
          >
            Mark as confirmed
          </button>
          <a
            href={`/print/orders?numbers=${selectedNumbers.join(",")}`}
            target="_blank"
            rel="noopener"
            className={buttonStyles.secondary}
          >
            <Icon name="print" size={16} />
            Print invoices
          </a>
          <button
            type="button"
            className={buttonStyles.secondary}
            onClick={() => setExporting(true)}
          >
            <Icon name="download" size={16} />
            Export selected
          </button>
          <button type="button" className={buttonStyles.secondary} onClick={() => setSelected([])}>
            Clear
          </button>
        </div>
      ) : null}

      {/* Desktop table */}
      <div className="border-admin-line hidden overflow-x-auto border-t md:block">
        <div className="min-w-[1000px]" role="table" aria-label="Orders">
          <div role="row" className={cn(tableStyles.head, tableStyles.headShade)} style={grid}>
            <span role="columnheader" className="flex h-6 items-center">
              <input
                type="checkbox"
                aria-label="Select all"
                checked={allOn}
                onChange={() => setSelected(allOn ? [] : rows.map((r) => r.id))}
                className="size-4 accent-forest-600"
              />
            </span>
            <span role="columnheader">Order</span>
            {cols.map((c) => (
              <span
                key={c.key}
                role="columnheader"
                className={c.key === "total" ? "text-right" : ""}
              >
                {c.label}
              </span>
            ))}
            <span role="columnheader" aria-label="Actions" />
          </div>
          {rows.map((r) => {
            const on = selected.includes(r.id);
            return (
              <div
                key={r.id}
                role="row"
                className={cn(
                  tableStyles.row,
                  compact ? "min-h-12 py-[6px]" : "min-h-[62px]",
                  on
                    ? "bg-[linear-gradient(to_left,#eef3ea_62px,#f3f7f1_62px)]"
                    : cn(
                        tableStyles.rowShade,
                        "hover:bg-[linear-gradient(to_left,#f4f3ef_62px,#fbfbfa_62px)]",
                      ),
                )}
                style={grid}
              >
                <span role="cell" className="flex h-6 items-center">
                  <input
                    type="checkbox"
                    aria-label={`Select order #${r.number}`}
                    checked={on}
                    onChange={() => toggle(r.id)}
                    className="size-4 accent-forest-600"
                  />
                </span>
                <span role="cell">
                  <Link
                    href={`/orders/${r.number}`}
                    className="font-bold text-forest-600 hover:underline"
                  >
                    #{r.number}
                  </Link>
                </span>
                {show("date") ? (
                  <span role="cell" className="text-admin-muted">
                    {r.date}
                  </span>
                ) : null}
                {show("customer") ? (
                  <span role="cell" className="flex min-w-0 items-center gap-3">
                    {compact ? null : <Avatar initials={r.initials} />}
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold text-forest-600">{r.name}</span>
                      <span className="text-admin-muted truncate">{r.phone}</span>
                    </span>
                  </span>
                ) : null}
                {show("city") ? (
                  <span role="cell" className="text-admin-muted truncate">
                    {r.city}
                  </span>
                ) : null}
                {show("payment") ? (
                  <span role="cell" className="truncate whitespace-nowrap">
                    {r.payment}
                  </span>
                ) : null}
                {show("payment_status") ? (
                  <span role="cell">
                    <StatusBadge status={r.paymentStatus} />
                  </span>
                ) : null}
                {show("fulfilment") ? (
                  <span role="cell">
                    <StatusBadge status={r.fulfilment} />
                  </span>
                ) : null}
                {show("total") ? (
                  <span role="cell" className="text-right font-bold whitespace-nowrap">
                    {r.total}
                  </span>
                ) : null}
                <span role="cell">
                  <RowMenu
                    label={`More actions for order #${r.number}`}
                    actions={[
                      { label: "View order", href: `/orders/${r.number}` },
                      {
                        label: "Print invoice",
                        onSelect: () =>
                          window.open(`/print/orders?numbers=${r.number}`, "_blank", "noopener"),
                      },
                      ...(r.fulfilment === "pending" || r.fulfilment === "confirmed"
                        ? [{ label: "Cancel", danger: true, onSelect: () => setCancelling(r) }]
                        : []),
                    ]}
                  />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phone cards */}
      <ul className="m-0 flex list-none flex-col p-0 md:hidden">
        {rows.map((r) => (
          <li key={r.id}>
            <Link
              href={`/orders/${r.number}`}
              className="text-admin-text flex flex-col gap-2 border-b border-[#efefed] px-4 py-[14px]"
            >
              <span className="flex justify-between gap-2">
                <span className="font-bold">
                  <span className="text-forest-600">#{r.number}</span> · {r.name}
                </span>
                <span className="font-bold whitespace-nowrap">{r.total}</span>
              </span>
              <span className="text-admin-muted text-[14px]">
                {[r.date, r.city, r.payment].filter(Boolean).join(" · ")}
              </span>
              <span className="flex flex-wrap gap-[6px]">
                <StatusBadge status={r.paymentStatus} />
                <StatusBadge status={r.fulfilment} />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {cancelling ? (
        <CancelOrderDialog
          open
          onClose={() => setCancelling(null)}
          orderId={cancelling.id}
          number={cancelling.number}
          units={cancelling.units}
          customerFirstName={cancelling.firstName}
        />
      ) : null}
      <ExportDialog
        open={exporting}
        onClose={() => setExporting(false)}
        what="orders"
        singular="order"
        endpoint="/export/orders"
        columns={exportColumns}
        filterQuery={filterQuery}
        selectedIds={selected}
      />
    </>
  );
}
