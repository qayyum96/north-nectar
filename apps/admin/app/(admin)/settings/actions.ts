"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { revalidateStorefront } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type Result =
  { ok: true; message: string } | { ok: false; error: string; fields?: Record<string, string> };

const fieldErrors = (issues: readonly { path: readonly PropertyKey[]; message: string }[]) => {
  const fields: Record<string, string> = {};
  for (const i of issues) fields[i.path.map(String).join(".")] ??= i.message;
  return fields;
};

/* ----------------------------------------------------------------------------------------------
 * Store details
 * -------------------------------------------------------------------------------------------- */

const storeSchema = z.object({
  store_name: z.string().trim().min(2, "Add your store name").max(80),
  email: z.string().trim().email("Enter a valid email").max(120),
  phone: z.string().trim().min(7, "Add a phone number").max(30),
  currency: z.literal("PKR"),
  time_zone: z.string().max(60),
  date_format: z.string().max(30),
  address: z.string().trim().max(200),
  city: z.string().trim().max(60),
  province: z.string().trim().max(60),
  postal_code: z.string().trim().max(10),
});
export type StoreInput = z.input<typeof storeSchema>;

export async function saveStore(input: StoreInput): Promise<Result> {
  await requireStaff(["owner"]);
  const parsed = storeSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fields: fieldErrors(parsed.error.issues),
    };
  const supabase = await createClient();
  const { error } = await supabase.from("store_settings").update(parsed.data).eq("id", true);
  if (error) return { ok: false, error: "The settings couldn't be saved. Please try again." };
  revalidatePath("/settings/store");
  return { ok: true, message: "Store details saved" };
}

/* ----------------------------------------------------------------------------------------------
 * Payments
 * -------------------------------------------------------------------------------------------- */

const paymentsSchema = z
  .object({
    cod: z.object({ enabled: z.boolean() }),
    bank_transfer: z.object({
      enabled: z.boolean(),
      bankName: z.string().trim().max(80),
      accountTitle: z.string().trim().max(80),
      iban: z.string().trim().max(40),
    }),
    jazzcash: z.object({ enabled: z.boolean(), number: z.string().trim().max(20) }),
    easypaisa: z.object({ enabled: z.boolean(), number: z.string().trim().max(20) }),
    card: z.object({ enabled: z.literal(false) }),
  })
  .superRefine((p, ctx) => {
    if (!p.cod.enabled && !p.bank_transfer.enabled && !p.jazzcash.enabled && !p.easypaisa.enabled)
      ctx.addIssue({
        code: "custom",
        path: ["cod"],
        message: "Keep at least one way to pay switched on.",
      });
    if (
      p.bank_transfer.enabled &&
      (!p.bank_transfer.bankName ||
        !p.bank_transfer.iban ||
        /^\[/.test(p.bank_transfer.iban) ||
        /^\[/.test(p.bank_transfer.bankName))
    )
      ctx.addIssue({
        code: "custom",
        path: ["bank_transfer", "iban"],
        message: "Add your bank name and IBAN, or switch bank transfer off.",
      });
    for (const w of ["jazzcash", "easypaisa"] as const)
      if (p[w].enabled && p[w].number.replace(/\D/g, "").length < 10)
        ctx.addIssue({
          code: "custom",
          path: [w, "number"],
          message: `Add the ${w === "jazzcash" ? "JazzCash" : "Easypaisa"} number customers pay to, or switch it off.`,
        });
  });
export type PaymentsInput = z.input<typeof paymentsSchema>;

export async function savePayments(input: PaymentsInput): Promise<Result> {
  await requireStaff(["owner"]);
  const parsed = paymentsSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check the details.",
      fields: fieldErrors(parsed.error.issues),
    };
  const supabase = await createClient();
  const { error } = await supabase
    .from("store_settings")
    .update({ payments: parsed.data })
    .eq("id", true);
  if (error) return { ok: false, error: "The settings couldn't be saved. Please try again." };
  revalidatePath("/settings/payments");
  const refreshed = await revalidateStorefront();
  return {
    ok: true,
    message: refreshed ? "Payment methods saved · checkout updated" : "Payment methods saved",
  };
}

/* ----------------------------------------------------------------------------------------------
 * Shipping
 * -------------------------------------------------------------------------------------------- */

const zoneSchema = z.object({
  id: z.string().max(60),
  name: z.string().trim().min(2, "Name the zone").max(60),
  cities: z.array(z.string().trim().min(1).max(60)).max(60),
  provinces: z.array(z.string().trim().min(1).max(60)).max(10),
  isFallback: z.boolean(),
  rate: z.number().int().min(0).max(100_000),
  freeOver: z.number().int().min(0).max(10_000_000).nullable(),
  daysMin: z.number().int().min(0).max(60),
  daysMax: z.number().int().min(0).max(60),
  courier: z.string().trim().max(60),
});
const shippingSchema = z
  .object({
    zones: z.array(zoneSchema).min(1, "Add at least one shipping rate").max(40),
    express: z.object({
      enabled: z.boolean(),
      rate: z.number().int().min(0).max(100_000),
      daysMin: z.number().int().min(0).max(30),
      daysMax: z.number().int().min(0).max(30),
    }),
  })
  .superRefine((s, ctx) => {
    if (s.zones.filter((z) => z.isFallback).length !== 1)
      ctx.addIssue({
        code: "custom",
        path: ["zones"],
        message: "Exactly one rate must cover the rest of Pakistan.",
      });
    s.zones.forEach((z, i) => {
      if (z.daysMax < z.daysMin)
        ctx.addIssue({
          code: "custom",
          path: ["zones", i, "daysMax"],
          message: `${z.name}: the slowest delivery time can't be faster than the quickest.`,
        });
      if (!z.isFallback && z.cities.length === 0 && z.provinces.length === 0)
        ctx.addIssue({
          code: "custom",
          path: ["zones", i, "cities"],
          message: `${z.name}: choose at least one city or province.`,
        });
    });
  });
export type ShippingInput = z.input<typeof shippingSchema>;

export async function saveShipping(
  input: ShippingInput,
): Promise<{ ok: true; message: string; ids: string[] } | { ok: false; error: string }> {
  await requireStaff(["owner"]);
  const parsed = shippingSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the rates." };
  const { zones, express } = parsed.data;
  const supabase = await createClient();
  // One database transaction: the zones, the "everywhere else" zone and express save together.
  const { data: ids, error } = await supabase.rpc("admin_save_shipping", {
    p_zones: zones.map((z) => ({
      id: z.id,
      name: z.name,
      cities: z.cities,
      provinces: z.provinces,
      is_fallback: z.isFallback,
      rate: z.rate,
      free_over: z.freeOver,
      days_min: z.daysMin,
      days_max: z.daysMax,
      courier: z.courier,
    })),
    p_express: express,
  });
  if (error) return { ok: false, error: "The rates couldn't be saved. Please try again." };
  revalidatePath("/settings/shipping");
  const refreshed = await revalidateStorefront();
  return {
    ok: true,
    message: refreshed ? "Shipping rates saved · checkout updated" : "Shipping rates saved",
    ids: (ids ?? []) as string[],
  };
}

/* ----------------------------------------------------------------------------------------------
 * Team
 * -------------------------------------------------------------------------------------------- */

const roles = z.enum(["owner", "manager", "staff"]);
const ALREADY_ON_TEAM = "They're already on the team. Change their role in the list instead.";

async function adminUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_ADMIN_URL)
    return process.env.NEXT_PUBLIC_ADMIN_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3001";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Creates the member's account and returns a one-time link for them to set a password. The owner
 * sends it on WhatsApp or by email, so no paid email service is needed.
 */
export async function inviteMember(input: {
  name: string;
  email: string;
  role: string;
}): Promise<{ ok: true; message: string; link: string } | { ok: false; error: string }> {
  const me = await requireStaff(["owner"]);
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Add their name").max(80),
      email: z.string().trim().toLowerCase().email("Enter a valid email"),
      role: roles,
    })
    .safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the details." };
  const v = parsed.data;
  const svc = createServiceClient();
  // An invite link signs in as that account, so never make one for someone already on the team.
  const { data: onTeam } = await svc
    .from("staff")
    .select("status")
    .ilike("email", v.email)
    .maybeSingle<{ status: string }>();
  if (onTeam?.status === "active") return { ok: false, error: ALREADY_ON_TEAM };
  const redirectTo = `${await adminUrl()}/auth/callback?next=/reset-password`;

  let { data, error } = await svc.auth.admin.generateLink({
    type: "invite",
    email: v.email,
    options: { redirectTo, data: { name: v.name } },
  });
  let type = "invite";
  if (error && /already|registered|exists/i.test(error.message)) {
    ({ data, error } = await svc.auth.admin.generateLink({
      type: "recovery",
      email: v.email,
      options: { redirectTo },
    }));
    type = "recovery";
  }
  if (error || !data?.user || !data.properties?.hashed_token) {
    return { ok: false, error: "The invite couldn't be created. Please try again." };
  }
  if (data.user.id === me.userId) return { ok: false, error: "That's your own account." };
  const { data: current } = await svc
    .from("staff")
    .select("status")
    .eq("user_id", data.user.id)
    .maybeSingle<{ status: string }>();
  if (current?.status === "active") return { ok: false, error: ALREADY_ON_TEAM };
  const { error: staffErr } = await svc.from("staff").upsert({
    user_id: data.user.id,
    name: v.name,
    email: v.email,
    role: v.role,
    status: "invited",
    invited_at: new Date().toISOString(),
  });
  if (staffErr) return { ok: false, error: "The invite couldn't be saved. Please try again." };
  revalidatePath("/settings/team");
  const link = `${await adminUrl()}/auth/callback?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=${type}&next=/reset-password`;
  return { ok: true, message: `${v.name} invited`, link };
}

/** A fresh sign-in link for an invited member whose link expired or got lost. */
export async function newInviteLink(
  userId: string,
): Promise<{ ok: true; link: string } | { ok: false; error: string }> {
  await requireStaff(["owner"]);
  const svc = createServiceClient();
  const { data: member } = await svc
    .from("staff")
    .select("email, status")
    .eq("user_id", userId)
    .maybeSingle<{ email: string; status: string }>();
  if (!member) return { ok: false, error: "That member no longer exists." };
  // Only for people who haven't signed in yet: a link for an active account would let whoever
  // holds it sign in as them.
  if (member.status !== "invited")
    return {
      ok: false,
      error: "They've already joined. They can use Forgot password on the sign-in page.",
    };
  const redirectTo = `${await adminUrl()}/auth/callback?next=/reset-password`;
  const { data, error } = await svc.auth.admin.generateLink({
    type: "recovery",
    email: member.email,
    options: { redirectTo },
  });
  if (error || !data.properties?.hashed_token)
    return { ok: false, error: "A new link couldn't be created." };
  await svc.from("staff").update({ invited_at: new Date().toISOString() }).eq("user_id", userId);
  revalidatePath("/settings/team");
  return {
    ok: true,
    link: `${await adminUrl()}/auth/callback?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery&next=/reset-password`,
  };
}

export async function saveRoles(changes: { userId: string; role: string }[]): Promise<Result> {
  const me = await requireStaff(["owner"]);
  const parsed = z
    .array(z.object({ userId: z.string().uuid(), role: roles }))
    .max(100)
    .safeParse(changes);
  if (!parsed.success) return { ok: false, error: "Please check the roles." };
  if (parsed.data.some((c) => c.userId === me.userId && c.role !== "owner"))
    return { ok: false, error: "You can't change your own role. Ask another owner." };
  const supabase = await createClient();
  for (const c of parsed.data) {
    const { error } = await supabase.from("staff").update({ role: c.role }).eq("user_id", c.userId);
    if (error) return { ok: false, error: "The roles couldn't be saved." };
  }
  revalidatePath("/settings/team");
  return { ok: true, message: "Roles saved" };
}

export async function removeMember(userId: string): Promise<Result> {
  const me = await requireStaff(["owner"]);
  if (userId === me.userId) return { ok: false, error: "You can't remove yourself." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("staff")
    .update({ status: "disabled" })
    .eq("user_id", userId);
  if (error) return { ok: false, error: "The member couldn't be removed." };
  // Their next page load fails the staff check (requireStaff) and signs them out.
  revalidatePath("/settings/team");
  return { ok: true, message: "Member removed · they can no longer sign in" };
}
