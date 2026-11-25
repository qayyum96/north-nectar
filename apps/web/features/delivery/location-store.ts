import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Where the visitor wants delivery, so the top bar and the cart show that city's free-delivery
 * amount (zones differ: e.g. Rs 10,000 in Islamabad, Rs 5,000 in Lahore).
 *
 * Sources, strongest first: a city chosen in the top bar or at checkout ("chosen"), then a guess
 * from the visitor's connection (/api/location, "auto"). Persisted in localStorage
 * ("nn-delivery") with `skipHydration`, so the server render and the first client render match;
 * <DeliveryLocationSync> rehydrates after mount.
 */
export interface DeliveryLocationState {
  city: string | null;
  province: string | null;
  source: "chosen" | "auto" | null;
  hasHydrated: boolean;
  /** A city the visitor picked (top bar or checkout). */
  choose: (city: string, province?: string | null) => void;
  /** A guess from the connection; never replaces a city the visitor chose. */
  guess: (city: string | null, province: string | null) => void;
}

export const useDeliveryLocation = create<DeliveryLocationState>()(
  persist(
    (set, get) => ({
      city: null,
      province: null,
      source: null,
      hasHydrated: false,
      choose: (city, province = null) => set({ city, province, source: "chosen" }),
      guess: (city, province) => {
        if (get().source === "chosen") return;
        if (!city && !province) return;
        set({ city, province, source: "auto" });
      },
    }),
    {
      name: "nn-delivery",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ city: s.city, province: s.province, source: s.source }),
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useDeliveryLocation.setState({ hasHydrated: true });
      },
    },
  ),
);
