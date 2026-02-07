import type { RuntimePhase, RuntimePhaseState } from "@/lib/types";

interface RuntimePhaseBarProps {
  state: RuntimePhaseState;
}

const LABELS: Record<RuntimePhase, string> = {
  review: "Review",
  recommend: "Recommend",
  apply: "Apply"
};

export function RuntimePhaseBar({ state }: RuntimePhaseBarProps) {
  return (
    <ol className="grid gap-2 md:grid-cols-3">
      {state.phases.map((phase) => {
        const active = phase === state.current;
        const complete = state.completed.includes(phase);

        return (
          <li
            key={phase}
            className={`rounded-[var(--radius-input)] border px-3 py-2 ${
              active
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : complete
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-[var(--border-subtle)] bg-[var(--surface-muted)]"
            }`}
          >
            <p className="text-xs font-semibold text-[var(--text-strong)]">{LABELS[phase]}</p>
            <p className="text-xs text-[var(--text-muted)]">{complete ? "Complete" : active ? "In progress" : "Pending"}</p>
          </li>
        );
      })}
    </ol>
  );
}
