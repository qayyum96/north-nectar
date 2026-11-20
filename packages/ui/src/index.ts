// Utilities
export { cn } from "./lib/cn";
export { formatPkr, formatPricePer100g } from "./lib/format";
export { RichParagraph, plainText, renderInline } from "./lib/rich-text";

// Primitives (server-safe)
export { Button, buttonVariants } from "./components/button";
export type {
  ButtonProps,
  ButtonSize,
  ButtonVariant,
  ButtonStyleOptions,
} from "./components/button";
export {
  Checkbox,
  FieldError,
  FieldHint,
  FormField,
  Input,
  Label,
  Select,
  Textarea,
  fieldA11y,
} from "./components/form";
export type { FormFieldProps } from "./components/form";
export { Badge } from "./components/badge";
export type { BadgeProps, BadgeTone } from "./components/badge";
export { ChipCount, chipVariants } from "./components/chip";
export { Card, Container, Eyebrow, SectionHeading, VisuallyHidden } from "./components/layout";
export type { SectionHeadingProps } from "./components/layout";
export { Alert, ProgressBar, StarRating } from "./components/feedback";
export { AccordionItem } from "./components/accordion";
export { RadioCard } from "./components/radio-card";

// Icons (also available from "@northnectar/ui/icons")
export * from "./icons";

// Client components ("use client" inside each file)
export { QuantityStepper } from "./components/quantity-stepper";
export { Drawer } from "./components/drawer";
export { Tabs } from "./components/tabs";
export type { TabItem, TabsProps } from "./components/tabs";
