"use client";

import { cn } from "@northnectar/ui";
import { useState } from "react";
import { Dialog } from "./dialog";
import { Icon } from "./icon";
import { buttonStyles, extraButtonStyles, fieldStyles } from "./ui";

const FORMATS = [
  { value: "csv", label: "CSV" },
  { value: "xlsx", label: "Excel" },
  { value: "pdf", label: "PDF" },
] as const;
const RANGES = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "custom", label: "Custom" },
  { value: "all", label: "All time" },
] as const;

function Seg<T extends string>({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="bg-admin-seg inline-flex max-w-full gap-[2px] overflow-x-auto rounded-[10px] p-[3px]"
    >
      {items.map((i) => (
        <button
          key={i.value}
          type="button"
          role="radio"
          aria-checked={i.value === value}
          onClick={() => onChange(i.value)}
          className={cn(
            "text-admin-text h-8 shrink-0 cursor-pointer rounded-[8px] border-0 px-[14px] text-[14px] whitespace-nowrap",
            i.value === value
              ? "bg-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
              : "bg-transparent font-medium hover:bg-white/60",
          )}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Export dialog from the mockup: format, which records, date range and columns. The file is
 * built by `endpoint` (a route handler) from the same filters as the list.
 */
export function ExportDialog({
  open,
  onClose,
  what,
  singular,
  endpoint,
  columns,
  filterQuery,
  selectedIds,
  dateRange = true,
}: {
  open: boolean;
  onClose: () => void;
  /** "orders" */
  what: string;
  /** "order" */
  singular: string;
  endpoint: string;
  columns: { key: string; label: string; on: boolean }[];
  /** The list's current filters as a query string (without "?"). */
  filterQuery: string;
  /** Export only these rows (bulk "Export selected"). */
  selectedIds?: string[];
  dateRange?: boolean;
}) {
  const [format, setFormat] = useState<(typeof FORMATS)[number]["value"]>("xlsx");
  const [scope, setScope] = useState<"filters" | "all">("filters");
  const [range, setRange] = useState<(typeof RANGES)[number]["value"]>(dateRange ? "30d" : "all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cols, setCols] = useState(() => new Set(columns.filter((c) => c.on).map((c) => c.key)));

  const selection = selectedIds && selectedIds.length > 0;
  const formatLabel = FORMATS.find((f) => f.value === format)!.label;
  const rangeLabel =
    range === "custom"
      ? "custom dates"
      : range === "all"
        ? "all time"
        : RANGES.find((r) => r.value === range)!.label.toLowerCase();

  const run = () => {
    const q = new URLSearchParams(scope === "filters" && !selection ? filterQuery : "");
    q.set("format", format);
    q.set("cols", [...cols].join(","));
    if (selection) q.set("ids", selectedIds.join(","));
    else if (dateRange) {
      q.set("range", range);
      if (range === "custom") {
        if (from) q.set("from", from);
        if (to) q.set("to", to);
      }
    }
    const url = `${endpoint}?${q.toString()}`;
    if (format === "pdf") window.open(url, "_blank", "noopener");
    else {
      // Download without leaving the page.
      const a = document.createElement("a");
      a.href = url;
      a.click();
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Export ${what}`}
      width={600}
      note={`${format === "xlsx" ? "Excel" : formatLabel} file · ${selection ? `${selectedIds.length} selected` : dateRange ? rangeLabel : scope === "all" ? `all ${what}` : "current filters"}`}
      footer={
        <>
          <button type="button" onClick={onClose} className={buttonStyles.secondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={run}
            disabled={cols.size === 0}
            className={cn(buttonStyles.primary, "disabled:opacity-60")}
          >
            <Icon name="download" size={16} />
            Export
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-2">
          <span className="font-semibold">Format</span>
          <Seg label="Format" items={FORMATS} value={format} onChange={setFormat} />
          {format === "pdf" ? (
            <span className="text-admin-muted">
              Opens a print view. Choose &quot;Save as PDF&quot; in the print window.
            </span>
          ) : null}
        </div>

        {selection ? null : (
          <div className="flex flex-col gap-2">
            <span className="font-semibold">Records</span>
            {(
              [
                ["filters", "Current filters", `Only the ${what} you are looking at now`],
                ["all", "All records", `Every ${singular} in your store`],
              ] as const
            ).map(([value, title, desc]) => {
              const on = scope === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setScope(value)}
                  className={cn(
                    "flex cursor-pointer items-center gap-[10px] rounded-[12px] border-[1.5px] px-[14px] py-3 text-left text-[14px]",
                    on ? "border-forest-600 bg-[#f3f7f1]" : "border-admin-line bg-white",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-[22px] shrink-0 items-center justify-center rounded-full border-2",
                      on ? "border-forest-600" : "border-[#a3a3a3]",
                    )}
                  >
                    <span
                      className={cn("size-2 rounded-full", on ? "bg-forest-600" : "bg-transparent")}
                    />
                  </span>
                  <span className="flex flex-col">
                    <span className="font-semibold">{title}</span>
                    <span className="text-admin-muted">{desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {dateRange && !selection ? (
          <div className="flex flex-col gap-2">
            <span className="font-semibold">Date range</span>
            <Seg label="Date range" items={RANGES} value={range} onChange={setRange} />
            {range === "custom" ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  aria-label="From"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className={cn(fieldStyles.input, "w-auto")}
                />
                <span className="text-admin-muted">to</span>
                <input
                  type="date"
                  aria-label="To"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className={cn(fieldStyles.input, "w-auto")}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 p-0 font-semibold">Columns</legend>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2">
            {columns.map((c) => (
              <label key={c.key} className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={cols.has(c.key)}
                  onChange={(e) => {
                    const next = new Set(cols);
                    if (e.target.checked) next.add(c.key);
                    else next.delete(c.key);
                    setCols(next);
                  }}
                  className="size-4 accent-forest-600"
                />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </Dialog>
  );
}

/** Button that opens the export dialog (header and toolbar both use it). */
export function ExportButton({
  size = "header",
  ...props
}: Omit<Parameters<typeof ExportDialog>[0], "open" | "onClose"> & { size?: "header" | "tool" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={size === "tool" ? extraButtonStyles.tool : buttonStyles.secondary}
      >
        <Icon name="download" size={16} />
        Export
      </button>
      <ExportDialog {...props} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
