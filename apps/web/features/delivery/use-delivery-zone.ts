"use client";

import {
  type ShippingZone,
  freeDeliveryThreshold,
  zoneFor,
} from "@northnectar/data/commerce-settings";
import { useCommerceSettings } from "@/features/cart/commerce-settings";
import { useDeliveryLocation } from "./location-store";

export interface DeliveryZoneInfo {
  /** The visitor's city (or province) once known in this browser. */
  place: string | null;
  /** Their delivery zone, or null while unknown. */
  zone: ShippingZone | null;
  /** Free delivery from this order value: the zone's, or the lowest of all zones while unknown. */
  freeOver: number | null;
  /** True once the browser's saved location has been read (false on the server render). */
  ready: boolean;
}

/** The free-delivery amount that applies to this visitor (see location-store.ts). */
export function useDeliveryZone(): DeliveryZoneInfo {
  const settings = useCommerceSettings();
  const { city, province, hasHydrated } = useDeliveryLocation();
  const known = hasHydrated && Boolean(city || province);
  const zone = known ? zoneFor(settings, city, province) : null;
  return {
    place: known ? (city ?? province) : null,
    zone,
    freeOver: zone ? zone.freeOver : freeDeliveryThreshold(settings),
    ready: hasHydrated,
  };
}
