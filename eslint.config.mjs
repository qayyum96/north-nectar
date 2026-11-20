import base from "@northnectar/config/eslint/base";

/**
 * Root config for files outside the apps and packages (e.g. .prettierrc.mjs, packages/config).
 * Apps and packages have their own eslint.config.mjs; the pre-commit hook runs ESLint with
 * per-file config lookup, so each file uses its nearest config.
 */
export default [{ ignores: ["design/**", "apps/**", "packages/{data,types,ui}/**"] }, ...base];
