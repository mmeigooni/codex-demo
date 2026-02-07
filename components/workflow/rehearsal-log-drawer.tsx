import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatRehearsalDraftMarkdown, type RehearsalDraft } from "@/lib/rehearsal-log";

interface RehearsalLogDrawerProps {
  open: boolean;
  draft: RehearsalDraft;
  onClose: () => void;
}

export function RehearsalLogDrawer({ open, draft, onClose }: RehearsalLogDrawerProps) {
  const [varianceNotes, setVarianceNotes] = useState("");
  const [recoveryAction, setRecoveryAction] = useState("");

  const markdown = useMemo(() => {
    return formatRehearsalDraftMarkdown({
      ...draft,
      varianceNotes,
      recoveryAction
    });
  }, [draft, recoveryAction, varianceNotes]);

  if (!open) {
    return null;
  }

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--text-strong)]">Rehearsal evidence draft</p>
          <p className="text-xs text-[var(--text-muted)]">Auto-filled structure. Add notes, then copy markdown.</p>
        </div>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-xs text-[var(--text-dim)]">
          Variance notes
          <textarea
            className="mt-1 h-20 w-full rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-2 py-1 text-xs text-[var(--text-strong)]"
            value={varianceNotes}
            onChange={(event) => setVarianceNotes(event.target.value)}
          />
        </label>
        <label className="text-xs text-[var(--text-dim)]">
          Recovery action
          <textarea
            className="mt-1 h-20 w-full rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-2 py-1 text-xs text-[var(--text-strong)]"
            value={recoveryAction}
            onChange={(event) => setRecoveryAction(event.target.value)}
          />
        </label>
      </div>

      <pre className="mt-3 max-h-[260px] overflow-auto rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3 text-xs text-[var(--text-strong)]">
        {markdown}
      </pre>

      <div className="mt-2 flex gap-2">
        <Button
          onClick={async () => {
            if (navigator.clipboard) {
              await navigator.clipboard.writeText(markdown);
            }
          }}
        >
          Copy markdown
        </Button>
      </div>
    </section>
  );
}
