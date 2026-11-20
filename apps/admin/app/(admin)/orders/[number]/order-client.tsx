"use client";

import { cn } from "@northnectar/ui";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import {
  Card,
  CardHeader,
  SelectBox,
  StatusBadge,
  buttonStyles,
  extraButtonStyles,
  fieldStyles,
} from "@/components/ui";
import {
  addOrderNote,
  logWhatsapp,
  saveDelivery,
  saveInternalNotes,
  saveTags,
  setPaymentStatus,
  updateOrderStatus,
} from "../actions";
import { CancelOrderDialog, ReturnOrderDialog, useOrderAction } from "../order-dialogs";

const COURIERS = ["Leopards Courier", "TCS", "M&P", "PostEx", "Trax", "Pakistan Post"];

interface OrderRef {
  id: string;
  number: string;
  units: number;
  customerFirstName: string;
}

/** Print, cancel and the next step (Confirm → Mark as shipped → Mark as delivered). */
export function OrderHeaderActions({
  order,
  status,
  paid,
}: {
  order: OrderRef;
  status: string;
  paid: boolean;
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const { pending, run } = useOrderAction(order.id);

  const ship = () => {
    const form = document.getElementById("delivery-form") as HTMLFormElement | null;
    const data = form ? new FormData(form) : null;
    run(
      () =>
        updateOrderStatus({
          orderId: order.id,
          to: "shipped",
          courier: String(data?.get("courier") ?? ""),
          tracking: String(data?.get("tracking") ?? ""),
        }),
      "shipped",
    );
  };

  return (
    <>
      <a
        href={`/print/orders?numbers=${order.number}`}
        target="_blank"
        rel="noopener"
        className={buttonStyles.secondary}
      >
        <Icon name="print" size={16} />
        Print invoice
      </a>
      {status === "pending" || status === "confirmed" ? (
        <button
          type="button"
          className={extraButtonStyles.danger}
          onClick={() => setCancelOpen(true)}
        >
          <Icon name="x" size={16} />
          Cancel order
        </button>
      ) : null}
      {status === "shipped" || status === "delivered" ? (
        <button
          type="button"
          className={extraButtonStyles.danger}
          onClick={() => setReturnOpen(true)}
        >
          <Icon name="arrowdown" size={16} />
          Mark as returned
        </button>
      ) : null}
      {status === "pending" ? (
        <button
          type="button"
          disabled={pending}
          className={buttonStyles.primary}
          onClick={() =>
            run(() => updateOrderStatus({ orderId: order.id, to: "confirmed" }), "confirmed")
          }
        >
          <Icon name="check" size={16} />
          Confirm order
        </button>
      ) : null}
      {status === "confirmed" ? (
        <button type="button" disabled={pending} className={buttonStyles.primary} onClick={ship}>
          <Icon name="shipping" size={16} />
          Mark as shipped
        </button>
      ) : null}
      {status === "shipped" ? (
        <button
          type="button"
          disabled={pending}
          className={buttonStyles.primary}
          onClick={() =>
            run(() => updateOrderStatus({ orderId: order.id, to: "delivered" }), "delivered")
          }
        >
          <Icon name="check" size={16} />
          Mark as delivered
        </button>
      ) : null}
      <CancelOrderDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        orderId={order.id}
        number={order.number}
        units={order.units}
        customerFirstName={order.customerFirstName}
      />
      <ReturnOrderDialog
        // Remount when the payment changes, so "refund" starts ticked for a paid order.
        key={paid ? "paid" : "unpaid"}
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        orderId={order.id}
        number={order.number}
        units={order.units}
        paid={paid}
      />
    </>
  );
}

export function PaymentCard({
  orderId,
  status,
  method,
  note,
  fulfilment,
}: {
  orderId: string;
  status: string;
  method: string;
  note: string;
  fulfilment: string;
}) {
  const { pending, run } = useOrderAction(orderId);
  const closed = fulfilment === "cancelled" || fulfilment === "returned";
  return (
    <Card>
      <CardHeader title="Payment" action={<StatusBadge status={status} />} />
      <div className="flex flex-col flex-wrap justify-between gap-3 md:flex-row md:items-center">
        <span className="flex flex-col gap-[2px]">
          <span className="font-semibold">{method}</span>
          <span className="text-admin-muted text-[14px]">{note}</span>
        </span>
        {status === "unpaid" ? (
          <button
            type="button"
            disabled={pending}
            className={cn(buttonStyles.secondary, "self-start md:self-auto")}
            onClick={() => run(() => setPaymentStatus({ orderId, status: "paid" }))}
          >
            <Icon name="check" size={16} />
            Mark as paid
          </button>
        ) : status === "paid" ? (
          <button
            type="button"
            disabled={pending}
            className={cn(buttonStyles.secondary, "self-start md:self-auto")}
            onClick={() =>
              run(() => setPaymentStatus({ orderId, status: closed ? "refunded" : "unpaid" }))
            }
          >
            {closed ? "Mark as refunded" : "Mark as unpaid"}
          </button>
        ) : null}
      </div>
    </Card>
  );
}

export function DeliveryCard({
  orderId,
  courier,
  tracking,
  shipped,
}: {
  orderId: string;
  courier: string;
  tracking: string;
  shipped: boolean;
}) {
  const toast = useToast();
  const [, start] = useTransition();
  const saved = useRef({ courier, tracking });

  const save = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const next = {
      courier: String(data.get("courier") ?? ""),
      tracking: String(data.get("tracking") ?? "").trim(),
    };
    if (next.courier === saved.current.courier && next.tracking === saved.current.tracking) return;
    start(async () => {
      const result = await saveDelivery(orderId, next.courier, next.tracking);
      if (result.ok) {
        saved.current = next;
        if (shipped) toast.show("Delivery details saved");
      } else toast.error(result.error);
    });
  };

  return (
    <Card>
      <CardHeader title="Delivery" />
      <form
        id="delivery-form"
        onSubmit={(e) => {
          e.preventDefault();
          save(e.currentTarget);
        }}
        onChange={(e) => {
          if ((e.target as HTMLElement).tagName === "SELECT") save(e.currentTarget);
        }}
        onBlur={(e) => {
          if ((e.target as HTMLElement).tagName === "INPUT") save(e.currentTarget);
        }}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="courier" className={fieldStyles.label}>
              Courier
            </label>
            <SelectBox id="courier" name="courier" defaultValue={courier}>
              <option value="">Choose a courier</option>
              {COURIERS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </SelectBox>
          </div>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="tracking" className={fieldStyles.label}>
              Tracking number
            </label>
            <input
              id="tracking"
              name="tracking"
              type="text"
              defaultValue={tracking}
              placeholder="e.g. LE7812349011"
              autoComplete="off"
              className={fieldStyles.input}
            />
          </div>
        </div>
        <span className="text-admin-muted block pt-[10px] text-[14px]">
          {shipped
            ? "Changes are saved automatically."
            : "You can send the tracking number to the customer on WhatsApp when you mark the order as shipped."}
        </span>
      </form>
    </Card>
  );
}

export function TimelineNoteForm({ orderId }: { orderId: string }) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <form
      className="flex gap-2 pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        start(async () => {
          const result = await addOrderNote(orderId, text);
          if (result.ok) {
            setText("");
            router.refresh();
          } else toast.error(result.error);
        });
      }}
    >
      <input
        aria-label="Add an internal note"
        placeholder="Add an internal note"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={1000}
        className={cn(fieldStyles.input, "min-w-0 flex-1")}
      />
      <button type="submit" disabled={pending || !text.trim()} className={buttonStyles.secondary}>
        Post
      </button>
    </form>
  );
}

export function InternalNotes({ orderId, initial }: { orderId: string; initial: string }) {
  const toast = useToast();
  const saved = useRef(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const save = async (value: string) => {
    if (value.trim() === saved.current.trim()) return;
    setState("saving");
    const result = await saveInternalNotes(orderId, value);
    if (result.ok) {
      saved.current = value;
      setState("saved");
    } else {
      setState("idle");
      toast.error(result.error);
    }
  };
  return (
    <Card>
      <CardHeader title="Internal notes" />
      <textarea
        aria-label="Internal notes"
        defaultValue={initial}
        maxLength={4000}
        onBlur={(e) => void save(e.target.value)}
        placeholder="Anything your team should know about this order"
        className={fieldStyles.textarea}
      />
      <span className="text-admin-muted block pt-2 text-[14px]">
        {state === "saving"
          ? "Saving…"
          : state === "saved"
            ? "Saved. Only your team can see notes."
            : "Only your team can see notes."}
      </span>
    </Card>
  );
}

export function TagsCard({ orderId, initial }: { orderId: string; initial: string[] }) {
  const [tags, setTags] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const toast = useToast();
  const [, start] = useTransition();

  const commit = (next: string[]) => {
    const before = tags;
    setTags(next);
    start(async () => {
      const result = await saveTags(orderId, next);
      if (!result.ok) {
        setTags(before);
        toast.error(result.error);
      }
    });
  };

  const add = () => {
    const t = draft.trim().slice(0, 30);
    setDraft("");
    setAdding(false);
    if (t && !tags.includes(t)) commit([...tags, t]);
  };

  return (
    <Card>
      <CardHeader title="Tags" />
      <div className="flex flex-wrap gap-[6px]">
        {tags.map((t) => (
          <span
            key={t}
            className="group inline-flex items-center gap-1 rounded-full bg-[#efefed] py-1 pr-[6px] pl-[10px] text-[14px]"
          >
            {t}
            <button
              type="button"
              aria-label={`Remove tag ${t}`}
              onClick={() => commit(tags.filter((x) => x !== t))}
              className="text-admin-muted hover:text-admin-text grid size-[18px] cursor-pointer place-items-center rounded-full border-0 bg-transparent hover:bg-[#e2e2df]"
            >
              <Icon name="x" size={12} strokeWidth={2.2} />
            </button>
          </span>
        ))}
        {adding ? (
          <input
            // The field appears only after "Add tag" is pressed, so focusing it is expected.
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            aria-label="New tag"
            value={draft}
            maxLength={30}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={add}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
              if (e.key === "Escape") {
                setDraft("");
                setAdding(false);
              }
            }}
            className="h-[31px] w-[120px] rounded-full border border-[#c9c9c5] px-[10px] text-[14px]"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-admin-muted cursor-pointer rounded-full border border-dashed border-[#c9c9c5] bg-transparent px-[10px] py-1 text-[14px] hover:bg-[#fafaf9]"
          >
            Add tag
          </button>
        )}
      </div>
    </Card>
  );
}

/** "Message on WhatsApp" link that also notes it on the timeline. */
export function WhatsappLink({
  orderId,
  href,
  className,
  children,
}: {
  orderId: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => void logWhatsapp(orderId, "general")}
      className={className}
    >
      {children}
    </a>
  );
}
