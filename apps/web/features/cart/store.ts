import type { CartLine } from "@northnectar/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { commerceConfig } from "@/lib/constants/commerce";
import type { VariantCatalog } from "@/lib/commerce/variant-catalog";

/**
 * Cart state. Only `lines` and `discountCode` are persisted (localStorage key "nn-cart"); drawer state is per tab.
 * Persistence uses `skipHydration` so the server render and the first client render match.
 * <CartProvider> rehydrates after mount.
 *
 * Prices in the cart are snapshots. <CartProvider> re-syncs them with the live catalogue on every
 * page load (`syncWithCatalog`), and the order Server Action re-prices from the data layer again.
 */
export interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  hasHydrated: boolean;
  /** Applied discount code (validated against the config when totals are computed). */
  discountCode: string | null;
  /** Shown once after a sync removed or re-priced items. Not persisted. */
  notice: string | null;
  addItem: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  setDiscountCode: (code: string | null) => void;
  syncWithCatalog: (catalog: VariantCatalog) => void;
  dismissNotice: () => void;
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
      discountCode: null,
      notice: null,
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
      clear: () => set({ lines: [], discountCode: null }),
      setDiscountCode: (discountCode) => set({ discountCode }),
      dismissNotice: () => set({ notice: null }),
      syncWithCatalog: (catalog) =>
        set((state) => {
          let removed = 0;
          let repriced = 0;
          const lines = state.lines.flatMap((line) => {
            const current = catalog[line.variantId];
            if (!current || current.stock <= 0) {
              removed += 1;
              return [];
            }
            if (current.price !== line.unitPrice) repriced += 1;
            const quantity = Math.min(
              line.quantity,
              current.stock,
              commerceConfig.maxQuantityPerLine,
            );
            return [
              {
                ...line,
                productId: current.productId,
                slug: current.slug,
                name: current.name,
                variantLabel: current.label,
                unitPrice: current.price,
                image: current.image,
                quantity,
              },
            ];
          });
          const notice =
            removed > 0
              ? "Some items in your cart are no longer available and were removed."
              : repriced > 0
                ? "Some prices have changed since you added these items. Your cart shows the current prices."
                : state.notice;
          return { lines, notice };
        }),
      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),
    }),
    {
      name: "nn-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines, discountCode: state.discountCode }),
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
