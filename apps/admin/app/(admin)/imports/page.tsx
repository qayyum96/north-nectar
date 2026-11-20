import { cn } from "@northnectar/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { ListToolbar } from "@/components/list-toolbar";
import { Card, EmptyState, PageBody, PageHeader, StatusBadge, tableStyles } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { dateLabel } from "@/lib/format";
import { KIND_LABEL } from "@/lib/import-kinds";
import { loadImports } from "@/lib/inventory";
import { ImportButton } from "./import-wizard";
import { UndoImportButton } from "./undo-button";

export const metadata: Metadata = { title: "Import history" };

const GRID = { gridTemplateColumns: "1.8fr 1fr 120px 190px 90px 110px 96px" };
const STATUS: Record<string, [string, string]> = {
  completed: ["delivered", "Completed"],
  completed_with_errors: ["pending", "Completed with errors"],
  failed: ["returned", "Failed"],
  undone: ["cancelled", "Undone"],
};

export default async function ImportsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string; status?: string }>;
}) {
  await requireStaff(["owner", "manager"]);
  const sp = await searchParams;
  const all = await loadImports();
  const q = (sp.q ?? "").toLowerCase().trim();
  const rows = all.filter(
    (i) =>
      (!q || i.file_name.toLowerCase().includes(q)) &&
      (!sp.kind || i.kind === sp.kind) &&
      (!sp.status || i.status === sp.status),
  );
  const size = (b: number) =>
    b < 1024 * 1024
      ? `${Math.max(1, Math.round(b / 1024))} KB`
      : `${(b / 1024 / 1024).toFixed(1)} MB`;

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Inventory" },
          { label: "Stock movements", href: "/movements" },
          { label: "Import history" },
        ]}
        title="Import history"
        subtitle="Files imported into products, purchases and stock movements"
        actions={<ImportButton kind="purchases" label="New import" primary />}
      />
      <PageBody>
        <Card className="overflow-hidden p-0">
          <ListToolbar
            searchLabel="Search file names"
            filters={[
              {
                name: "kind",
                label: "All types",
                options: (["products", "purchases", "movements"] as const).map((k) => ({
                  value: k,
                  label: KIND_LABEL[k],
                })),
              },
              {
                name: "status",
                label: "All statuses",
                options: [
                  { value: "completed", label: "Completed" },
                  { value: "completed_with_errors", label: "Completed with errors" },
                  { value: "failed", label: "Failed" },
                  { value: "undone", label: "Undone" },
                ],
              },
            ]}
          />
          {rows.length === 0 ? (
            <div className="border-admin-line border-t py-10">
              <EmptyState icon="file" title={all.length ? "No imports match" : "No imports yet"}>
                {all.length ? (
                  <Link href="/imports" className="font-semibold text-forest-600 hover:underline">
                    Clear filters
                  </Link>
                ) : (
                  "Import purchases, stock counts or products from a CSV or Excel file."
                )}
              </EmptyState>
            </div>
          ) : (
            <div className="border-admin-line overflow-x-auto border-t">
              <div className="min-w-[960px]" role="table" aria-label="Imports">
                <div
                  role="row"
                  className={cn(
                    tableStyles.head,
                    "bg-[linear-gradient(to_left,#efede8_112px,#f4f2ee_112px)]",
                  )}
                  style={GRID}
                >
                  <span role="columnheader">File</span>
                  <span role="columnheader">Imported to</span>
                  <span role="columnheader">Rows</span>
                  <span role="columnheader">Status</span>
                  <span role="columnheader">By</span>
                  <span role="columnheader">Date</span>
                  <span role="columnheader" aria-label="Actions" />
                </div>
                {rows.map((i) => {
                  const [tone, text] = STATUS[i.status] ?? ["cancelled", i.status];
                  const label =
                    i.status === "completed_with_errors"
                      ? `Completed with ${i.errors.length} ${i.errors.length === 1 ? "error" : "errors"}`
                      : text;
                  return (
                    <div
                      key={i.id}
                      role="row"
                      className={cn(
                        tableStyles.row,
                        "min-h-[62px] bg-[linear-gradient(to_left,#f7f6f3_112px,#ffffff_112px)]",
                      )}
                      style={GRID}
                    >
                      <span role="cell" className="flex min-w-0 items-center gap-3">
                        <span className="text-admin-muted grid size-9 shrink-0 place-items-center rounded-[8px] bg-[#f4f2ee]">
                          <Icon name="file" size={16} />
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate font-semibold text-forest-600">
                            {i.file_name}
                          </span>
                          <span className="text-admin-muted truncate">
                            {[size(i.file_size), i.summary].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                      </span>
                      <span role="cell">{KIND_LABEL[i.kind]}</span>
                      <span role="cell">
                        {i.imported_rows} of {i.total_rows} {i.total_rows === 1 ? "row" : "rows"}
                      </span>
                      <span role="cell">
                        <StatusBadge status={tone} label={label} />
                      </span>
                      <span role="cell" className="text-admin-muted">
                        {i.actor_name ?? "—"}
                      </span>
                      <span role="cell" className="text-admin-muted">
                        {dateLabel(i.created_at)}
                      </span>
                      <span role="cell" className="flex items-center justify-end gap-2">
                        {i.errors.length ? (
                          <a
                            href={`/imports/${i.id}/errors`}
                            aria-label={`Download the error report for ${i.file_name}`}
                            title="Download the rows that weren't imported"
                            className="border-admin-field grid h-8 w-[38px] place-items-center rounded-[8px] border bg-white text-[#b42318] hover:bg-[#fafaf9]"
                          >
                            <Icon name="download" size={16} />
                          </a>
                        ) : null}
                        {i.kind !== "products" && i.status !== "undone" && i.imported_rows > 0 ? (
                          <UndoImportButton id={i.id} name={i.file_name} />
                        ) : null}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </PageBody>
    </>
  );
}
