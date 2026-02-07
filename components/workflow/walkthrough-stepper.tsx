import type { WalkthroughStep } from "@/lib/types";

interface WalkthroughStepperProps {
  step: WalkthroughStep;
}

const STEPS: Array<{ key: WalkthroughStep; label: string; subtitle: string }> = [
  { key: "review", label: "1. Review", subtitle: "Run and inspect the verdict" },
  { key: "teach", label: "2. Teach", subtitle: "Promote memory when needed" },
  { key: "prove", label: "3. Prove", subtitle: "Validate learning and optionally apply fix" }
];

export function WalkthroughStepper({ step }: WalkthroughStepperProps) {
  const activeIndex = STEPS.findIndex((candidate) => candidate.key === step);

  return (
    <ol className="grid gap-2 md:grid-cols-3">
      {STEPS.map((candidate, index) => {
        const active = index === activeIndex;
        const complete = index < activeIndex;

        return (
          <li
            key={candidate.key}
            className={`rounded-[var(--radius-input)] border px-3 py-2 ${
              active
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : complete
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-[var(--border-subtle)] bg-[var(--surface-muted)]"
            }`}
          >
            <p className="text-xs font-semibold text-[var(--text-strong)]">{candidate.label}</p>
            <p className="text-xs text-[var(--text-muted)]">{candidate.subtitle}</p>
          </li>
        );
      })}
    </ol>
  );
}
