import type { ProductStep } from "@northnectar/types";
import { CupIcon, KettleIcon, SpoonIcon, TimerIcon } from "@northnectar/ui/icons";

const ICONS = [SpoonIcon, KettleIcon, TimerIcon, CupIcon];

/**
 * Numbered steps with circle icons (mockup "How to brew"): 56px icon circle, Oswald "STEP n",
 * 17px title, 15px description. 4 columns on desktop, 2 on mobile. Reused on product pages.
 */
export function StepsList({ steps }: { steps: ProductStep[] }) {
  return (
    <ol
      data-rv="rise"
      className="m-0 grid list-none grid-cols-2 gap-x-5 gap-y-7 p-0 md:grid-cols-4"
    >
      {steps.map((step, index) => {
        const Icon = ICONS[index % ICONS.length]!;
        return (
          <li key={step.title} className="flex flex-col gap-[10px]">
            <span className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="inline-flex size-14 flex-none items-center justify-center rounded-full border-[1.5px] border-forest-600 text-forest-600"
              >
                <Icon size={26} />
              </span>
              <span className="font-display text-[14px] leading-[21px] font-bold tracking-[0.08em] text-[#8a6d36] uppercase">
                Step {index + 1}
              </span>
            </span>
            <span className="text-[17px] leading-[26px] font-bold">{step.title}</span>
            <span className="text-[15px] leading-[1.55] text-[#5e5a4e]">{step.description}</span>
          </li>
        );
      })}
    </ol>
  );
}
