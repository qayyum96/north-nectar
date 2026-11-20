"use client";

import { cn } from "@northnectar/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Drawer } from "@/components/dialog";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import { SelectBox, StatusBadge, buttonStyles, fieldStyles, tableStyles } from "@/components/ui";
import { ProductThumb } from "../products/products-table";
import { adjustStock } from "./actions";

export interface StockRowView {
  id: string;
  productId: string;
  product: string;
  productShort: string;
  label: string;
  sku: string;
  image: string | null;
  stock: number;
  reserved: number;
  available: number;
  reorderAt: number;
  unitCost: number | null;
  status: "in" | "low" | "out";
  value: string;
}

const STATUS_LABEL = { in: "In stock", low: "Low stock", out: "Out of stock" } as const;
const GRID = {
  gridTemplateColumns: "minmax(210px,2fr) minmax(110px,1.1fr) 80px 84px 90px 96px 124px 110px 76px",
};
const REMOVE_REASONS = ["Damaged", "Recount", "Sample", "Gift", "Expired", "Other"];
const ADD_REASONS = ["Restock", "Recount", "Returned to shelf", "Found", "Other"];

function AdjustDrawer({
  open,
  onClose,
  rows,
  initialId,
}: {
  open: boolean;
  onClose: () => void;
  rows: StockRowView[];
  initialId: string | null;
}) {
  const [id, setId] = useState(initialId ?? "");
  const row = rows.find((r) => r.id === id) ?? null;
  const [mode, setMode] = useState<"add" | "remove" | "set">("remove");
  // Starts at 0 so changing only the low-stock level or cost never moves stock by accident.
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("Damaged");
  const [note, setNote] = useState("");
  const [reorder, setReorder] = useState(row ? String(row.reorderAt) : "");
  const [cost, setCost] = useState(row?.unitCost != null ? String(row.unitCost) : "");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const pick = (nextId: string) => {
    setId(nextId);
    const r = rows.find((x) => x.id === nextId);
    setReorder(r ? String(r.reorderAt) : "");
    setCost(r?.unitCost != null ? String(r.unitCost) : "");
  };

  const after = row
    ? mode === "add"
      ? row.stock + qty
      : mode === "remove"
        ? row.stock - qty
        : qty
    : 0;
  const tooLow = row ? after < Math.max(0, row.reserved) : false;
  const reasons = mode === "add" ? ADD_REASONS : REMOVE_REASONS;
  const quantityChanged = row ? after !== row.stock : false;
  const settingsChanged =
    row &&
    (reorder !== String(row.reorderAt) ||
      cost !== (row.unitCost != null ? String(row.unitCost) : ""));

  const save = () =>
    row &&
    start(async () => {
      const costChanged = cost !== (row.unitCost != null ? String(row.unitCost) : "");
      // Only send what changed: a settings-only save must not write back the stock count (or
      // cost) this page loaded, which a purchase or order may have changed since.
      const result = await adjustStock({
        variantId: row.id,
        mode: quantityChanged ? mode : "add",
        quantity: quantityChanged ? qty : 0,
        reason,
        note,
        reorderAt:
          reorder.trim() === "" || reorder === String(row.reorderAt)
            ? null
            : Math.max(0, Math.round(Number(reorder) || 0)),
        unitCost: !costChanged
          ? null
          : cost.trim() === ""
            ? -1
            : Math.max(0, Math.round(Number(cost.replace(/,/g, "")) || 0)),
      });
      if (!result.ok) return toast.error(result.error);
      toast.show(result.message);
      onClose();
      router.refresh();
    });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Adjust stock"
      footer={
        <>
          <button type="button" onClick={onClose} className={buttonStyles.secondary}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!row || pending || tooLow || (!quantityChanged && !settingsChanged)}
            onClick={save}
            className={cn(buttonStyles.primary, "disabled:opacity-60")}
          >
            <Icon name="check" size={16} />
            {pending ? "Saving…" : "Save adjustment"}
          </button>
        </>
      }
    >
      {initialId ? null : (
        <div className="flex flex-col gap-2">
          <label htmlFor="adj-size" className="text-[14px] font-semibold">
            Product and size
          </label>
          <SelectBox id="adj-size" value={id} onChange={(e) => pick(e.target.value)}>
            <option value="">Choose a size</option>
            {rows.map((r) => (
              <option key={r.id} value={r.id}>
                {r.productShort} · {r.label} ({r.stock} on hand)
              </option>
            ))}
          </SelectBox>
        </div>
      )}
      {row ? (
        <>
          <div className="border-admin-line flex items-center gap-3 rounded-[12px] border p-3">
            <ProductThumb src={row.image} size={46} />
            <span className="flex min-w-0 flex-col">
              <span className="font-semibold">{row.product}</span>
              <span className="text-admin-muted">
                {row.label} · {row.sku} · {row.stock} on hand
                {row.reserved ? ` · ${row.reserved} in orders` : ""}
              </span>
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[14px] font-semibold">Change</span>
            <div
              role="radiogroup"
              aria-label="Change"
              className="bg-admin-seg flex gap-[2px] rounded-[10px] p-[3px]"
            >
              {(
                [
                  ["add", "Add"],
                  ["remove", "Remove"],
                  ["set", "Set to"],
                ] as const
              ).map(([m, l]) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => {
                    setMode(m);
                    setReason(m === "add" ? "Restock" : m === "set" ? "Recount" : "Damaged");
                    if (m === "set") setQty(row.stock);
                  }}
                  className={cn(
                    "text-admin-text h-8 cursor-pointer rounded-[8px] border-0 px-[14px] text-[14px]",
                    mode === m
                      ? "bg-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
                      : "bg-transparent font-medium",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="adj-qty" className="text-[14px] font-semibold">
              {mode === "set" ? "New on-hand count" : "Quantity"}
            </label>
            <span className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Less"
                onClick={() => setQty((q) => Math.max(0, q - 1))}
                className="size-10 cursor-pointer rounded-[10px] border border-[#d4d4d1] bg-white text-[18px]"
              >
                −
              </button>
              <input
                id="adj-qty"
                inputMode="numeric"
                value={qty}
                onChange={(e) =>
                  setQty(
                    Math.max(
                      0,
                      Math.min(1_000_000, Number(e.target.value.replace(/\D/g, "")) || 0),
                    ),
                  )
                }
                className="h-10 w-[90px] rounded-[10px] border border-[#d4d4d1] text-center text-[15px] font-bold"
              />
              <button
                type="button"
                aria-label="More"
                onClick={() => setQty((q) => q + 1)}
                className="size-10 cursor-pointer rounded-[10px] border border-[#d4d4d1] bg-white text-[18px]"
              >
                +
              </button>
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[14px] font-semibold">Reason</span>
            <div className="flex flex-wrap gap-2">
              {reasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={reason === r}
                  onClick={() => setReason(r)}
                  className={cn(
                    "h-[34px] cursor-pointer rounded-full border px-[14px] text-[14px] font-semibold",
                    reason === r
                      ? "border-forest-600 bg-[#eef3ec] text-[#1d4a2c]"
                      : "text-admin-text border-[#d4d4d1] bg-white",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="adj-note" className="text-[14px] font-semibold">
              Note <span className="text-admin-muted font-normal">(optional)</span>
            </label>
            <textarea
              id="adj-note"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              className={cn(fieldStyles.textarea, "min-h-[72px]")}
            />
          </div>
          <div
            className={cn(
              "flex items-center justify-between rounded-[12px] p-[14px]",
              tooLow ? "bg-[#fdecea]" : "bg-[#f7f7f5]",
            )}
          >
            <span className={tooLow ? "text-[#8f1d14]" : "text-admin-muted"}>
              {tooLow
                ? `Can't go below ${row.reserved} (held by open orders)`
                : "On hand after change"}
            </span>
            <span className="text-[18px] font-bold">
              {row.stock} → {Math.max(0, after)}
            </span>
          </div>
          <div className="flex flex-col gap-3 border-t border-[#f0f0ee] pt-4">
            <span className="text-[14px] font-bold">Settings for this size</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="adj-reorder" className="text-[14px] font-semibold">
                  Low stock at
                </label>
                <input
                  id="adj-reorder"
                  inputMode="numeric"
                  value={reorder}
                  onChange={(e) => setReorder(e.target.value.replace(/\D/g, ""))}
                  className={fieldStyles.input}
                />
              </div>
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="adj-cost" className="text-[14px] font-semibold">
                  Unit cost (Rs)
                </label>
                <input
                  id="adj-cost"
                  inputMode="numeric"
                  placeholder="Not set"
                  value={cost}
                  onChange={(e) => setCost(e.target.value.replace(/[^\d,]/g, ""))}
                  className={fieldStyles.input}
                />
              </div>
            </div>
            <span className="text-admin-muted text-[14px]">
              Purchases update the unit cost automatically. It is used for stock value and profit.
            </span>
          </div>
        </>
      ) : null}
    </Drawer>
  );
}

export function AdjustStockButton({ rows }: { rows: StockRowView[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonStyles.primary}>
        <Icon name="edit" size={16} />
        Adjust stock
      </button>
      {open ? (
        <AdjustDrawer open onClose={() => setOpen(false)} rows={rows} initialId={null} />
      ) : null}
    </>
  );
}

export function StockTable({
  rows,
  canAdjust,
  compact,
}: {
  rows: StockRowView[];
  canAdjust: boolean;
  compact: boolean;
}) {
  const [adjusting, setAdjusting] = useState<string | null>(null);
  return (
    <>
      <div className="border-admin-line hidden overflow-x-auto border-t md:block">
        <div className="min-w-[1000px]" role="table" aria-label="Stock">
          <div
            role="row"
            className={cn(
              tableStyles.head,
              "bg-[linear-gradient(to_left,#efede8_92px,#f4f2ee_92px)]",
            )}
            style={GRID}
          >
            <span role="columnheader">Product</span>
            <span role="columnheader">SKU</span>
            <span role="columnheader" className="text-right">
              On hand
            </span>
            <span role="columnheader" className="text-right">
              Reserved
            </span>
            <span role="columnheader" className="text-right">
              Available
            </span>
            <span role="columnheader" className="text-right">
              Reorder at
            </span>
            <span role="columnheader">Status</span>
            <span role="columnheader" className="text-right">
              Stock value
            </span>
            <span role="columnheader" aria-label="Actions" />
          </div>
          {rows.map((r) => (
            <div
              key={r.id}
              role="row"
              className={cn(tableStyles.row, compact ? "min-h-12 py-[6px]" : "min-h-[62px]")}
              style={{
                ...GRID,
                background: `linear-gradient(to left, ${r.status === "out" ? "#fbf3f2" : r.status === "low" ? "#fbf6ec" : "#f7f6f3"} 92px, ${r.status === "out" ? "#fffafa" : r.status === "low" ? "#fffcf5" : "#ffffff"} 92px)`,
              }}
            >
              <span role="cell" className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="h-10 w-1 shrink-0 rounded-[4px]"
                  style={{
                    background:
                      r.status === "out"
                        ? "#d92d20"
                        : r.status === "low"
                          ? "#f59e0b"
                          : "transparent",
                  }}
                />
                {compact ? null : <ProductThumb src={r.image} />}
                <span className="flex min-w-0 flex-col">
                  <Link
                    href={`/products/${r.productId}`}
                    className="font-semibold text-forest-600 hover:underline"
                  >
                    {r.productShort}
                  </Link>
                  <span className="text-admin-muted">{r.label}</span>
                </span>
              </span>
              <span role="cell" className="text-admin-muted whitespace-nowrap">
                {r.sku}
              </span>
              <span role="cell" className="text-right">
                {r.stock.toLocaleString("en-US")}
              </span>
              <span role="cell" className="text-admin-muted text-right">
                {r.reserved.toLocaleString("en-US")}
              </span>
              <span
                role="cell"
                className={cn(
                  "text-right font-bold",
                  r.status === "out"
                    ? "text-[#b42318]"
                    : r.status === "low"
                      ? "text-[#8a5a00]"
                      : "",
                )}
              >
                {r.available.toLocaleString("en-US")}
              </span>
              <span role="cell" className="text-admin-muted text-right">
                {r.reorderAt}
              </span>
              <span role="cell">
                <StatusBadge
                  status={STATUS_LABEL[r.status].toLowerCase()}
                  label={STATUS_LABEL[r.status]}
                />
              </span>
              <span role="cell" className="text-right font-bold whitespace-nowrap">
                {r.value}
              </span>
              <span role="cell" className="flex justify-center">
                {canAdjust ? (
                  <button
                    type="button"
                    onClick={() => setAdjusting(r.id)}
                    className="border-admin-field h-8 cursor-pointer rounded-[8px] border bg-white px-3 text-[14px] font-semibold hover:bg-[#fafaf9]"
                  >
                    Adjust
                  </button>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ul className="m-0 flex list-none flex-col p-0 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 border-b border-[#efefed] px-4 py-3">
            <ProductThumb src={r.image} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-semibold text-forest-600">
                {r.productShort} · {r.label}
              </span>
              <span className="text-admin-muted text-[14px]">
                {r.available} available · {r.stock} on hand
              </span>
            </span>
            {canAdjust ? (
              <button
                type="button"
                onClick={() => setAdjusting(r.id)}
                className="border-admin-field h-8 rounded-[8px] border bg-white px-3 text-[14px] font-semibold"
              >
                Adjust
              </button>
            ) : (
              <StatusBadge
                status={STATUS_LABEL[r.status].toLowerCase()}
                label={STATUS_LABEL[r.status]}
              />
            )}
          </li>
        ))}
      </ul>

      {adjusting ? (
        <AdjustDrawer
          key={adjusting}
          open
          onClose={() => setAdjusting(null)}
          rows={rows}
          initialId={adjusting}
        />
      ) : null}
    </>
  );
}
