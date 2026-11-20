import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";

/**
 * Config for Next.js apps (apps/web, later apps/admin).
 * eslint-config-next already registers the jsx-a11y plugin, so we only switch on its full
 * recommended rule set here instead of registering the plugin a second time.
 */
const config = [
  { ignores: [".next/**", "out/**", "next-env.d.ts", ".turbo/**", "node_modules/**"] },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // Styled radio cards nest their visible text one level deeper than the default (2).
      "jsx-a11y/label-has-associated-control": ["error", { depth: 3 }],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },
  prettier,
];

export default config;
