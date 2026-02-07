import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { BrainHero } from "@/components/workflow/brain-hero";
import { RehearsalLogDrawer } from "@/components/workflow/rehearsal-log-drawer";
import { RuntimePhaseBar } from "@/components/workflow/runtime-phase-bar";
import { StoryModeToggle } from "@/components/workflow/story-mode-toggle";
import type { BrainStoryState, StoryMode } from "@/lib/brain-story-state";
import { createRehearsalDraft } from "@/lib/rehearsal-log";
import type { DemoRoundDefinition, RuntimePhaseState } from "@/lib/types";

interface DemoModeShellProps {
  selectedRound: DemoRoundDefinition;
  phaseState: RuntimePhaseState;
  onToggleMode: () => void;
  storyMode?: StoryMode;
  storyState?: BrainStoryState | null;
  onStoryModeChange?: (mode: StoryMode) => void;
  children: ReactNode;
}

export function DemoModeShell({
  selectedRound,
  phaseState,
  onToggleMode,
  storyMode = "off",
  storyState = null,
  onStoryModeChange,
  children
}: DemoModeShellProps) {
  const [logOpen, setLogOpen] = useState(false);
  const draft = useMemo(() => createRehearsalDraft(selectedRound), [selectedRound]);

  useEffect(() => {
    if (phaseState.current === "apply") {
      setLogOpen(true);
    }
  }, [phaseState.current]);

  return (
    <section className="space-y-4">
      <header className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-strong)]">Workflow mode</p>
            <p className="text-xs text-[var(--text-muted)]">Runtime progression updates as results become available.</p>
          </div>
          <div className="flex items-center gap-2">
            {onStoryModeChange ? <StoryModeToggle mode={storyMode} onChange={onStoryModeChange} /> : null}
            <Button variant="secondary" onClick={onToggleMode}>
              Advanced mode
            </Button>
            <Button variant="ghost" onClick={() => setLogOpen((value) => !value)}>
              {logOpen ? "Hide evidence" : "Evidence draft"}
            </Button>
          </div>
        </div>

        <div className="mt-3">
          {storyMode === "on" && storyState ? <BrainHero state={storyState} /> : null}
          <RuntimePhaseBar state={phaseState} />
        </div>
      </header>

      <div>{children}</div>

      <RehearsalLogDrawer open={logOpen} draft={draft} onClose={() => setLogOpen(false)} />
    </section>
  );
}
