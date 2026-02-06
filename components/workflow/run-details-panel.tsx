import type { RunRecord } from "@/lib/types";

interface RunDetailsPanelProps {
  currentRun: RunRecord | null;
  runs: RunRecord[];
}

export function RunDetailsPanel({ currentRun, runs }: RunDetailsPanelProps) {
  if (!currentRun) {
    return (
      <section className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">
        No run has completed yet.
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <article className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-dim)]">Run ID</p>
          <p className="mt-1 text-sm font-medium text-[var(--text-strong)]">{currentRun.id}</p>
        </article>
        <article className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-dim)]">Duration</p>
          <p className="mt-1 text-sm font-medium text-[var(--text-strong)]">{currentRun.duration_ms} ms</p>
        </article>
        <article className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-dim)]">Prompt Version</p>
          <p className="mt-1 text-sm font-medium text-[var(--text-strong)]">{currentRun.prompt_template_version}</p>
        </article>
        <article className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-dim)]">Source</p>
          <p className="mt-1 text-sm font-medium text-[var(--text-strong)]">{currentRun.source}</p>
        </article>
      </div>

      {currentRun.error_details ? (
        <div className="rounded-[var(--radius-input)] border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Error details: {currentRun.error_details}
        </div>
      ) : null}

      <div className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">
        <p className="text-sm font-semibold text-[var(--text-strong)]">Recent runs</p>
        <ul className="mt-2 space-y-1 text-sm text-[var(--text-muted)]">
          {runs.slice(-5).reverse().map((run) => (
            <li key={run.id}>
              {new Date(run.created_at).toLocaleTimeString()} · {run.merge_recommendation.toUpperCase()} · {run.id}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
