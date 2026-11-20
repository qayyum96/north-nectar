import "server-only";
import type {
  ExpressSettings,
  PaymentSettings,
  ShippingZoneRow,
} from "@northnectar/data/commerce-settings";
import { createClient } from "@/lib/supabase/server";

export interface StoreRow {
  store_name: string;
  email: string;
  phone: string;
  currency: string;
  time_zone: string;
  date_format: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  payments: PaymentSettings;
  express: ExpressSettings;
  updated_at: string;
}

export async function loadStore(): Promise<StoreRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("store_settings").select("*").maybeSingle();
  return (data as StoreRow | null) ?? null;
}

export async function loadZones(): Promise<ShippingZoneRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("shipping_zones").select("*").order("sort_order");
  return (data ?? []) as ShippingZoneRow[];
}

export interface TeamMember {
  user_id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "staff";
  status: "active" | "invited" | "disabled";
  last_active_at: string | null;
  invited_at: string | null;
  created_at: string;
}

export async function loadTeam(): Promise<TeamMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff")
    .select("*")
    .neq("status", "disabled")
    .order("created_at");
  return (data ?? []) as TeamMember[];
}
