import type { PaymentMethodId } from "@northnectar/types";
// zod/mini: same validation as "zod" with a much smaller browser bundle (this schema runs in the
// checkout form too).
import { z } from "zod/mini";
import { CITIES, PROVINCES } from "@/content/checkout";
import { normalisePakistanMobile } from "@/lib/commerce/phone";

const PAYMENT_IDS = [
  "cod",
  "bank_transfer",
  "mobile_wallet",
  "card",
] as const satisfies readonly PaymentMethodId[];
const MOBILE_MSG = "Enter an 11-digit mobile number, like 0321 1234567";

const trimmed = (max: number, maxMsg: string) =>
  z.string().check(z.trim(), z.maxLength(max, maxMsg));

/** Checkout details. Shared by the browser (React Hook Form) and the order Server Action. */
export const checkoutSchema = z
  .object({
    email: z.pipe(
      z.string().check(z.trim(), z.minLength(1, "Please enter your email")),
      z.email("Enter a valid email, like name@example.com"),
    ),
    phone: z.string().check(
      z.trim(),
      z.refine((v) => normalisePakistanMobile(v) !== null, MOBILE_MSG),
    ),
    whatsappUpdates: z.boolean(),
    fullName: z
      .string()
      .check(
        z.trim(),
        z.minLength(1, "Please enter your full name"),
        z.maxLength(100, "Please shorten your name"),
      ),
    street: z
      .string()
      .check(
        z.trim(),
        z.minLength(5, "Please enter your street address"),
        z.maxLength(200, "Please shorten your address"),
      ),
    landmark: trimmed(200, "Please shorten this"),
    city: z
      .union([z.enum(CITIES), z.literal("")])
      .check(z.refine((v) => v !== "", "Please choose your city")),
    cityOther: trimmed(80, "Please shorten the city name"),
    province: z
      .union([z.enum(PROVINCES), z.literal("")])
      .check(z.refine((v) => v !== "", "Please choose your province")),
    postalCode: z.string().check(
      z.trim(),
      z.refine((v) => v === "" || /^\d{5}$/.test(v), "Enter a 5-digit postal code, like 44000"),
    ),
    deliveryMethodId: z.enum(["standard", "express"]),
    paymentMethodId: z.enum(PAYMENT_IDS),
    walletProvider: z.enum(["jazzcash", "easypaisa"]),
    walletNumber: z.string().check(z.trim()),
  })
  .check(
    z.superRefine((v, ctx) => {
      if (v.city === "Other" && v.cityOther === "") {
        ctx.addIssue({ code: "custom", path: ["cityOther"], message: "Please enter your city" });
      }
      if (
        v.paymentMethodId === "mobile_wallet" &&
        normalisePakistanMobile(v.walletNumber) === null
      ) {
        ctx.addIssue({ code: "custom", path: ["walletNumber"], message: MOBILE_MSG });
      }
    }),
  );

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutValues = z.output<typeof checkoutSchema>;
export type CheckoutField = keyof CheckoutInput;

export const checkoutDefaults: CheckoutInput = {
  email: "",
  phone: "",
  whatsappUpdates: true,
  fullName: "",
  street: "",
  landmark: "",
  city: "",
  cityOther: "",
  province: "",
  postalCode: "",
  deliveryMethodId: "standard",
  paymentMethodId: "cod",
  walletProvider: "jazzcash",
  walletNumber: "",
};

/** Cart lines sent with the order: only ids and quantities. Prices come from the data layer. */
export const orderLinesSchema = z
  .array(
    z.object({
      variantId: z.string().check(z.minLength(1), z.maxLength(100)),
      quantity: z.number().check(z.int(), z.minimum(1), z.maximum(100)),
    }),
  )
  .check(z.minLength(1), z.maxLength(50));

export type OrderLineInput = z.infer<typeof orderLinesSchema>[number];
