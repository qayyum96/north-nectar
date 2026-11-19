import type { CartLine } from "@northnectar/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { commerceConfig } from "@/lib/constants/commerce";

/**
 * Cart state. Only `lines` is persisted (localStorage key "nn-cart"); drawer state is per tab.
 * Persistence uses `skipHydration` so the server render and the first client render match.
 * <CartProvider> rehydrates after mount.
 *
 * Prices in the cart are snapshots for display. Checkout (Phase 5) re-prices every line from
 * the data layer before an order is created.
 */
export interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  hasHydrated: boolean;
  addItem: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const clampQty = (q: number) =>
  Math.max(1, Math.min(commerceConfig.maxQuantityPerLine, Math.floor(q)));

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      hasHydrated: false,
      addItem: (line, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.variantId === line.variantId);
          const lines = existing
            ? state.lines.map((l) =>
                l.variantId === line.variantId
                  ? { ...l, ...line, quantity: clampQty(l.quantity + quantity) }
                  : l,
              )
            : [...state.lines, { ...line, quantity: clampQty(quantity) }];
          return { lines };
        }),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.variantId === variantId ? { ...l, quantity: clampQty(quantity) } : l,
          ),
        })),
      removeItem: (variantId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.variantId !== variantId) })),
      clear: () => set({ lines: [] }),
      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),
    }),
    {
      name: "nn-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines }),
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useCartStore.setState({ hasHydrated: true });
      },
    },
  ),
);

/* Selectors */
export const selectCount = (s: CartState) => s.lines.reduce((sum, l) => sum + l.quantity, 0);
export const selectSubtotal = (s: CartState) =>
  s.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
