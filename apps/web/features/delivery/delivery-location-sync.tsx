"use client";

import { useEffect } from "react";
import { useDeliveryLocation } from "./location-store";

/**
 * Loads the saved delivery city after mount and, for a first visit with no city yet, asks
 * /api/location once for a guess from the connection. Renders nothing.
 */
export function DeliveryLocationSync() {
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve(useDeliveryLocation.persist.rehydrate()).then(async () => {
      const { city, province } = useDeliveryLocation.getState();
      if (cancelled || city || province) return;
      try {
        const res = await fetch("/api/location", { cache: "no-store" });
        if (!res.ok) return;
        const guess = (await res.json()) as { city: string | null; province: string | null };
        if (!cancelled) useDeliveryLocation.getState().guess(guess.city, guess.province);
      } catch {
        // No guess: the top bar invites the visitor to choose a city.
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
