import { z } from "zod";

/**
 * What the confirmation page needs about the order just placed. Until orders are stored in
 * Supabase this travels in a short-lived, HttpOnly cookie (see order-cookie.ts); afterwards the page
 * can load the order by id instead.
 */
export const placedOrderSchema = z.object({
  number: z.string().max(20),
  createdAt: z.string().max(40),
  email: z.string().max(200),
  phone: z.string().max(20),
  whatsappUpdates: z.boolean(),
  fullName: z.string().max(100),
  addressLines: z.array(z.string().max(200)).max(4),
  deliveryMethodId: z.enum(["standard", "express"]),
  deliveryLabel: z.string().max(60),
  eta: z.string().max(60),
  paymentMethodId: z.enum(["cod", "bank_transfer", "mobile_wallet", "card"]),
  paymentLabel: z.string().max(60),
  walletLabel: z.string().max(30).optional(),
  lines: z
    .array(
      z.object({
        name: z.string().max(120),
        label: z.string().max(40),
        quantity: z.number().int(),
        lineTotal: z.number(),
        image: z.string().max(200),
      }),
    )
    .max(50),
  totals: z.object({
    subtotal: z.number(),
    discount: z.number(),
    delivery: z.number(),
    paymentFee: z.number(),
    total: z.number(),
  }),
});

export type PlacedOrder = z.infer<typeof placedOrderSchema>;
