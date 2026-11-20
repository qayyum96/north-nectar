"use client";

import { cn } from "@northnectar/ui";
import Link from "next/link";
import { RowMenu } from "@/components/menus";
import { Avatar, StatusBadge, tableStyles } from "@/components/ui";
import { CUSTOMER_COLUMNS, type CustomerColumn } from "@/lib/customer-columns";

export interface CustomerRowView {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  city: string;
  orders: number;
  spent: string;
  last: string;
  whatsapp: boolean;
  whatsappHref: string | null;
}

export function CustomersTable({
  rows,
  compact,
  hidden,
}: {
  rows: CustomerRowView[];
  compact: boolean;
  hidden: CustomerColumn[];
}) {
  const cols = CUSTOMER_COLUMNS.filter((c) => !hidden.includes(c.key));
  const show = (k: CustomerColumn) => !hidden.includes(k);
  const GRID = { gridTemplateColumns: `1.4fr ${cols.map((c) => c.width).join(" ")} 40px` };
  return (
    <>
      <div className="border-admin-line hidden overflow-x-auto border-t md:block">
        <div className="min-w-[1000px]" role="table" aria-label="Customers">
          <div role="row" className={cn(tableStyles.head, tableStyles.headShade)} style={GRID}>
            <span role="columnheader">Name</span>
            {cols.map((c) => (
              <span key={c.key} role="columnheader" className={c.right ? "text-right" : undefined}>
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
              style={GRID}
            >
              <span role="cell" className="flex min-w-0 items-center gap-3">
                {compact ? null : <Avatar initials={r.initials} />}
                <Link
                  href={`/customers/${r.id}`}
                  className="truncate font-semibold text-forest-600 hover:underline"
                >
                  {r.name}
                </Link>
              </span>
              {show("contact") ? (
                <span role="cell" className="flex min-w-0 flex-col">
                  <span className="truncate font-semibold">{r.email || "No email"}</span>
                  <span className="text-admin-muted truncate">{r.phone}</span>
                </span>
              ) : null}
              {show("city") ? (
                <span role="cell" className="text-admin-muted truncate">
                  {r.city}
                </span>
              ) : null}
              {show("orders") ? (
                <span role="cell" className="text-right">
                  {r.orders}
                </span>
              ) : null}
              {show("spent") ? (
                <span role="cell" className="text-right font-bold whitespace-nowrap">
                  {r.spent}
                </span>
              ) : null}
              {show("last") ? (
                <span role="cell" className="text-admin-muted whitespace-nowrap">
                  {r.last}
                </span>
              ) : null}
              {show("whatsapp") ? (
                <span role="cell">
                  {r.whatsapp ? (
                    <span className="inline-flex h-6 items-center gap-[6px] rounded-full bg-[#1d7a46] px-[10px] text-[14px] font-semibold text-white">
                      <span aria-hidden="true" className="size-[6px] rounded-full bg-white" />
                      Yes
                    </span>
                  ) : (
                    <StatusBadge status="no" label="No" />
                  )}
                </span>
              ) : null}
              <span role="cell">
                <RowMenu
                  label={`More actions for ${r.name}`}
                  actions={[
                    { label: "View", href: `/customers/${r.id}` },
                    ...(r.whatsappHref
                      ? [
                          {
                            label: "WhatsApp",
                            onSelect: () => window.open(r.whatsappHref!, "_blank", "noopener"),
                          },
                        ]
                      : []),
                    { label: "Create order", href: `/orders/new?customer=${r.id}` },
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
              href={`/customers/${r.id}`}
              className="text-admin-text flex flex-col gap-1 border-b border-[#efefed] px-4 py-[14px]"
            >
              <span className="flex justify-between gap-2">
                <span className="font-bold text-forest-600">{r.name}</span>
                <span className="font-bold whitespace-nowrap">{r.spent}</span>
              </span>
              <span className="text-admin-muted text-[14px]">
                {[r.phone, r.city, `${r.orders} ${r.orders === 1 ? "order" : "orders"}`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
