/** @type {import("prettier").Config} */
const config = {
  printWidth: 100,
  singleQuote: false,
  semi: true,
  trailingComma: "all",
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindFunctions: ["cn", "cva"],
};

export default config;
