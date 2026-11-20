"use client";

import {
  type CommerceSettings,
  DEFAULT_COMMERCE_SETTINGS,
} from "@northnectar/data/commerce-settings";
import { createContext, useContext, type ReactNode } from "react";

const SettingsContext = createContext<CommerceSettings>(DEFAULT_COMMERCE_SETTINGS);

/** Makes the admin's payment and shipping settings available to the cart and checkout. */
export function CommerceSettingsProvider({
  value,
  children,
}: {
  value: CommerceSettings;
  children: ReactNode;
}) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useCommerceSettings(): CommerceSettings {
  return useContext(SettingsContext);
}
