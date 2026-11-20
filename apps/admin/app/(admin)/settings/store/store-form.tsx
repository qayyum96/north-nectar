"use client";

import { cn } from "@northnectar/ui";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import {
  Card,
  CardHeader,
  Field,
  PageBody,
  PageHeader,
  SelectBox,
  buttonStyles,
  fieldStyles,
} from "@/components/ui";
import { type StoreInput, saveStore } from "../actions";
import { SettingsFrame } from "../settings-frame";

const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Kashmir",
];
const DATE_FORMATS = [
  { value: "d MMM yyyy", label: "20 Nov 2026" },
  { value: "dd/MM/yyyy", label: "20/11/2026" },
  { value: "yyyy-MM-dd", label: "2026-11-20" },
];

export function StoreForm({ initial }: { initial: StoreInput }) {
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const dirty = JSON.stringify(v) !== JSON.stringify(saved);
  const set =
    (k: keyof StoreInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setV({ ...v, [k]: e.target.value });

  const input = (
    k: keyof StoreInput,
    label: string,
    extra?: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <Field label={label} htmlFor={`st-${k}`} error={errors[k]}>
      <input
        id={`st-${k}`}
        value={v[k]}
        onChange={set(k)}
        className={cn(fieldStyles.input, errors[k] && "border-[#d92d20]")}
        {...extra}
      />
    </Field>
  );

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Settings" }, { label: "Store details" }]}
        title="Store details"
        subtitle="Your store name, contact details and address"
        actions={
          <>
            <button
              type="button"
              disabled={!dirty || pending}
              onClick={() => {
                setV(saved);
                setErrors({});
              }}
              className={cn(buttonStyles.secondary, "disabled:opacity-50")}
            >
              Discard
            </button>
            <button
              type="button"
              disabled={!dirty || pending}
              onClick={() =>
                start(async () => {
                  const r = await saveStore(v);
                  if (!r.ok) {
                    setErrors(r.fields ?? {});
                    return toast.error(r.error);
                  }
                  setErrors({});
                  setSaved(v);
                  toast.show(r.message);
                  router.refresh();
                })
              }
              className={cn(buttonStyles.primary, "disabled:opacity-60")}
            >
              <Icon name="check" size={16} />
              {pending ? "Saving…" : "Save changes"}
            </button>
          </>
        }
      />
      <PageBody>
        <SettingsFrame active="store">
          <Card>
            <CardHeader title="Store details" />
            <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
              {input("store_name", "Store name")}
              {input("email", "Store email", { type: "email" })}
              {input("phone", "Phone and WhatsApp", { inputMode: "tel" })}
              <Field label="Currency" htmlFor="st-currency">
                <SelectBox id="st-currency" value={v.currency} onChange={set("currency")}>
                  <option value="PKR">Pakistani Rupee (Rs)</option>
                </SelectBox>
              </Field>
              <Field label="Time zone" htmlFor="st-tz">
                <SelectBox id="st-tz" value={v.time_zone} onChange={set("time_zone")}>
                  <option value="Asia/Karachi">(GMT+05:00) Karachi</option>
                </SelectBox>
              </Field>
              <Field label="Date format" htmlFor="st-df">
                <SelectBox id="st-df" value={v.date_format} onChange={set("date_format")}>
                  {DATE_FORMATS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </SelectBox>
              </Field>
            </div>
          </Card>
          <Card>
            <CardHeader title="Business address" />
            <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
              {input("address", "Address")}
              {input("city", "City")}
              <Field label="Province" htmlFor="st-province">
                <SelectBox id="st-province" value={v.province} onChange={set("province")}>
                  {PROVINCES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </SelectBox>
              </Field>
              {input("postal_code", "Postal code", { inputMode: "numeric" })}
            </div>
          </Card>
          <p className="text-admin-muted m-0 text-[14px]">
            These details are printed on invoices. The website&apos;s contact page and footer keep
            their own text for now.
          </p>
        </SettingsFrame>
      </PageBody>
    </>
  );
}
