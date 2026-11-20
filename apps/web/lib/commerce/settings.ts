import "server-only";
import { cache } from "react";
import {
  type CommerceSettings,
  DEFAULT_COMMERCE_SETTINGS,
  type ShippingZoneRow,
  toCommerceSettings,
} from "@northnectar/data/commerce-settings";
import { supabaseService } from "@/lib/supabase/server";

/**
 * Payment methods and shipping rates set in the admin (Settings > Payments and Shipping).
 * Pages read them with the hourly refresh (the admin triggers an immediate refresh on save); the
 * order Server Action always reads them fresh. Falls back to the defaults if the database is
 * unreachable, so checkout keeps working.
 */
export const getCommerceSettings = cache(async (): Promise<CommerceSettings> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return DEFAULT_COMMERCE_SETTINGS;
  }
  try {
    const db = supabaseService();
    const [settings, zones] = await Promise.all([
      db.from("store_settings").select("payments, express").maybeSingle(),
      db.from("shipping_zones").select("*").order("sort_order"),
    ]);
    if (settings.error || zones.error)
      throw new Error(settings.error?.message ?? zones.error?.message);
    return toCommerceSettings(settings.data, zones.data as ShippingZoneRow[]);
  } catch (error) {
    console.error(
      "[settings] falling back to defaults:",
      error instanceof Error ? error.message : error,
    );
    return DEFAULT_COMMERCE_SETTINGS;
  }
});
