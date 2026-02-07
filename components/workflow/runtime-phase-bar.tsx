import type { BrainStoryState, StoryMode } from "@/lib/brain-story-state";
import type { RuntimePhase, RuntimePhaseState } from "@/lib/types";

interface RuntimePhaseBarProps {
  state: RuntimePhaseState;
  storyMode?: StoryMode;
  storyState?: BrainStoryState | null;
}

const UTILITY_LABELS: Record<RuntimePhase, string> = {
  review: "Review",
  recommend: "Recommend",
  apply: "Apply"
};

function storyLabel(phase: RuntimePhase, storyState: BrainStoryState | null | undefined): string {
  if (phase === "review") {
    return storyState?.phase === "detect" ? "Detect" : "Scan";
  }

  if (phase === "recommend") {
    return "Index";
  }

  return "Consolidate";
}

function salienceTone(storyState: BrainStoryState | null | undefined): string {
  if (!storyState) {
    return "bg-[var(--border-subtle)]";
  }

  if (storyState.salience === "high") {
    return "bg-red-500";
  }

  if (storyState.salience === "medium") {
    return "bg-sky-500";
  }

  return "bg-emerald-500";
}

export function RuntimePhaseBar({ state, storyMode = "off", storyState = null }: RuntimePhaseBarProps) {
  return (
    <ol className="grid gap-2 md:grid-cols-3">
      {state.phases.map((phase) => {
        const active = phase === state.current;
        const complete = state.completed.includes(phase);
        const utility = UTILITY_LABELS[phase];
        const story = storyLabel(phase, storyState);

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
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[var(--text-strong)]">{storyMode === "on" ? story : utility}</p>
              {storyMode === "on" ? <span className={`h-2 w-2 rounded-full ${salienceTone(storyState)}`} aria-hidden="true" /> : null}
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {storyMode === "on" ? `${utility} lane` : complete ? "Complete" : active ? "In progress" : "Pending"}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
