"use client";

import { cn } from "@northnectar/ui";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Dialog } from "@/components/dialog";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import { Field, SelectBox, buttonStyles, fieldStyles } from "@/components/ui";
import { recordPayment } from "./actions";

export const PAID_BY = ["Cash", "Bank transfer", "JazzCash", "Easypaisa", "Cheque"];

export function PaymentDialog({
  purchase,
  onClose,
}: {
  purchase: { id: string; number: string; due: number } | null;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(purchase ? String(purchase.due) : "");
  const [paidBy, setPaidBy] = useState("Bank transfer");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const value = Math.round(Number(amount.replace(/[,\s]/g, "")) || 0);
  return (
    <Dialog
      open={!!purchase}
      onClose={onClose}
      title={purchase ? `Record payment for ${purchase.number}` : "Record payment"}
      note={purchase ? `Balance due Rs ${purchase.due.toLocaleString("en-US")}` : undefined}
      footer={
        <>
          <button type="button" onClick={onClose} className={buttonStyles.secondary}>
            Cancel
          </button>
          <button
            type="button"
            disabled={pending || value <= 0}
            className={cn(buttonStyles.primary, "disabled:opacity-60")}
            onClick={() =>
              purchase &&
              start(async () => {
                const r = await recordPayment(purchase.id, Math.min(value, purchase.due), paidBy);
                if (!r.ok) return toast.error(r.error);
                toast.show(r.message);
                onClose();
                router.refresh();
              })
            }
          >
            <Icon name="check" size={16} />
            Save payment
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount paid (Rs)" htmlFor="pay-amount">
          <input
            id="pay-amount"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d,]/g, ""))}
            className={fieldStyles.input}
          />
        </Field>
        <Field label="Paid by" htmlFor="pay-by">
          <SelectBox id="pay-by" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {PAID_BY.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </SelectBox>
        </Field>
      </div>
    </Dialog>
  );
}
