"use client";

import { formatPkr } from "@northnectar/ui";
import { CITIES } from "@/content/checkout";
import { useDeliveryLocation } from "./location-store";
import { useDeliveryZone } from "./use-delivery-zone";

const CITY_OPTIONS = CITIES.filter((c) => c !== "Other");

/**
 * Top bar delivery promo for the visitor's city, with an inline city picker:
 * "Free delivery to [Islamabad ▾] over Rs 10,000" (compact, for phones: "Free delivery over
 * Rs 10,000 · [Islamabad ▾]"). Until a city is known (and on the server render) it shows the
 * lowest amount: "Free delivery from Rs 5,000 · [Choose your city ▾]".
 */
export function DeliveryPromo({ compact = false }: { compact?: boolean }) {
  const { place, zone, freeOver } = useDeliveryZone();
  const choose = useDeliveryLocation((s) => s.choose);
  const options =
    place && !CITY_OPTIONS.some((c) => c.toLowerCase() === place.toLowerCase())
      ? [place, ...CITY_OPTIONS]
      : CITY_OPTIONS;

  const picker = (
    <span className="relative inline-flex items-center">
      <select
        aria-label="Delivery city"
        value={place ?? ""}
        onChange={(e) => {
          if (e.target.value) choose(e.target.value);
        }}
        className="[field-sizing:content] cursor-pointer appearance-none border-0 bg-transparent py-0 pr-[13px] pl-0 font-semibold text-inherit underline decoration-[#a9915e] decoration-dotted underline-offset-4 hover:decoration-solid focus-visible:outline-2"
      >
        {place ? null : (
          <option value="" disabled className="text-[#1b1a12]">
            Choose your city
          </option>
        )}
        {options.map((c) => (
          <option key={c} value={c} className="text-[#1b1a12]">
            {c}
          </option>
        ))}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute right-0 text-[10px]">
        ▾
      </span>
    </span>
  );

  if (zone && compact) {
    return (
      <span>
        {zone.freeOver !== null
          ? `Free delivery over ${formatPkr(zone.freeOver)}`
          : `Delivery from ${formatPkr(zone.rate)}`}{" "}
        · {picker}
      </span>
    );
  }
  if (zone) {
    return zone.freeOver !== null ? (
      <span>
        Free delivery to {picker} over {formatPkr(zone.freeOver)}
      </span>
    ) : (
      <span>
        Delivery to {picker} from {formatPkr(zone.rate)}
      </span>
    );
  }
  return (
    <span>
      {freeOver !== null ? `Free delivery from ${formatPkr(freeOver)} · ` : "Delivery to "}
      {picker}
    </span>
  );
}
