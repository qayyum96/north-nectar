import { z } from "zod";

/**
 * Validated public environment. Only NEXT_PUBLIC_* values belong here because this module is
 * imported by both server and client code. Next inlines them at build time.
 */
const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .url()
    .default("https://northnectar.com")
    .transform((url) => url.replace(/\/+$/, "")),
  NEXT_PUBLIC_SITE_ENV: z.enum(["production", "preview", "development"]).default("development"),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NEXT_PUBLIC_SITE_ENV: process.env.NEXT_PUBLIC_SITE_ENV || undefined,
});

if (!parsed.success) {
  throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;

/** Search engines may index the site only in production. */
export const isIndexable = env.NEXT_PUBLIC_SITE_ENV === "production";
