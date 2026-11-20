"use client";

import {
  type CommerceSettings,
  DEFAULT_COMMERCE_SETTINGS,
} from "@northnectar/data/commerce-settings";
import { createContext, useContext, useState, type ReactNode } from "react";

const SettingsContext = createContext<CommerceSettings>(DEFAULT_COMMERCE_SETTINGS);
const ReplaceContext = createContext<(next: CommerceSettings) => void>(() => {});

/**
 * Makes the admin's payment and shipping settings available to the cart and checkout. The page
 * may have been cached before the owner changed a rate, so checkout can swap in the fresh
 * settings the server sends back with a "total changed" answer.
 */
export function CommerceSettingsProvider({
  value,
  children,
}: {
  value: CommerceSettings;
  children: ReactNode;
}) {
  const [fresh, setFresh] = useState<CommerceSettings | null>(null);
  return (
    <ReplaceContext.Provider value={setFresh}>
      <SettingsContext.Provider value={fresh ?? value}>{children}</SettingsContext.Provider>
    </ReplaceContext.Provider>
  );
}

export function useCommerceSettings(): CommerceSettings {
  return useContext(SettingsContext);
}

/** Replaces the settings for this visit (used when the server reports newer ones). */
export function useReplaceCommerceSettings(): (next: CommerceSettings) => void {
  return useContext(ReplaceContext);
}
