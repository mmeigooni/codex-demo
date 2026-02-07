import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { RehearsalLogDrawer } from "@/components/workflow/rehearsal-log-drawer";
import { WalkthroughStepper } from "@/components/workflow/walkthrough-stepper";
import { createRehearsalDraft } from "@/lib/rehearsal-log";
import type { DemoRoundDefinition, WalkthroughStep } from "@/lib/types";

interface DemoModeShellProps {
  rounds: DemoRoundDefinition[];
  selectedRoundKey: string;
  currentStep: WalkthroughStep;
  objective: string;
  expectedRecommendation: string;
  onSelectRound: (roundKey: string) => void;
  onToggleMode: () => void;
  children: ReactNode;
}

export function DemoModeShell({
  rounds,
  selectedRoundKey,
  currentStep,
  objective,
  expectedRecommendation,
  onSelectRound,
  onToggleMode,
  children
}: DemoModeShellProps) {
  const [logOpen, setLogOpen] = useState(false);
  const selectedRound = useMemo(
    () => rounds.find((round) => round.key === selectedRoundKey) ?? rounds[0],
    [rounds, selectedRoundKey]
  );
  const draft = useMemo(() => createRehearsalDraft(selectedRound), [selectedRound]);

  useEffect(() => {
    if (currentStep === "prove") {
      setLogOpen(true);
    }
  }, [currentStep, selectedRoundKey]);

  return (
    <section className="space-y-4">
      <header className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-strong)]">Demo walkthrough mode</p>
            <p className="text-xs text-[var(--text-muted)]">Narrative-first flow: Review, Teach, Prove.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--text-dim)]">
              Round
              <select
                value={selectedRoundKey}
                onChange={(event) => onSelectRound(event.target.value)}
                className="ml-2 rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-2 py-1 text-xs text-[var(--text-strong)]"
              >
                {rounds.map((round) => (
                  <option key={round.key} value={round.key}>
                    {round.key} · {round.objective}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="secondary" onClick={onToggleMode}>
              Advanced mode
            </Button>
            <Button variant="ghost" onClick={() => setLogOpen((value) => !value)}>
              {logOpen ? "Hide evidence" : "Evidence draft"}
            </Button>
          </div>
        </div>

        <div className="mt-3 rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3 text-xs text-[var(--text-muted)]">
          Objective: <span className="font-medium text-[var(--text-strong)]">{objective}</span>
          <span className="mx-2">•</span>
          Expected recommendation: <span className="font-medium text-[var(--text-strong)]">{expectedRecommendation.toUpperCase()}</span>
        </div>

        <div className="mt-3">
          <WalkthroughStepper step={currentStep} />
        </div>
      </header>

      <div>{children}</div>

      <RehearsalLogDrawer open={logOpen} draft={draft} onClose={() => setLogOpen(false)} />
    </section>
  );
}
