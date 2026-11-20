import type { ReactNode, SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Accessible name. Leave it out for decorative icons (they are hidden from screen readers). */
  title?: string;
  size?: number | string;
}

function createIcon(displayName: string, paths: ReactNode, filled = false) {
  function Icon({ title, size = 20, ...props }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? "none" : "currentColor"}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
        aria-hidden={title ? undefined : true}
        role={title ? "img" : undefined}
        {...props}
      >
        {title ? <title>{title}</title> : null}
        {paths}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}

export const SearchIcon = createIcon(
  "SearchIcon",
  <>
    <circle cx="11" cy="11" r="7.5" />
    <path d="m20.5 20.5-4.2-4.2" />
  </>,
);

export const BagIcon = createIcon(
  "BagIcon",
  <>
    <path d="M4.5 8h15l-1.1 11.6a2 2 0 0 1-2 1.9H7.6a2 2 0 0 1-2-1.9Z" />
    <path d="M8.5 10V6.5a3.5 3.5 0 0 1 7 0V10" />
  </>,
);

export const MenuIcon = createIcon("MenuIcon", <path d="M4 6.5h16M4 12h16M4 17.5h16" />);

export const CloseIcon = createIcon("CloseIcon", <path d="M18 6 6 18M6 6l12 12" />);

export const ChevronDownIcon = createIcon("ChevronDownIcon", <path d="m6 9 6 6 6-6" />);
export const ChevronRightIcon = createIcon("ChevronRightIcon", <path d="m9 18 6-6-6-6" />);
export const ChevronLeftIcon = createIcon("ChevronLeftIcon", <path d="m15 18-6-6 6-6" />);

export const ArrowRightIcon = createIcon("ArrowRightIcon", <path d="M5 12h14m-6-6 6 6-6 6" />);
export const ArrowLeftIcon = createIcon("ArrowLeftIcon", <path d="M19 12H5m6 6-6-6 6-6" />);

export const PlusIcon = createIcon("PlusIcon", <path d="M5 12h14M12 5v14" />);
export const MinusIcon = createIcon("MinusIcon", <path d="M5 12h14" />);

export const TrashIcon = createIcon(
  "TrashIcon",
  <>
    <path d="M3.5 6h17" />
    <path d="M8.5 6V4.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5V6" />
    <path d="m18.5 6-.9 13.1a2 2 0 0 1-2 1.9H8.4a2 2 0 0 1-2-1.9L5.5 6" />
    <path d="M10 10.5v6M14 10.5v6" />
  </>,
);

export const HeartIcon = createIcon(
  "HeartIcon",
  <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />,
);

export const StarIcon = createIcon(
  "StarIcon",
  <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9Z" />,
  true,
);

export const CheckIcon = createIcon("CheckIcon", <path d="M20 6 9 17l-5-5" />);

export const CheckCircleIcon = createIcon(
  "CheckCircleIcon",
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="m8 12.2 2.7 2.7L16.2 9.4" />
  </>,
);

export const AlertCircleIcon = createIcon(
  "AlertCircleIcon",
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 7.5v5M12 16.2h.01" />
  </>,
);

export const PhoneIcon = createIcon(
  "PhoneIcon",
  <path d="M21.5 16.6v3a2 2 0 0 1-2.2 2 19.6 19.6 0 0 1-8.6-3.1 19.3 19.3 0 0 1-6-6A19.6 19.6 0 0 1 1.6 3.9 2 2 0 0 1 3.6 1.7h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.6 9.6a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />,
);

export const MailIcon = createIcon(
  "MailIcon",
  <>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
    <path d="m21.5 7-8.5 5.6a1.9 1.9 0 0 1-2 0L2.5 7" />
  </>,
);

export const MapPinIcon = createIcon(
  "MapPinIcon",
  <>
    <path d="M19.5 10c0 5.6-7.5 11.5-7.5 11.5S4.5 15.6 4.5 10a7.5 7.5 0 0 1 15 0Z" />
    <circle cx="12" cy="10" r="2.6" />
  </>,
);

export const ClockIcon = createIcon(
  "ClockIcon",
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 6.5V12l3.5 2" />
  </>,
);

/** Speech bubble used for WhatsApp links throughout the mockup. */
export const ChatIcon = createIcon("ChatIcon", <path d="M7.9 20A9 9 0 1 0 4 16.1L2.5 21.5Z" />);

export const InstagramIcon = createIcon(
  "InstagramIcon",
  <>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17.5 6.5h.01" />
  </>,
);

export const FacebookIcon = createIcon(
  "FacebookIcon",
  <path d="M17 2.5h-2.5a4.5 4.5 0 0 0-4.5 4.5v3H7.5v3.8H10v7.7h3.8v-7.7h2.7l.8-3.8h-3.5V7.2a.9.9 0 0 1 .9-.9H17Z" />,
);

export const TikTokIcon = createIcon(
  "TikTokIcon",
  <path d="M14.5 3c.4 2.6 2 4.2 4.5 4.5v3.1a7.6 7.6 0 0 1-4.4-1.4v6.1a5.6 5.6 0 1 1-5.6-5.6h.5v3.2a2.5 2.5 0 1 0 2 2.4V3Z" />,
);

export const LockIcon = createIcon(
  "LockIcon",
  <>
    <rect x="4" y="10.5" width="16" height="11" rx="2" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
  </>,
);

export const TruckIcon = createIcon(
  "TruckIcon",
  <>
    <path d="M14 17.5V6a1.5 1.5 0 0 0-1.5-1.5h-9A1.5 1.5 0 0 0 2 6v10.5a1 1 0 0 0 1 1h1.5" />
    <path d="M15 17.5H9.5M19.5 17.5H21a1 1 0 0 0 1-1v-3.6a1 1 0 0 0-.2-.6l-3.4-4.4a1 1 0 0 0-.8-.4H14" />
    <circle cx="17" cy="17.5" r="2" />
    <circle cx="7" cy="17.5" r="2" />
  </>,
);

export const GiftIcon = createIcon(
  "GiftIcon",
  <>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" />
  </>,
);

export const BanknoteIcon = createIcon(
  "BanknoteIcon",
  <>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.4" />
    <path d="M6 12h.01M18 12h.01" />
  </>,
);

export const PlayIcon = createIcon("PlayIcon", <path d="M7 4.5v15l12.5-7.5Z" />, true);

export const FilterIcon = createIcon("FilterIcon", <path d="M3 6h18M6.5 12h11M10 18h4" />);

/* Brewing steps (home spotlight and product "How to use") */
export const SpoonIcon = createIcon(
  "SpoonIcon",
  <>
    <ellipse cx="15.5" cy="7.5" rx="4" ry="5" transform="rotate(45 15.5 7.5)" />
    <path d="m12.6 10.4-8.6 9" />
  </>,
);

export const KettleIcon = createIcon(
  "KettleIcon",
  <>
    <path d="M6 10h11v6a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4Z" />
    <path d="M17 11.5h1.5a2 2 0 0 1 0 4H17" />
    <path d="M9 3.5c0 1 1 1.3 1 2.5M12.5 3.5c0 1 1 1.3 1 2.5" />
  </>,
);

export const TimerIcon = createIcon(
  "TimerIcon",
  <>
    <circle cx="12" cy="13.5" r="7.5" />
    <path d="M12 13.5V10M10 2.5h4M12 2.5V6" />
  </>,
);

export const CupIcon = createIcon(
  "CupIcon",
  <>
    <path d="M4.5 9.5h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5Z" />
    <path d="M16.5 11h1.5a2.5 2.5 0 0 1 0 5h-1.6" />
    <path d="M8.5 3.5c0 1.2 1 1.5 1 3M12 3.5c0 1.2 1 1.5 1 3" />
  </>,
);
