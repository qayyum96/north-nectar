import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge has to know about our custom font-size tokens. Without this, a class like
 * `text-display-lg` would be treated as a colour and silently removed next to `text-white`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["md", "display-2xl", "display-xl", "display-lg", "display-md", "display-sm"],
      radius: ["card", "panel", "hero"],
      shadow: ["card", "card-hover", "drawer", "leaf"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
