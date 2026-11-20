import { CONTACT_SUBJECTS, type ContactSubject } from "@northnectar/types";
// zod/mini: same validation as "zod" with a much smaller browser bundle (this schema runs in the
// contact form too).
import { z } from "zod/mini";

const subjectValues = CONTACT_SUBJECTS.map((s) => s.value) as [ContactSubject, ...ContactSubject[]];

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;
const PHONE_MSG = "Enter a valid phone number, like 0300 1234567";

/** Shared by the browser (React Hook Form) and the Server Action, so both give the same errors. */
export const contactSchema = z.object({
  name: z
    .string()
    .check(
      z.trim(),
      z.minLength(1, "Please enter your name"),
      z.maxLength(100, "Please shorten your name"),
    ),
  email: z.pipe(
    z.string().check(z.trim(), z.minLength(1, "Please enter your email")),
    z.email("Enter a valid email, like name@example.com"),
  ),
  phone: z.string().check(
    z.trim(),
    z.maxLength(20, PHONE_MSG),
    z.refine((v) => v === "" || /^\+?[\d\s-]{7,}$/.test(v), PHONE_MSG),
  ),
  subject: z.enum(subjectValues),
  message: z
    .string()
    .check(
      z.trim(),
      z.minLength(1, "Please write a message"),
      z.minLength(MESSAGE_MIN, `Please write at least ${MESSAGE_MIN} characters`),
      z.maxLength(MESSAGE_MAX, `Please keep your message under ${MESSAGE_MAX} characters`),
    ),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactValues = z.output<typeof contactSchema>;
export type ContactField = keyof ContactValues;

export const contactDefaults: ContactInput = {
  name: "",
  email: "",
  phone: "",
  subject: "order",
  message: "",
};

export type ContactState =
  | { status: "idle" }
  | { status: "success"; id: string; firstName: string; email: string }
  | {
      status: "error";
      message: string;
      fieldErrors: Partial<Record<ContactField, string>>;
      /** What was submitted, so the form can be refilled when JavaScript is off. */
      values: ContactInput;
    };

/** "Please fix 3 fields below" */
export const errorSummary = (count: number) =>
  `Please fix ${count} ${count === 1 ? "field" : "fields"} below`;
