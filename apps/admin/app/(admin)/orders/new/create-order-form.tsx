"use client";

import { cn, formatPkr } from "@northnectar/ui";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import { Card, CardHeader, Field, SelectBox, buttonStyles, fieldStyles } from "@/components/ui";
import { createOrder } from "./actions";

export interface PickVariant {
  id: string;
  product: string;
  label: string;
  sku: string;
  price: number;
  available: number;
  image: string | null;
}

export interface PickCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  whatsapp_opt_in: boolean;
  default_address: {
    street?: string;
    landmark?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  } | null;
}

const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Kashmir",
];
const DELIVERY = [
  { id: "standard", label: "Standard delivery", fee: 250, freeOver: 5000 },
  { id: "express", label: "Express delivery", fee: 450, freeOver: null },
  { id: "pickup", label: "Pickup (no delivery)", fee: 0, freeOver: null },
] as const;
const PAYMENTS = [
  { id: "cod", label: "Cash on delivery" },
  { id: "bank_transfer", label: "Bank transfer" },
  { id: "jazzcash", label: "JazzCash" },
  { id: "easypaisa", label: "Easypaisa" },
] as const;

type DeliveryId = (typeof DELIVERY)[number]["id"];
type PaymentId = (typeof PAYMENTS)[number]["id"];

const fee = (method: DeliveryId, subtotal: number) => {
  const d = DELIVERY.find((x) => x.id === method)!;
  if (d.freeOver !== null && subtotal >= d.freeOver) return 0;
  return d.fee;
};

export function CreateOrderForm({
  variants,
  customers,
  initialCustomerId,
}: {
  variants: PickVariant[];
  customers: PickCustomer[];
  initialCustomerId?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const initial = customers.find((c) => c.id === initialCustomerId);

  const [lines, setLines] = useState<{ variantId: string; quantity: number }[]>([]);
  const [pick, setPick] = useState("");
  const [customerId, setCustomerId] = useState(initial?.id ?? "");
  const [c, setC] = useState({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    whatsapp: initial?.whatsapp_opt_in ?? true,
  });
  const [a, setA] = useState({
    street: initial?.default_address?.street ?? "",
    landmark: initial?.default_address?.landmark ?? "",
    city: initial?.default_address?.city ?? "",
    province: initial?.default_address?.province ?? "",
    postalCode: initial?.default_address?.postalCode ?? "",
  });
  const [delivery, setDelivery] = useState<DeliveryId>("standard");
  const [feeOverride, setFeeOverride] = useState<number | null>(null);
  const [payment, setPayment] = useState<PaymentId>("cod");
  const [paid, setPaid] = useState(false);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const byId = useMemo(() => new Map(variants.map((v) => [v.id, v])), [variants]);
  const subtotal = lines.reduce((s, l) => s + (byId.get(l.variantId)?.price ?? 0) * l.quantity, 0);
  const deliveryFee = feeOverride ?? fee(delivery, subtotal);
  const total = subtotal + deliveryFee;
  const units = lines.reduce((s, l) => s + l.quantity, 0);

  const chooseCustomer = (id: string) => {
    setCustomerId(id);
    const found = customers.find((x) => x.id === id);
    if (!found) return;
    setC({
      name: found.name,
      phone: found.phone,
      email: found.email ?? "",
      whatsapp: found.whatsapp_opt_in,
    });
    setA({
      street: found.default_address?.street ?? "",
      landmark: found.default_address?.landmark ?? "",
      city: found.default_address?.city ?? "",
      province: found.default_address?.province ?? "",
      postalCode: found.default_address?.postalCode ?? "",
    });
  };

  const addLine = () => {
    const v = byId.get(pick);
    if (!v) return;
    setLines((ls) => {
      const existing = ls.find((l) => l.variantId === v.id);
      if (existing)
        return ls.map((l) =>
          l.variantId === v.id ? { ...l, quantity: Math.min(l.quantity + 1, v.available) } : l,
        );
      return [...ls, { variantId: v.id, quantity: 1 }];
    });
    setPick("");
    setErrors((e) => ({ ...e, lines: "" }));
  };

  const submit = () =>
    start(async () => {
      const result = await createOrder({
        customer: c,
        address: a,
        lines,
        delivery: { method: delivery, fee: deliveryFee },
        payment: { method: payment, paid },
        note,
      });
      if (result.ok) {
        toast.show(`Order #${result.number} created · stock reserved`);
        router.push(`/orders/${result.number}`);
      } else {
        setErrors(result.fields ?? {});
        toast.error(result.error);
      }
    });

  const err = (k: string) => errors[k];
  const input = (k: string) => cn(fieldStyles.input, err(k) && "border-[#b42318]");

  const products = [...new Set(variants.map((v) => v.product))];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
      className="flex flex-wrap items-start gap-4"
    >
      <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
        <Card>
          <CardHeader title="Items" />
          <div className="flex flex-wrap gap-2 pb-4">
            <div className="min-w-0 flex-[1_1_320px]">
              <SelectBox
                aria-label="Product and size"
                value={pick}
                onChange={(e) => setPick(e.target.value)}
              >
                <option value="">Choose a product and size</option>
                {products.map((p) => (
                  <optgroup key={p} label={p}>
                    {variants
                      .filter((v) => v.product === p)
                      .map((v) => (
                        <option key={v.id} value={v.id} disabled={v.available === 0}>
                          {v.label} · {formatPkr(v.price)} ·{" "}
                          {v.available === 0 ? "out of stock" : `${v.available} available`}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </SelectBox>
            </div>
            <button
              type="button"
              onClick={addLine}
              disabled={!pick}
              className={cn(buttonStyles.secondary, "disabled:opacity-50")}
            >
              <Icon name="plus" size={16} />
              Add
            </button>
          </div>
          {lines.length === 0 ? (
            <p
              className={cn(
                "border-admin-line-soft m-0 border-t py-6 text-center",
                err("lines") ? "text-[#b42318]" : "text-admin-muted",
              )}
            >
              {err("lines") || "No products yet. Choose a product and size above."}
            </p>
          ) : (
            lines.map((l) => {
              const v = byId.get(l.variantId)!;
              return (
                <div
                  key={l.variantId}
                  className="border-admin-line-soft flex flex-wrap items-center gap-[14px] border-t py-3"
                >
                  {v.image ? (
                    <Image
                      src={v.image}
                      alt=""
                      width={52}
                      height={52}
                      className="border-admin-line size-[54px] rounded-[10px] border object-cover"
                    />
                  ) : (
                    <span className="border-admin-line bg-admin-bg grid size-[54px] place-items-center rounded-[10px] border text-[#a3a3a3]">
                      <Icon name="image" size={20} />
                    </span>
                  )}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold">{v.product}</span>
                    <span className="text-admin-muted text-[14px]">
                      {v.label} · SKU {v.sku} · {formatPkr(v.price)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <input
                      type="number"
                      aria-label={`Quantity of ${v.product} ${v.label}`}
                      min={1}
                      max={v.available}
                      value={l.quantity}
                      onChange={(e) => {
                        const q = Math.max(1, Math.min(v.available, Number(e.target.value) || 1));
                        setLines((ls) =>
                          ls.map((x) => (x.variantId === l.variantId ? { ...x, quantity: q } : x)),
                        );
                      }}
                      className={cn(fieldStyles.input, "w-[72px] text-center")}
                    />
                    <span className="w-[76px] text-right font-semibold whitespace-nowrap">
                      {formatPkr(v.price * l.quantity)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${v.product} ${v.label}`}
                      onClick={() =>
                        setLines((ls) => ls.filter((x) => x.variantId !== l.variantId))
                      }
                      className="text-admin-muted hover:bg-admin-bg grid size-9 cursor-pointer place-items-center rounded-[8px] border-0 bg-transparent hover:text-[#b42318]"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </span>
                </div>
              );
            })
          )}
        </Card>

        <Card>
          <CardHeader title="Delivery and payment" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Delivery" htmlFor="delivery">
              <SelectBox
                id="delivery"
                value={delivery}
                onChange={(e) => {
                  setDelivery(e.target.value as DeliveryId);
                  setFeeOverride(null);
                }}
              >
                {DELIVERY.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </SelectBox>
            </Field>
            <Field
              label="Delivery fee (Rs)"
              htmlFor="fee"
              hint={
                feeOverride === null
                  ? delivery === "standard"
                    ? "Free over Rs 5,000, like the website"
                    : undefined
                  : "Changed by hand"
              }
            >
              <input
                id="fee"
                type="number"
                min={0}
                value={deliveryFee}
                onChange={(e) =>
                  setFeeOverride(Math.max(0, Math.round(Number(e.target.value) || 0)))
                }
                className={fieldStyles.input}
              />
            </Field>
            <Field label="Payment method" htmlFor="payment">
              <SelectBox
                id="payment"
                value={payment}
                onChange={(e) => setPayment(e.target.value as PaymentId)}
              >
                {PAYMENTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </SelectBox>
            </Field>
            <Field label="Payment status" htmlFor="paid">
              <SelectBox
                id="paid"
                value={paid ? "paid" : "unpaid"}
                onChange={(e) => setPaid(e.target.value === "paid")}
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid already</option>
              </SelectBox>
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Internal note" />
          <textarea
            aria-label="Internal note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            placeholder="e.g. Ordered on WhatsApp, deliver after 5 pm"
            className={fieldStyles.textarea}
          />
          <span className="text-admin-muted block pt-2 text-[14px]">
            Only your team can see notes.
          </span>
        </Card>
      </div>

      <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
        <Card>
          <CardHeader title="Customer" />
          <div className="flex flex-col gap-3">
            {customers.length > 0 ? (
              <Field
                label="Existing customer"
                htmlFor="existing"
                hint="Or fill in a new customer below"
              >
                <SelectBox
                  id="existing"
                  value={customerId}
                  onChange={(e) => chooseCustomer(e.target.value)}
                >
                  <option value="">New customer</option>
                  {customers.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name} · {x.phone}
                    </option>
                  ))}
                </SelectBox>
              </Field>
            ) : null}
            <Field label="Name" htmlFor="c-name" error={err("customer.name")}>
              <input
                id="c-name"
                autoComplete="off"
                value={c.name}
                onChange={(e) => setC({ ...c, name: e.target.value })}
                className={input("customer.name")}
              />
            </Field>
            <Field label="Mobile number" htmlFor="c-phone" error={err("customer.phone")}>
              <input
                id="c-phone"
                inputMode="tel"
                autoComplete="off"
                placeholder="0321 1234567"
                value={c.phone}
                onChange={(e) => setC({ ...c, phone: e.target.value })}
                className={input("customer.phone")}
              />
            </Field>
            <Field label="Email (optional)" htmlFor="c-email" error={err("customer.email")}>
              <input
                id="c-email"
                type="email"
                autoComplete="off"
                value={c.email}
                onChange={(e) => setC({ ...c, email: e.target.value })}
                className={input("customer.email")}
              />
            </Field>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={c.whatsapp}
                onChange={(e) => setC({ ...c, whatsapp: e.target.checked })}
                className="size-4 accent-forest-600"
              />
              Send order updates on WhatsApp
            </label>
          </div>
        </Card>

        <Card>
          <CardHeader title="Shipping address" />
          <div className="flex flex-col gap-3">
            <Field label="Street address" htmlFor="a-street" error={err("address.street")}>
              <input
                id="a-street"
                autoComplete="off"
                value={a.street}
                onChange={(e) => setA({ ...a, street: e.target.value })}
                className={input("address.street")}
              />
            </Field>
            <Field label="Landmark (optional)" htmlFor="a-landmark">
              <input
                id="a-landmark"
                autoComplete="off"
                value={a.landmark}
                onChange={(e) => setA({ ...a, landmark: e.target.value })}
                className={fieldStyles.input}
              />
            </Field>
            <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
              <Field label="City" htmlFor="a-city" error={err("address.city")}>
                <input
                  id="a-city"
                  autoComplete="off"
                  value={a.city}
                  onChange={(e) => setA({ ...a, city: e.target.value })}
                  className={input("address.city")}
                />
              </Field>
              <Field label="Postal code" htmlFor="a-postal">
                <input
                  id="a-postal"
                  inputMode="numeric"
                  autoComplete="off"
                  value={a.postalCode}
                  onChange={(e) => setA({ ...a, postalCode: e.target.value })}
                  className={fieldStyles.input}
                />
              </Field>
            </div>
            <Field label="Province" htmlFor="a-province" error={err("address.province")}>
              <SelectBox
                id="a-province"
                value={a.province}
                onChange={(e) => setA({ ...a, province: e.target.value })}
                className={err("address.province") ? "border-[#b42318]" : undefined}
              >
                <option value="">Choose a province</option>
                {PROVINCES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </SelectBox>
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Summary" />
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-admin-muted">
                Subtotal · {units} {units === 1 ? "item" : "items"}
              </span>
              <span>{formatPkr(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-admin-muted">Delivery</span>
              <span>{deliveryFee === 0 ? "Free" : formatPkr(deliveryFee)}</span>
            </div>
            <div className="border-admin-line-soft flex justify-between border-t pt-2 text-[15px] font-bold">
              <span>Total</span>
              <span>{formatPkr(total)}</span>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="submit"
              disabled={pending}
              className={cn(buttonStyles.primary, "justify-center disabled:opacity-60")}
            >
              <Icon name="check" size={16} />
              {pending ? "Creating…" : "Create order"}
            </button>
            <Link href="/orders" className={cn(buttonStyles.secondary, "justify-center")}>
              Cancel
            </Link>
          </div>
        </Card>
      </div>
    </form>
  );
}
