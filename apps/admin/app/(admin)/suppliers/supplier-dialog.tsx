"use client";

import { cn } from "@northnectar/ui";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Dialog } from "@/components/dialog";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import { Field, buttonStyles, fieldStyles } from "@/components/ui";
import { type SupplierInput, saveSupplier } from "./actions";

export type SupplierFormValues = Omit<SupplierInput, "id">;

const EMPTY: SupplierFormValues = {
  name: "",
  supplies: "",
  contactName: "",
  phone: "",
  email: "",
  city: "",
  address: "",
  paymentTerms: "",
  notes: "",
};

/** Add / edit supplier (designed in the mockup's dialog style). */
export function SupplierDialog({
  open,
  onClose,
  id,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  id?: string;
  initial?: SupplierFormValues;
  /** Called with the new id instead of navigating (used inside Record purchase). */
  onSaved?: (id: string, name: string) => void;
}) {
  const [v, setV] = useState<SupplierFormValues>(initial ?? EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const set =
    (k: keyof SupplierFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setV({ ...v, [k]: e.target.value });

  const submit = () =>
    start(async () => {
      const result = await saveSupplier({ ...v, id });
      if (!result.ok) {
        setErrors(result.fields ?? {});
        return toast.error(result.error);
      }
      toast.show(result.message);
      onClose();
      if (onSaved) onSaved(result.id, v.name.trim());
      else if (id) router.refresh();
      else router.push(`/suppliers/${result.id}`);
    });

  const input = (
    k: keyof SupplierFormValues,
    label: string,
    extra?: Partial<React.InputHTMLAttributes<HTMLInputElement>>,
  ) => (
    <Field label={label} htmlFor={`sup-${k}`} error={errors[k]}>
      <input
        id={`sup-${k}`}
        autoComplete="off"
        value={v[k] ?? ""}
        onChange={set(k)}
        className={cn(fieldStyles.input, errors[k] && "border-[#d92d20]")}
        {...extra}
      />
    </Field>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={id ? "Edit supplier" : "Add supplier"}
      width={600}
      footer={
        <>
          <button type="button" onClick={onClose} className={buttonStyles.secondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className={cn(buttonStyles.primary, "disabled:opacity-60")}
          >
            <Icon name="check" size={16} />
            {pending ? "Saving…" : id ? "Save changes" : "Add supplier"}
          </button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-[14px]"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {input("name", "Supplier name")}
          {input("supplies", "What they supply", { placeholder: "e.g. Sea buckthorn berries" })}
          {input("contactName", "Contact person")}
          {input("phone", "Phone", { inputMode: "tel", placeholder: "0355 4120987" })}
          {input("email", "Email (optional)", { type: "email" })}
          {input("city", "City")}
        </div>
        {input("address", "Address")}
        <Field
          label="Payment terms"
          htmlFor="sup-terms"
          hint="e.g. 50% advance, balance on delivery, and their bank details"
        >
          <textarea
            id="sup-terms"
            value={v.paymentTerms}
            onChange={set("paymentTerms")}
            className={cn(fieldStyles.textarea, "min-h-[72px]")}
          />
        </Field>
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Dialog>
  );
}

export function AddSupplierButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonStyles.primary}>
        <Icon name="plus" size={16} />
        Add supplier
      </button>
      {open ? <SupplierDialog open onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function EditSupplierButton({ id, initial }: { id: string; initial: SupplierFormValues }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonStyles.secondary}>
        <Icon name="edit" size={16} />
        Edit
      </button>
      {open ? (
        <SupplierDialog open onClose={() => setOpen(false)} id={id} initial={initial} />
      ) : null}
    </>
  );
}
