"use client";

import { cn } from "@northnectar/ui";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import {
  Card,
  CardHeader,
  Field,
  PageBody,
  PageHeader,
  Switch,
  buttonStyles,
  fieldStyles,
} from "@/components/ui";
import { type PaymentsInput, savePayments } from "../actions";
import { SettingsFrame } from "../settings-frame";

function Row({
  title,
  text,
  on,
  onChange,
  disabled,
  children,
}: {
  title: string;
  text: string;
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-4 border-b border-[#efefed] py-[14px]">
        <span className="flex flex-col gap-[2px]">
          <span className="text-[14px] font-semibold">{title}</span>
          <span className="text-admin-muted text-[14px]">{text}</span>
        </span>
        <Switch checked={on} onChange={onChange} label={title} disabled={disabled} />
      </div>
      {on && children ? (
        <div className="border-b border-[#efefed] py-[14px]">{children}</div>
      ) : null}
    </>
  );
}

export function PaymentsForm({ initial }: { initial: PaymentsInput }) {
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const dirty = JSON.stringify(v) !== JSON.stringify(saved);
  type Key = keyof PaymentsInput;
  const patch = <K extends Key>(k: K, p: Partial<PaymentsInput[K]>) =>
    setV((x) => ({ ...x, [k]: { ...x[k], ...p } }));
  const text = (k: "bank_transfer" | "jazzcash" | "easypaisa", f: string, label: string) => {
    const key = `${k}.${f}`;
    return (
      <Field label={label} htmlFor={`pay-${k}-${f}`} error={errors[key]}>
        <input
          id={`pay-${k}-${f}`}
          value={(v[k] as Record<string, string | boolean>)[f] as string}
          onChange={(e) => patch(k, { [f]: e.target.value } as never)}
          className={cn(fieldStyles.input, errors[key] && "border-[#d92d20]")}
        />
      </Field>
    );
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Settings" }, { label: "Payments" }]}
        title="Payments"
        subtitle="Choose how customers can pay at checkout"
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
                  const r = await savePayments(v);
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
        <SettingsFrame active="payments">
          <Card className="pt-5 pb-5">
            <CardHeader title="Payment methods" />
            <Row
              title="Cash on delivery"
              text="Customers pay the rider in cash"
              on={v.cod.enabled}
              onChange={(on) => patch("cod", { enabled: on })}
            />
            <Row
              title="Bank transfer"
              text="Show your account details at checkout"
              on={v.bank_transfer.enabled}
              onChange={(on) => patch("bank_transfer", { enabled: on })}
            >
              <div className="grid grid-cols-1 gap-[14px] md:grid-cols-3">
                {text("bank_transfer", "bankName", "Bank name")}
                {text("bank_transfer", "accountTitle", "Account title")}
                {text("bank_transfer", "iban", "IBAN")}
              </div>
            </Row>
            <Row
              title="JazzCash"
              text="Mobile wallet payments"
              on={v.jazzcash.enabled}
              onChange={(on) => patch("jazzcash", { enabled: on })}
            >
              <div className="max-w-[360px]">{text("jazzcash", "number", "JazzCash number")}</div>
            </Row>
            <Row
              title="Easypaisa"
              text="Mobile wallet payments"
              on={v.easypaisa.enabled}
              onChange={(on) => patch("easypaisa", { enabled: on })}
            >
              <div className="max-w-[360px]">{text("easypaisa", "number", "Easypaisa number")}</div>
            </Row>
            <Row
              title="Debit and credit cards (Stripe)"
              text="Coming later: needs a payment gateway account, which has fees"
              on={false}
              onChange={() => {}}
              disabled
            />
            {errors.cod ? (
              <p className="m-0 pt-3 text-[14px] text-[#b42318]">{errors.cod}</p>
            ) : null}
          </Card>
          <p className="text-admin-muted m-0 text-[14px]">
            Changes show at checkout straight away. Wallet numbers are shared with customers on
            WhatsApp after they order.
          </p>
        </SettingsFrame>
      </PageBody>
    </>
  );
}
