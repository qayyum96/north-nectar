import config from "@northnectar/config/prettier";

/** @type {import("prettier").Config} */
export default {
  ...config,
  // Lets the Tailwind class sorter see our custom theme tokens (Tailwind v4 CSS config).
  tailwindStylesheet: "./apps/web/app/globals.css",
};
