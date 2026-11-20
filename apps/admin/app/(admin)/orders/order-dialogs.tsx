"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DangerButton, Dialog } from "@/components/dialog";
import { useToast } from "@/components/toast";
import { buttonStyles, Field, SelectBox } from "@/components/ui";
import type { WhatsappKind } from "@/lib/orders";
import { type ActionResult, logWhatsapp, setPaymentStatus, updateOrderStatus } from "./actions";

const CANCEL_REASONS = [
  "Customer changed their mind",
  "Could not reach customer",
  "Out of stock",
  "Suspected fake order",
  "Other",
];
const RETURN_REASONS = [
  "Customer refused delivery",
  "Could not deliver",
  "Damaged in transit",
  "Customer returned it",
  "Other",
];

/**
 * Runs an order action and shows the result as a toast: "Undo" after confirming or marking paid,
 * and a one-tap prefilled WhatsApp message after confirming, shipping or cancelling.
 */
export function useOrderAction(orderId: string) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();

  const report = (result: ActionResult, kind?: WhatsappKind) => {
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.refresh();
    if (result.undo === "confirm") {
      const undo = {
        label: "Undo",
        onClick: () =>
          start(async () => report(await updateOrderStatus({ orderId, to: "pending" }))),
      };
      toast.show(
        result.message,
        result.whatsapp
          ? [
              {
                label: "Send on WhatsApp",
                href: result.whatsapp,
                onClick: () => void logWhatsapp(orderId, "confirmed"),
              },
              undo,
            ]
          : undo,
      );
    } else if (result.undo === "paid") {
      toast.show(result.message, {
        label: "Undo",
        onClick: () =>
          start(async () => report(await setPaymentStatus({ orderId, status: "unpaid" }))),
      });
    } else if (result.whatsapp && kind) {
      toast.show(result.message, {
        label: "Send on WhatsApp",
        href: result.whatsapp,
        onClick: () => void logWhatsapp(orderId, kind),
      });
    } else {
      toast.show(result.message);
    }
  };

  const run = (fn: () => Promise<ActionResult>, kind?: WhatsappKind, after?: () => void) =>
    start(async () => {
      const result = await fn();
      report(result, kind);
      if (result.ok) after?.();
    });

  return { pending, run };
}

export function CancelOrderDialog({
  open,
  onClose,
  orderId,
  number,
  units,
  customerFirstName,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
  number: string;
  units: number;
  customerFirstName: string;
}) {
  const [reason, setReason] = useState(CANCEL_REASONS[0]!);
  const { pending, run } = useOrderAction(orderId);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Cancel order #${number}?`}
      footer={
        <>
          <button type="button" onClick={onClose} className={buttonStyles.secondary}>
            Keep order
          </button>
          <DangerButton
            disabled={pending}
            onClick={() =>
              run(
                () => updateOrderStatus({ orderId, to: "cancelled", reason }),
                "cancelled",
                onClose,
              )
            }
          >
            {pending ? "Cancelling…" : "Cancel order"}
          </DangerButton>
        </>
      }
    >
      <div className="flex flex-col gap-[14px]">
        <p className="text-admin-muted m-0 leading-[1.6]">
          The {units} reserved {units === 1 ? "unit goes" : "units go"} back to stock. You can send{" "}
          {customerFirstName} a cancellation message on WhatsApp next.
        </p>
        <Field label="Reason" htmlFor="cancel-reason">
          <SelectBox id="cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
            {CANCEL_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </SelectBox>
        </Field>
      </div>
    </Dialog>
  );
}

export function ReturnOrderDialog({
  open,
  onClose,
  orderId,
  number,
  units,
  paid,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
  number: string;
  units: number;
  paid: boolean;
}) {
  const [reason, setReason] = useState(RETURN_REASONS[0]!);
  const [restock, setRestock] = useState(true);
  const [refund, setRefund] = useState(paid);
  const { pending, run } = useOrderAction(orderId);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Mark order #${number} as returned?`}
      footer={
        <>
          <button type="button" onClick={onClose} className={buttonStyles.secondary}>
            Keep as is
          </button>
          <DangerButton
            disabled={pending}
            onClick={() =>
              run(
                () => updateOrderStatus({ orderId, to: "returned", reason, restock, refund }),
                undefined,
                onClose,
              )
            }
          >
            {pending ? "Saving…" : "Mark as returned"}
          </DangerButton>
        </>
      }
    >
      <div className="flex flex-col gap-[14px]">
        <Field label="Reason" htmlFor="return-reason">
          <SelectBox id="return-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
            {RETURN_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </SelectBox>
        </Field>
        <label className="inline-flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={restock}
            onChange={(e) => setRestock(e.target.checked)}
            className="mt-[3px] size-4 accent-forest-600"
          />
          <span>
            Put the {units} {units === 1 ? "unit" : "units"} back in stock
            <span className="text-admin-muted block">Untick if the goods came back damaged.</span>
          </span>
        </label>
        {paid ? (
          <label className="inline-flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={refund}
              onChange={(e) => setRefund(e.target.checked)}
              className="mt-[3px] size-4 accent-forest-600"
            />
            <span>Mark the payment as refunded</span>
          </label>
        ) : null}
      </div>
    </Dialog>
  );
}
