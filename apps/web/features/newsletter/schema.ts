import { z } from "zod";

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email")
    .pipe(z.email("Enter a valid email, like name@example.com")),
  /** Honeypot: hidden from people, often filled by bots. Must stay empty. */
  company: z.string().max(0).optional(),
  source: z.string().max(100).optional(),
});

export type NewsletterState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };
