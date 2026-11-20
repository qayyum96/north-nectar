/**
 * Validated public environment. Only NEXT_PUBLIC_* values belong here because this module is
 * imported by both server and client code. Next inlines them at build time.
 *
 * Validation is plain TypeScript (no Zod) on purpose: this module is part of every page's client
 * bundle, and Zod would add ~30 KB of gzipped JavaScript to all of them.
 */

const SITE_ENVS = ["production", "preview", "development"] as const;
type SiteEnv = (typeof SITE_ENVS)[number];

function readSiteUrl(raw: string | undefined): string {
  const value = raw?.trim() || "https://northnectar.com";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
  } catch {
    throw new Error(
      `Invalid environment variables:\nNEXT_PUBLIC_SITE_URL must be a URL (got "${value}")`,
    );
  }
  return value.replace(/\/+$/, "");
}

function readSiteEnv(raw: string | undefined): SiteEnv {
  const value = raw?.trim() || "development";
  if (!(SITE_ENVS as readonly string[]).includes(value)) {
    throw new Error(
      `Invalid environment variables:\nNEXT_PUBLIC_SITE_ENV must be one of ${SITE_ENVS.join(", ")} (got "${value}")`,
    );
  }
  return value as SiteEnv;
}

export const env = {
  NEXT_PUBLIC_SITE_URL: readSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  NEXT_PUBLIC_SITE_ENV: readSiteEnv(process.env.NEXT_PUBLIC_SITE_ENV),
} as const;

/** Search engines may index the site only in production. */
export const isIndexable = env.NEXT_PUBLIC_SITE_ENV === "production";

/**
 * Placeholder content (e.g. sample testimonials from the mockup) is shown on development and
 * preview builds only, never on the live site.
 */
export const showPlaceholderContent = env.NEXT_PUBLIC_SITE_ENV !== "production";
