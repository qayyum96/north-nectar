import { cn } from "@northnectar/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ExportButton } from "@/components/export-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { Avatar, Card, EmptyState, PageBody, PageHeader, tableStyles } from "@/components/ui";
import { initials, requireStaff } from "@/lib/auth";
import { formatPhone, formatPkr, plural, whatsappLink } from "@/lib/format";
import { loadSuppliers } from "@/lib/inventory";
import { SupplierRowMenu } from "./supplier-row-menu";
import { AddSupplierButton } from "./supplier-dialog";

export const metadata: Metadata = { title: "Suppliers" };

const GRID = { gridTemplateColumns: "2fr 1.4fr 100px 130px 130px 40px" };

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string }>;
}) {
  await requireStaff(["owner", "manager"]);
  const sp = await searchParams;
  const all = await loadSuppliers();
  const q = (sp.q ?? "").trim().toLowerCase();
  const rows = all.filter(
    (s) =>
      (!sp.city || s.city === sp.city) &&
      (!q ||
        `${s.name} ${s.supplies} ${s.contact_name ?? ""} ${s.phone ?? ""} ${s.city ?? ""}`
          .toLowerCase()
          .includes(q)),
  );
  const due = all.filter((s) => s.balance_due > 0);
  const dueTotal = due.reduce((n, s) => n + s.balance_due, 0);
  const cities = [...new Set(all.map((s) => s.city).filter((c): c is string => !!c))].sort();

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Inventory" }, { label: "Suppliers" }]}
        title="Suppliers"
        subtitle={`${plural(all.length, "supplier")} · ${dueTotal ? `${formatPkr(dueTotal)} due to ${due.length} of them` : "nothing due"}`}
        actions={
          <>
            <ExportButton
              what="suppliers"
              singular="supplier"
              endpoint="/export/suppliers"
              filterQuery=""
              dateRange={false}
              columns={[
                { key: "name", label: "Supplier", on: true },
                { key: "supplies", label: "Supplies", on: true },
                { key: "contact", label: "Contact person", on: true },
                { key: "phone", label: "Phone", on: true },
                { key: "city", label: "City", on: true },
                { key: "purchases", label: "Purchases", on: true },
                { key: "bought", label: "Total bought", on: true },
                { key: "due", label: "Balance due", on: true },
              ]}
            />
            <AddSupplierButton />
          </>
        }
      />
      <PageBody>
        <Card className="overflow-hidden p-0">
          <ListToolbar
            searchLabel="Search suppliers"
            filters={[
              {
                name: "city",
                label: "All cities",
                options: cities.map((c) => ({ value: c, label: c })),
              },
            ]}
          />
          {rows.length === 0 ? (
            <div className="border-admin-line border-t py-10">
              <EmptyState
                icon="suppliers"
                title={all.length ? "No suppliers match" : "No suppliers yet"}
              >
                {all.length ? (
                  <Link href="/suppliers" className="font-semibold text-forest-600 hover:underline">
                    Clear filters
                  </Link>
                ) : (
                  "Add the people and companies you buy from, then record purchases against them."
                )}
              </EmptyState>
            </div>
          ) : (
            <>
              <div className="border-admin-line hidden overflow-x-auto border-t md:block">
                <div className="min-w-[860px]" role="table" aria-label="Suppliers">
                  <div
                    role="row"
                    className={cn(tableStyles.head, tableStyles.headShade)}
                    style={GRID}
                  >
                    <span role="columnheader">Supplier</span>
                    <span role="columnheader">Contact</span>
                    <span role="columnheader" className="text-right">
                      Purchases
                    </span>
                    <span role="columnheader" className="text-right">
                      Total bought
                    </span>
                    <span role="columnheader" className="text-right">
                      Balance due
                    </span>
                    <span role="columnheader" aria-label="Actions" />
                  </div>
                  {rows.map((s) => (
                    <div
                      key={s.id}
                      role="row"
                      className={cn(tableStyles.row, tableStyles.rowShade, "min-h-[62px]")}
                      style={GRID}
                    >
                      <span role="cell" className="flex min-w-0 items-center gap-3">
                        <Avatar initials={initials(s.name)} />
                        <span className="flex min-w-0 flex-col">
                          <Link
                            href={`/suppliers/${s.id}`}
                            className="truncate font-semibold text-forest-600 hover:underline"
                          >
                            {s.name}
                          </Link>
                          <span className="text-admin-muted truncate">{s.supplies}</span>
                        </span>
                      </span>
                      <span role="cell" className="flex min-w-0 flex-col">
                        <span className="truncate font-semibold">
                          {formatPhone(s.phone) || s.email || "No contact"}
                        </span>
                        <span className="text-admin-muted truncate">{s.city}</span>
                      </span>
                      <span role="cell" className="text-right">
                        {s.purchases_count}
                      </span>
                      <span role="cell" className="text-right font-bold whitespace-nowrap">
                        {formatPkr(s.total_bought)}
                      </span>
                      <span
                        role="cell"
                        className={cn(
                          "text-right font-bold whitespace-nowrap",
                          s.balance_due > 0 && "text-[#b42318]",
                        )}
                      >
                        {formatPkr(s.balance_due)}
                      </span>
                      <span role="cell">
                        <SupplierRowMenu id={s.id} name={s.name} whatsapp={whatsappLink(s.phone)} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <ul className="m-0 flex list-none flex-col p-0 md:hidden">
                {rows.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/suppliers/${s.id}`}
                      className="flex justify-between gap-3 border-b border-[#efefed] px-4 py-3"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="font-bold text-forest-600">{s.name}</span>
                        <span className="text-admin-muted text-[14px]">
                          {[s.supplies, s.city].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "font-bold whitespace-nowrap",
                          s.balance_due > 0 && "text-[#b42318]",
                        )}
                      >
                        {formatPkr(s.balance_due)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </PageBody>
    </>
  );
}
