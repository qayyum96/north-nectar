"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { buttonStyles } from "@/components/ui";
import { PaymentDialog } from "../payment-dialog";

export function RecordPaymentButton({
  purchase,
}: {
  purchase: { id: string; number: string; due: number };
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonStyles.primary}>
        <Icon name="payments" size={16} />
        Record payment
      </button>
      {open ? <PaymentDialog purchase={purchase} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
