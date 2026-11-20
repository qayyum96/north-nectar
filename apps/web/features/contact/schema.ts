import { CONTACT_SUBJECTS, type ContactSubject } from "@northnectar/types";
import { z } from "zod";

const subjectValues = CONTACT_SUBJECTS.map((s) => s.value) as [ContactSubject, ...ContactSubject[]];

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;

/** Shared by the browser (React Hook Form) and the Server Action, so both give the same errors. */
export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100, "Please shorten your name"),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email")
    .pipe(z.email("Enter a valid email, like name@example.com")),
  phone: z
    .string()
    .trim()
    .max(20, "Enter a valid phone number, like 0300 1234567")
    .refine((v) => v === "" || /^\+?[\d\s-]{7,}$/.test(v), {
      message: "Enter a valid phone number, like 0300 1234567",
    }),
  subject: z.enum(subjectValues),
  message: z
    .string()
    .trim()
    .min(1, "Please write a message")
    .min(MESSAGE_MIN, `Please write at least ${MESSAGE_MIN} characters`)
    .max(MESSAGE_MAX, `Please keep your message under ${MESSAGE_MAX} characters`),
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
