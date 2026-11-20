"use client";

import { cn } from "@northnectar/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Dialog } from "@/components/dialog";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import { Field, SelectBox, buttonStyles, fieldStyles } from "@/components/ui";
import { type CustomerInput, saveCustomer } from "./actions";

const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Kashmir",
];

export type CustomerFormValues = Omit<CustomerInput, "id">;

const EMPTY: CustomerFormValues = {
  name: "",
  phone: "",
  email: "",
  whatsapp: true,
  street: "",
  landmark: "",
  city: "",
  province: "",
  postalCode: "",
  notes: "",
};

/** Add customer / Edit customer dialog (designed in the mockup's style). */
export function CustomerDialog({
  open,
  onClose,
  id,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  id?: string;
  initial?: CustomerFormValues;
}) {
  const [v, setV] = useState<CustomerFormValues>(initial ?? EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingId, setExistingId] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const set =
    (k: keyof CustomerFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setV({
        ...v,
        [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value,
      });
  const cls = (k: string) => cn(fieldStyles.input, errors[k] && "border-[#b42318]");

  const submit = () =>
    start(async () => {
      const result = await saveCustomer({ ...v, id });
      if (result.ok) {
        toast.show(result.message);
        onClose();
        if (id) router.refresh();
        else router.push(`/customers/${result.id}`);
      } else {
        setErrors(result.fields ?? {});
        setExistingId(result.existingId ?? null);
        toast.error(result.error);
      }
    });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={id ? "Edit customer" : "Add customer"}
      width={600}
      note={
        existingId ? (
          <Link
            href={`/customers/${existingId}`}
            className="font-semibold text-forest-600 hover:underline"
          >
            Open the existing customer
          </Link>
        ) : undefined
      }
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
            {pending ? "Saving…" : id ? "Save changes" : "Add customer"}
          </button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
        className="flex flex-col gap-[14px]"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Name" htmlFor="cu-name" error={errors.name}>
            <input
              id="cu-name"
              autoComplete="off"
              value={v.name}
              onChange={set("name")}
              className={cls("name")}
            />
          </Field>
          <Field label="Mobile number" htmlFor="cu-phone" error={errors.phone}>
            <input
              id="cu-phone"
              inputMode="tel"
              autoComplete="off"
              placeholder="0321 1234567"
              value={v.phone}
              onChange={set("phone")}
              className={cls("phone")}
            />
          </Field>
          <Field label="Email (optional)" htmlFor="cu-email" error={errors.email}>
            <input
              id="cu-email"
              type="email"
              autoComplete="off"
              value={v.email}
              onChange={set("email")}
              className={cls("email")}
            />
          </Field>
          <Field label="City" htmlFor="cu-city">
            <input
              id="cu-city"
              autoComplete="off"
              value={v.city}
              onChange={set("city")}
              className={fieldStyles.input}
            />
          </Field>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={v.whatsapp}
            onChange={set("whatsapp")}
            className="size-4 accent-forest-600"
          />
          Accepts WhatsApp updates
        </label>
        <Field label="Street address (optional)" htmlFor="cu-street">
          <input
            id="cu-street"
            autoComplete="off"
            value={v.street}
            onChange={set("street")}
            className={fieldStyles.input}
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px]">
          <Field label="Landmark" htmlFor="cu-landmark">
            <input
              id="cu-landmark"
              autoComplete="off"
              value={v.landmark}
              onChange={set("landmark")}
              className={fieldStyles.input}
            />
          </Field>
          <Field label="Province" htmlFor="cu-province">
            <SelectBox id="cu-province" value={v.province} onChange={set("province")}>
              <option value="">Choose</option>
              {PROVINCES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </SelectBox>
          </Field>
          <Field label="Postal code" htmlFor="cu-postal">
            <input
              id="cu-postal"
              inputMode="numeric"
              autoComplete="off"
              value={v.postalCode}
              onChange={set("postalCode")}
              className={fieldStyles.input}
            />
          </Field>
        </div>
        <Field label="Notes" htmlFor="cu-notes" hint="Only your team can see notes.">
          <textarea
            id="cu-notes"
            value={v.notes}
            onChange={set("notes")}
            maxLength={2000}
            className={cn(fieldStyles.textarea, "min-h-[72px]")}
          />
        </Field>
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Dialog>
  );
}

/** "Add customer" header button with its dialog. */
export function AddCustomerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonStyles.primary}>
        <Icon name="plus" size={16} />
        Add customer
      </button>
      {open ? <CustomerDialog open onClose={() => setOpen(false)} /> : null}
    </>
  );
}

/** "Edit" link for the customer page. */
export function EditCustomerButton({ id, initial }: { id: string; initial: CustomerFormValues }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer border-0 bg-transparent p-0 text-[14px] font-semibold text-forest-600 hover:underline"
      >
        Edit
      </button>
      {open ? (
        <CustomerDialog open onClose={() => setOpen(false)} id={id} initial={initial} />
      ) : null}
    </>
  );
}
