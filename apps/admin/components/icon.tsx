/** Admin icon set, taken verbatim from the admin mockup (24×24 stroke icons). */
export const ICONS = {
  home: "M3 11l9-7 9 7M5 10v10h14V10",
  orders: "M4 4h16v16H4zM4 9h16M9 4v5",
  customers:
    "M16 19v-1a4 4 0 0 0-8 0v1M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 19v-1a3 3 0 0 0-2-2.8M17 5.2a3 3 0 0 1 0 5.6",
  products: "M3 12V4h8l10 10-8 8zM7.5 8.5h.01",
  categories: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  stock: "M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10",
  purchases: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  suppliers:
    "M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  movements: "M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3",
  messages: "M4 5h16v11H8l-4 4z",
  reports: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  store: "M4 9l1-5h14l1 5M4 9v11h16V9M4 9h16M9 20v-6h6v6",
  payments: "M3 6h18v12H3zM3 10h18M7 15h3",
  shipping: "M3 7h11v9H3zM14 10h4l3 3v3h-7z",
  team: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 19a6 6 0 0 1 12 0M17 11a3 3 0 1 0 0-6M21 19a6 6 0 0 0-4-5.6",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0",
  plus: "M12 5v14M5 12h14",
  down: "M6 9l6 6 6-6",
  x: "M6 6l12 12M18 6L6 18",
  check: "M5 12l4 4 10-10",
  download: "M12 4v12M7 11l5 5 5-5M4 20h16",
  menu: "M4 7h16M4 12h16M4 17h16",
  logout: "M15 4h4v16h-4M10 16l-4-4 4-4M6 12h10",
  whatsapp: "M4 20l1.3-4A8 8 0 1 1 8 18.7z",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  calendar: "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4",
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.8,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={ICONS[name]} />
    </svg>
  );
}
