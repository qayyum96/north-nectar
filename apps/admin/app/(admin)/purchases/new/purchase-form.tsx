"use client";

import { cn, formatPkr } from "@northnectar/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import {
  Card,
  CardHeader,
  PageBody,
  PageHeader,
  SelectBox,
  buttonStyles,
  fieldStyles,
} from "@/components/ui";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { SupplierDialog } from "../../suppliers/supplier-dialog";
import { recordPurchase } from "../actions";
import { PAID_BY } from "../payment-dialog";

export interface PickSize {
  id: string;
  label: string;
  short: string;
  unitCost: number | null;
}

interface Line {
  key: string;
  variantId: string;
  description: string;
  detail: string;
  quantity: string;
  unitCost: string;
}

const OTHER = "__other";
const RED = "border-[#d92d20]";
const num = (v: string) => Math.round(Number(v.replace(/[,\s]/g, "")) || 0);

export function PurchaseForm({
  suppliers,
  sizes,
  initialSupplier,
  today,
}: {
  suppliers: { id: string; name: string }[];
  sizes: PickSize[];
  initialSupplier: string;
  today: string;
}) {
  const [supplierList, setSupplierList] = useState(suppliers);
  const [supplierId, setSupplierId] = useState(initialSupplier);
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [date, setDate] = useState(today);
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<Line[]>([
    {
      key: crypto.randomUUID(),
      variantId: "",
      description: "",
      detail: "",
      quantity: "",
      unitCost: "",
    },
  ]);
  const [payment, setPayment] = useState<"paid" | "partly" | "unpaid">("paid");
  const [amountPaid, setAmountPaid] = useState("");
  const [paidBy, setPaidBy] = useState("Bank transfer");
  const [delivery, setDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [bill, setBill] = useState<{ path: string; name: string; size: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const file = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();

  const byId = new Map(sizes.map((s) => [s.id, s]));
  const itemsTotal = lines.reduce((s, l) => s + num(l.quantity) * num(l.unitCost), 0);
  const total = itemsTotal + num(delivery);
  const stocked = lines.filter((l) => l.variantId && l.variantId !== OTHER && num(l.quantity) > 0);
  const units = stocked.reduce((s, l) => s + num(l.quantity), 0);
  const paid = payment === "paid" ? total : payment === "unpaid" ? 0 : num(amountPaid);

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const uploadBill = async (f: File) => {
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(f.type))
      return toast.error("Use a JPG, PNG or PDF file.");
    if (f.size > 10 * 1024 * 1024) return toast.error("The bill must be under 10 MB.");
    setUploading(true);
    try {
      const safe = f.name.replace(/[^\w.-]+/g, "-").slice(-80);
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}-${safe}`;
      const { error } = await createBrowserSupabase()
        .storage.from("bills")
        .upload(path, f, { contentType: f.type });
      if (error) throw new Error(error.message);
      setBill({ path, name: f.name, size: f.size });
    } catch (e) {
      toast.error(e instanceof Error ? `Upload failed: ${e.message}` : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = () =>
    start(async () => {
      const result = await recordPurchase({
        supplierId,
        date,
        reference,
        lines: lines
          .filter((l) => l.variantId || l.description || l.quantity || l.unitCost)
          .map((l) => ({
            variantId: l.variantId === OTHER ? "" : l.variantId,
            description: l.variantId === OTHER ? l.description : "",
            detail: l.variantId === OTHER ? l.detail : "",
            quantity: num(l.quantity),
            unitCost: num(l.unitCost),
          })),
        deliveryCost: num(delivery),
        payment,
        amountPaid: num(amountPaid),
        paidBy,
        notes,
        bill,
      });
      if (!result.ok) {
        setErrors(result.fields ?? {});
        return toast.error(result.error);
      }
      toast.show(result.message, { label: "View stock", onClick: () => router.push("/stock") });
      router.push("/purchases");
    });

  const summary = stocked
    .map((l) => {
      const s = byId.get(l.variantId);
      return s ? `${num(l.quantity).toLocaleString("en-US")} × ${s.short}` : "";
    })
    .filter(Boolean);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Inventory" },
          { label: "Purchases", href: "/purchases" },
          { label: "New purchase" },
        ]}
        title="Record purchase"
        subtitle="Saving adds the units to stock and records the cost for profit"
        actions={
          <>
            <Link href="/purchases" className={buttonStyles.secondary}>
              Cancel
            </Link>
            <button
              type="button"
              disabled={pending || uploading}
              onClick={save}
              className={cn(buttonStyles.primary, "disabled:opacity-60")}
            >
              <Icon name="check" size={16} />
              {pending ? "Saving…" : "Save purchase"}
            </button>
          </>
        }
      />
      <PageBody>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex flex-wrap items-start gap-4"
        >
          <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
            <Card>
              <CardHeader title="Purchase details" />
              <div className="grid grid-cols-1 gap-[14px] md:grid-cols-3">
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="pu-supplier" className="text-[14px] font-semibold">
                    Supplier
                  </label>
                  <SelectBox
                    id="pu-supplier"
                    value={supplierId}
                    onChange={(e) =>
                      e.target.value === "__new"
                        ? setAddingSupplier(true)
                        : setSupplierId(e.target.value)
                    }
                    className={errors.supplierId ? RED : undefined}
                  >
                    <option value="">Choose a supplier</option>
                    {supplierList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                    <option value="__new">+ Add a new supplier</option>
                  </SelectBox>
                  {errors.supplierId ? (
                    <span className="text-[14px] text-[#b42318]">{errors.supplierId}</span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="pu-date" className="text-[14px] font-semibold">
                    Purchase date
                  </label>
                  <input
                    id="pu-date"
                    type="date"
                    value={date}
                    max={today}
                    onChange={(e) => setDate(e.target.value)}
                    className={fieldStyles.input}
                  />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="pu-ref" className="text-[14px] font-semibold">
                    Bill or reference no.
                  </label>
                  <input
                    id="pu-ref"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Optional"
                    className={fieldStyles.input}
                  />
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Items" />
              <div className="overflow-x-auto">
                <div className="min-w-[560px]">
                  <div className="text-admin-muted grid grid-cols-[2fr_90px_120px_120px_36px] gap-[10px] border-b border-[#e3e3e3] py-[10px] text-[14px] font-semibold">
                    <span>Product and size</span>
                    <span>Quantity</span>
                    <span>Unit cost</span>
                    <span className="text-right">Line total</span>
                    <span />
                  </div>
                  {lines.map((l, i) => (
                    <div
                      key={l.key}
                      className="grid grid-cols-[2fr_90px_120px_120px_36px] items-start gap-[10px] border-b border-[#f0f0ee] py-[10px]"
                    >
                      <span className="flex flex-col gap-2">
                        <SelectBox
                          aria-label={`Item ${i + 1}`}
                          value={l.variantId}
                          onChange={(e) => {
                            const s = byId.get(e.target.value);
                            setLine(i, {
                              variantId: e.target.value,
                              unitCost:
                                l.unitCost || (s?.unitCost != null ? String(s.unitCost) : ""),
                            });
                          }}
                          className={errors[`lines.${i}.description`] ? RED : undefined}
                        >
                          <option value="">Choose a product and size</option>
                          {sizes.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                          <option value={OTHER}>Other item (packaging, labels…)</option>
                        </SelectBox>
                        {l.variantId === OTHER ? (
                          <>
                            <input
                              aria-label={`Item ${i + 1} name`}
                              placeholder="Item, e.g. Kraft stand-up pouches"
                              value={l.description}
                              onChange={(e) => setLine(i, { description: e.target.value })}
                              className={fieldStyles.input}
                            />
                            <input
                              aria-label={`Item ${i + 1} details`}
                              placeholder="Details (optional)"
                              value={l.detail}
                              onChange={(e) => setLine(i, { detail: e.target.value })}
                              className={fieldStyles.input}
                            />
                          </>
                        ) : null}
                      </span>
                      <input
                        aria-label={`Quantity ${i + 1}`}
                        inputMode="numeric"
                        value={l.quantity}
                        onChange={(e) =>
                          setLine(i, { quantity: e.target.value.replace(/[^\d,]/g, "") })
                        }
                        className={cn(fieldStyles.input, errors[`lines.${i}.quantity`] && RED)}
                      />
                      <input
                        aria-label={`Unit cost ${i + 1}`}
                        inputMode="numeric"
                        value={l.unitCost}
                        onChange={(e) =>
                          setLine(i, { unitCost: e.target.value.replace(/[^\d,]/g, "") })
                        }
                        className={cn(fieldStyles.input, errors[`lines.${i}.unitCost`] && RED)}
                      />
                      <span className="pt-[10px] text-right font-semibold whitespace-nowrap">
                        {formatPkr(num(l.quantity) * num(l.unitCost))}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove item ${i + 1}`}
                        disabled={lines.length === 1}
                        onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                        className="text-admin-muted mt-[6px] grid size-7 cursor-pointer place-items-center rounded-[6px] border-0 bg-transparent hover:text-[#b42318] disabled:opacity-30"
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setLines((ls) => [
                    ...ls,
                    {
                      key: crypto.randomUUID(),
                      variantId: "",
                      description: "",
                      detail: "",
                      quantity: "",
                      unitCost: "",
                    },
                  ])
                }
                className="mt-3 inline-flex cursor-pointer items-center gap-[6px] border-0 bg-transparent p-0 text-[14px] font-semibold text-forest-600 hover:underline"
              >
                <Icon name="plus" size={16} />
                Add item
              </button>
              {errors.lines ? (
                <p className="m-0 pt-2 text-[14px] text-[#b42318]">{errors.lines}</p>
              ) : null}
            </Card>

            <Card>
              <CardHeader title="Bill photo" />
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => file.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f) void uploadBill(f);
                  }}
                  className="text-admin-muted flex flex-[1_1_260px] cursor-pointer flex-col items-center gap-[6px] rounded-[12px] border-[1.5px] border-dashed border-[#c9c9c5] bg-transparent p-[26px] text-center hover:bg-[#fafaf9]"
                >
                  <Icon name="upload" size={18} />
                  <span>
                    <strong className="text-admin-text">
                      {uploading ? "Uploading…" : "Upload a photo or PDF"}
                    </strong>{" "}
                    of the supplier bill
                  </span>
                  <span>JPG, PNG or PDF up to 10 MB</span>
                </button>
                <input
                  ref={file}
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void uploadBill(f);
                  }}
                />
                {bill ? (
                  <span className="border-admin-line flex items-center gap-3 rounded-[12px] border p-3">
                    <span className="grid size-10 place-items-center rounded-[8px] bg-[#f3eadb] text-[#8a5a00]">
                      <Icon name="file" size={18} />
                    </span>
                    <span className="flex flex-col">
                      <span className="font-semibold">{bill.name}</span>
                      <span className="text-admin-muted">
                        {(bill.size / 1024 / 1024).toFixed(1)} MB · uploaded
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label="Remove bill"
                      onClick={() => setBill(null)}
                      className="text-admin-muted grid size-7 cursor-pointer place-items-center rounded-[6px] border-0 bg-transparent hover:text-[#b42318]"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </span>
                ) : null}
              </div>
            </Card>
          </div>

          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
            <Card>
              <CardHeader title="Payment" />
              <div
                role="radiogroup"
                aria-label="Payment"
                className="bg-admin-seg inline-flex gap-[2px] rounded-[10px] p-[3px]"
              >
                {(
                  [
                    ["paid", "Paid"],
                    ["partly", "Partly paid"],
                    ["unpaid", "Unpaid"],
                  ] as const
                ).map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={payment === k}
                    onClick={() => setPayment(k)}
                    className={cn(
                      "text-admin-text h-8 cursor-pointer rounded-[8px] border-0 px-[14px] text-[14px]",
                      payment === k
                        ? "bg-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
                        : "bg-transparent font-medium",
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {payment === "partly" ? (
                <div className="flex flex-col gap-[6px] pt-4">
                  <label htmlFor="pu-paid" className="text-[14px] font-semibold">
                    Amount paid
                  </label>
                  <input
                    id="pu-paid"
                    inputMode="numeric"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value.replace(/[^\d,]/g, ""))}
                    className={cn(fieldStyles.input, errors.amountPaid && RED)}
                  />
                  <span className="text-admin-muted text-[14px]">
                    Balance due {formatPkr(Math.max(0, total - paid))}
                  </span>
                </div>
              ) : null}
              {payment !== "unpaid" ? (
                <div className="flex flex-col gap-[6px] pt-4">
                  <label htmlFor="pu-by" className="text-[14px] font-semibold">
                    Paid by
                  </label>
                  <SelectBox id="pu-by" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                    {PAID_BY.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </SelectBox>
                </div>
              ) : (
                <p className="text-admin-muted m-0 pt-3 text-[14px]">
                  You can record payments later from the purchases list.
                </p>
              )}
            </Card>

            <Card>
              <CardHeader title="Summary" />
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-admin-muted">Units</span>
                  <span className="font-semibold">{units.toLocaleString("en-US")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-admin-muted">Items total</span>
                  <span className="font-semibold">{formatPkr(itemsTotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="pu-delivery" className="text-admin-muted">
                    Delivery to warehouse
                  </label>
                  <input
                    id="pu-delivery"
                    inputMode="numeric"
                    placeholder="0"
                    value={delivery}
                    onChange={(e) => setDelivery(e.target.value.replace(/[^\d,]/g, ""))}
                    className={cn(fieldStyles.input, "h-9 w-[110px] text-right")}
                  />
                </div>
                <div className="border-admin-line-soft flex justify-between border-t pt-2 text-[15px] font-bold">
                  <span>Total</span>
                  <span>{formatPkr(total)}</span>
                </div>
              </div>
              {summary.length ? (
                <div className="mt-[14px] flex gap-2 rounded-[10px] bg-[#f3f7f1] p-3 text-[#1d4a2c]">
                  <Icon name="stock" size={14} className="mt-[3px] shrink-0" />
                  <span>
                    Saving adds <strong>{units.toLocaleString("en-US")} units</strong> to stock:{" "}
                    {summary.join(" and ")}.
                  </span>
                </div>
              ) : null}
            </Card>

            <Card>
              <CardHeader title="Notes" />
              <textarea
                aria-label="Notes"
                value={notes}
                maxLength={2000}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. November harvest, second batch."
                className={cn(fieldStyles.textarea, "min-h-20")}
              />
            </Card>
          </div>
        </form>
      </PageBody>
      {addingSupplier ? (
        <SupplierDialog
          open
          onClose={() => setAddingSupplier(false)}
          onSaved={(id, name) => {
            setSupplierList((l) =>
              [...l, { id, name }].sort((a, b) => a.name.localeCompare(b.name)),
            );
            setSupplierId(id);
          }}
        />
      ) : null}
    </>
  );
}
