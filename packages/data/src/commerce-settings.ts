import type { DeliveryMethod, PaymentMethod, PaymentMethodId } from "@northnectar/types";

/**
 * Store settings managed in the admin (Settings > Payments and Shipping) and read by the website
 * at checkout. Pure data and functions, so the cart (browser), the checkout (browser) and the order
 * Server Action all compute the same delivery fee and totals.
 */

export interface ShippingZone {
  id: string;
  name: string;
  cities: string[];
  provinces: string[];
  isFallback: boolean;
  rate: number;
  /** Free delivery from this order value (after discount); null = never free. */
  freeOver: number | null;
  daysMin: number;
  daysMax: number;
  courier: string;
}

export interface PaymentSettings {
  cod: { enabled: boolean };
  bank_transfer: { enabled: boolean; bankName: string; accountTitle: string; iban: string };
  jazzcash: { enabled: boolean; number: string };
  easypaisa: { enabled: boolean; number: string };
  card: { enabled: boolean };
}

export interface ExpressSettings {
  enabled: boolean;
  rate: number;
  daysMin: number;
  daysMax: number;
}

export interface CommerceSettings {
  payments: PaymentSettings;
  zones: ShippingZone[];
  express: ExpressSettings;
}

export const WALLETS = [
  { id: "jazzcash", label: "JazzCash" },
  { id: "easypaisa", label: "Easypaisa" },
] as const;
export type WalletId = (typeof WALLETS)[number]["id"];

/** Used when the database can't be reached, and as the starting point before Phase 5. */
export const DEFAULT_COMMERCE_SETTINGS: CommerceSettings = {
  payments: {
    cod: { enabled: true },
    bank_transfer: {
      enabled: true,
      bankName: "[Bank name]",
      accountTitle: "North Nectar",
      iban: "[Your IBAN]",
    },
    jazzcash: { enabled: true, number: "0316 4354407" },
    easypaisa: { enabled: true, number: "0316 4354407" },
    card: { enabled: false },
  },
  zones: [
    {
      id: "fallback",
      name: "All of Pakistan",
      cities: [],
      provinces: [],
      isFallback: true,
      rate: 250,
      freeOver: 10000,
      daysMin: 3,
      daysMax: 5,
      courier: "",
    },
  ],
  express: { enabled: true, rate: 450, daysMin: 1, daysMax: 2 },
};

/* ----------------------------------------------------------------------------------------------
 * Database rows -> settings
 * -------------------------------------------------------------------------------------------- */

export interface ShippingZoneRow {
  id: string;
  name: string;
  cities: string[];
  provinces: string[];
  is_fallback: boolean;
  rate: number;
  free_over: number | null;
  days_min: number;
  days_max: number;
  courier: string;
  sort_order: number;
}

export function toShippingZone(r: ShippingZoneRow): ShippingZone {
  return {
    id: r.id,
    name: r.name,
    cities: r.cities ?? [],
    provinces: r.provinces ?? [],
    isFallback: r.is_fallback,
    rate: r.rate,
    freeOver: r.free_over,
    daysMin: r.days_min,
    daysMax: r.days_max,
    courier: r.courier,
  };
}

export function toCommerceSettings(
  row: {
    payments?: Partial<PaymentSettings> | null;
    express?: Partial<ExpressSettings> | null;
  } | null,
  zones: ShippingZoneRow[] | null,
): CommerceSettings {
  const d = DEFAULT_COMMERCE_SETTINGS;
  const p = row?.payments ?? {};
  return {
    payments: {
      cod: { ...d.payments.cod, ...p.cod },
      bank_transfer: { ...d.payments.bank_transfer, ...p.bank_transfer },
      jazzcash: { ...d.payments.jazzcash, ...p.jazzcash },
      easypaisa: { ...d.payments.easypaisa, ...p.easypaisa },
      card: { ...d.payments.card, ...p.card },
    },
    zones: zones?.length
      ? [...zones].sort((a, b) => a.sort_order - b.sort_order).map(toShippingZone)
      : d.zones,
    express: { ...d.express, ...(row?.express ?? {}) },
  };
}

/* ----------------------------------------------------------------------------------------------
 * Delivery
 * -------------------------------------------------------------------------------------------- */

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The zone for an address: a city match first, then the province, then the fallback zone. */
export function zoneFor(
  settings: CommerceSettings,
  city?: string | null,
  province?: string | null,
): ShippingZone {
  const zones = settings.zones;
  const byCity = city ? zones.find((z) => z.cities.some((c) => same(c, city))) : undefined;
  if (byCity) return byCity;
  const byProvince = province
    ? zones.find((z) => z.provinces.some((p) => same(p, province)))
    : undefined;
  if (byProvince) return byProvince;
  return (
    zones.find((z) => z.isFallback) ??
    zones[zones.length - 1] ??
    DEFAULT_COMMERCE_SETTINGS.zones[0]!
  );
}

const days = (a: number, b: number) =>
  a === b ? `${a} working ${a === 1 ? "day" : "days"}` : `${a} to ${b} working days`;

export interface DeliveryOption extends DeliveryMethod {
  /** Fee for this order (0 when free). */
  fee: number;
}

/**
 * Delivery choices for an address and order value (after discount). Before the city is chosen
 * (cart), the cheapest zone is used as an estimate.
 */
export function deliveryOptions(
  settings: CommerceSettings,
  { city, province, amount }: { city?: string | null; province?: string | null; amount: number },
): DeliveryOption[] {
  const known = Boolean(city || province);
  const zone = known ? zoneFor(settings, city, province) : cheapestZone(settings);
  const standardFee =
    amount <= 0 ? 0 : zone.freeOver !== null && amount >= zone.freeOver ? 0 : zone.rate;
  const options: DeliveryOption[] = [
    {
      id: "standard",
      label: "Standard delivery",
      description: known
        ? `${days(zone.daysMin, zone.daysMax)}${zone.isFallback ? "" : `, ${zone.name}`}`
        : `${days(Math.min(...settings.zones.map((z) => z.daysMin), zone.daysMin), Math.max(...settings.zones.map((z) => z.daysMax), zone.daysMax))}, price depends on your city`,
      price: zone.rate,
      freeOverThreshold: zone.freeOver !== null,
      transitDays: [zone.daysMin, zone.daysMax],
      shortLabel: "Standard",
      fee: standardFee,
    },
  ];
  if (settings.express.enabled) {
    options.push({
      id: "express",
      label: "Express delivery",
      description: `${days(settings.express.daysMin, settings.express.daysMax)}, major cities`,
      price: settings.express.rate,
      freeOverThreshold: false,
      transitDays: [settings.express.daysMin, settings.express.daysMax],
      shortLabel: "Express",
      fee: amount <= 0 ? 0 : settings.express.rate,
    });
  }
  return options;
}

function cheapestZone(settings: CommerceSettings): ShippingZone {
  return (
    [...settings.zones].sort((a, b) => a.rate - b.rate)[0] ?? DEFAULT_COMMERCE_SETTINGS.zones[0]!
  );
}

/** Lowest free-delivery threshold, for the cart's "free delivery" progress bar (null = none). */
export function freeDeliveryThreshold(settings: CommerceSettings): number | null {
  const values = settings.zones.map((z) => z.freeOver).filter((v): v is number => v !== null);
  return values.length ? Math.min(...values) : null;
}

/* ----------------------------------------------------------------------------------------------
 * Payments
 * -------------------------------------------------------------------------------------------- */

/** Checkout payment methods in display order. Disabled methods are left out. */
export function paymentMethodsFor(settings: CommerceSettings): PaymentMethod[] {
  const p = settings.payments;
  const wallets = WALLETS.filter((w) => p[w.id].enabled);
  const list: PaymentMethod[] = [];
  if (p.cod.enabled)
    list.push({
      id: "cod",
      label: "Cash on delivery",
      description: "Pay in cash when your order arrives",
      status: "enabled",
      fee: 0,
      badges: ["Cash on delivery"],
    });
  if (p.bank_transfer.enabled)
    list.push({
      id: "bank_transfer",
      label: "Bank transfer",
      description: "Transfer after placing your order",
      status: "enabled",
      fee: 0,
      badges: ["Bank transfer"],
    });
  if (wallets.length)
    list.push({
      id: "mobile_wallet",
      label: wallets.map((w) => w.label).join(" or "),
      description: "Pay from your mobile wallet",
      status: "enabled",
      fee: 0,
      badges: wallets.map((w) => w.label),
    });
  return list;
}

export function enabledWallets(settings: CommerceSettings) {
  return WALLETS.filter((w) => settings.payments[w.id].enabled);
}

export function isPaymentEnabled(settings: CommerceSettings, id: PaymentMethodId): boolean {
  return paymentMethodsFor(settings).some((m) => m.id === id);
}

/** Rates and times across all zones, for website copy (product page, shipping policy, about). */
export function deliveryFacts(settings: CommerceSettings) {
  const zones = settings.zones.length ? settings.zones : DEFAULT_COMMERCE_SETTINGS.zones;
  const rates = zones.map((z) => z.rate);
  const minDays = Math.min(...zones.map((z) => z.daysMin));
  const maxDays = Math.max(...zones.map((z) => z.daysMax));
  return {
    minRate: Math.min(...rates),
    maxRate: Math.max(...rates),
    minDays,
    maxDays,
    days: days(minDays, maxDays),
    freeOver: freeDeliveryThreshold(settings),
    zones: [...zones].sort((a, b) => Number(a.isFallback) - Number(b.isFallback)),
    express: settings.express,
    cod: isPaymentEnabled(settings, "cod"),
  };
}
