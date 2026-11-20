import next from "@northnectar/config/eslint/next";

const config = [
  ...next,
  // Lets Next's rules find this app when ESLint runs from the repo root (pre-commit hook).
  { settings: { next: { rootDir: import.meta.dirname } } },
];

export default config;
