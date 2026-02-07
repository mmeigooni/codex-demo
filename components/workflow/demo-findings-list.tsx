import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Finding, RunRecord, RunResult } from "@/lib/types";

interface DemoFindingsListProps {
  currentRun: RunRecord;
  currentResult: RunResult;
  promoting: boolean;
  canApplyFix: boolean;
  applyingFixIndex: number | null;
  applyFixFeedback: {
    index: number;
    type: "success" | "error";
    message: string;
    commitUrl?: string;
  } | null;
  onProposeRule: () => void;
  onJumpToFinding: (finding: Finding) => void;
  onApplyFix?: (finding: Finding, index: number) => void;
}

function severityVariant(severity: Finding["severity"]): "danger" | "warning" | "info" {
  if (severity === "critical") return "danger";
  if (severity === "warning") return "warning";
  return "info";
}

export function DemoFindingsList({
  currentRun,
  currentResult,
  promoting,
  canApplyFix,
  applyingFixIndex,
  applyFixFeedback,
  onProposeRule,
  onJumpToFinding,
  onApplyFix
}: DemoFindingsListProps) {
  const topFindings = currentResult.findings.slice(0, 3);

  return (
    <section className="space-y-3">
      <header className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">
        <p className="text-sm font-semibold text-[var(--text-strong)]">{currentResult.summary}</p>
        <p className="text-xs text-[var(--text-muted)]">Runtime: {currentRun.duration_ms}ms · Showing top {topFindings.length} findings</p>
      </header>

      {topFindings.map((finding, index) => (
        <article key={`${finding.file}-${finding.line}-${index}`} className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--text-strong)]">{finding.title}</p>
            <Badge variant={severityVariant(finding.severity)}>{finding.severity}</Badge>
          </div>
          <p className="text-xs text-[var(--text-muted)]">{finding.file}:{finding.line}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{finding.description}</p>

          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => onJumpToFinding(finding)}>
              Jump to diff
            </Button>
            {onApplyFix && finding.suggested_fix && canApplyFix ? (
              <Button
                variant="default"
                className="px-2 py-1 text-xs"
                disabled={applyingFixIndex === index}
                onClick={() => onApplyFix(finding, index)}
              >
                {applyingFixIndex === index ? "Applying..." : "Apply Fix"}
              </Button>
            ) : null}
          </div>

          {applyFixFeedback?.index === index ? (
            <p className={`mt-2 text-xs ${applyFixFeedback.type === "success" ? "text-emerald-700" : "text-rose-700"}`}>
              {applyFixFeedback.message}
            </p>
          ) : null}
        </article>
      ))}

      {currentResult.memory_suggestions[0] ? (
        <article className="rounded-[var(--radius-input)] border border-[var(--accent)] bg-[var(--accent-soft)] p-3">
          <p className="text-sm font-semibold text-[var(--text-strong)]">Memory suggestion</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{currentResult.memory_suggestions[0].content}</p>
          <Button className="mt-2" onClick={onProposeRule} disabled={promoting}>
            {promoting ? "Promoting..." : "Promote rule"}
          </Button>
        </article>
      ) : null}
    </section>
  );
}
