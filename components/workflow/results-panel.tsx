import { useMemo, useState, type JSX } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemoFindingsList } from "@/components/workflow/demo-findings-list";
import { DetailsDrawer } from "@/components/workflow/details-drawer";
import { MemoryPanel } from "@/components/workflow/memory-panel";
import { RunDetailsPanel } from "@/components/workflow/run-details-panel";
import { extractDiffFileSummaries } from "@/lib/diff-anchors";
import { findingToMarkdownComment, mergeRecommendationLabel, summarizeFindings } from "@/lib/results-summary";
import type { Finding, MemoryVersion, RightPanelTab, RunRecord, RunResult, WorkflowUiState } from "@/lib/types";

interface ResultsPanelProps {
  uiState: WorkflowUiState;
  activeTab: RightPanelTab;
  currentRun: RunRecord | null;
  currentResult: RunResult | null;
  currentMemory: MemoryVersion | null;
  currentMemoryId: string | null;
  memoryVersions: MemoryVersion[];
  runs: RunRecord[];
  promoting: boolean;
  selectedPrUrl: string;
  canApplyFix?: boolean;
  applyingFixIndex?: number | null;
  applyFixFeedback?: {
    index: number;
    type: "success" | "error";
    message: string;
    commitUrl?: string;
  } | null;
  onSelectTab: (tab: RightPanelTab) => void;
  onChangeMemory: (memoryId: string) => void;
  onProposeRule: () => void;
  onJumpToFinding: (finding: Finding) => void;
  onApplyFix?: (finding: Finding, index: number) => void;
  onCancelRun: () => void;
  onRecoverError: () => void;
}

function statusBadgeVariant(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  if (status === "PASS") return "success";
  if (status === "REVIEW") return "warning";
  if (status === "BLOCK") return "danger";
  return "neutral";
}

function severityVariant(severity: Finding["severity"]): "danger" | "warning" | "info" {
  if (severity === "critical") return "danger";
  if (severity === "warning") return "warning";
  return "info";
}

function toIssueUrl(prUrl: string, finding: Finding): string {
  const repositoryUrl = prUrl.replace(/\/pull\/\d+.*$/, "");
  const title = encodeURIComponent(`[Review] ${finding.title}`);
  const body = encodeURIComponent(findingToMarkdownComment(finding));
  return `${repositoryUrl}/issues/new?title=${title}&body=${body}`;
}

function isDiffLine(line: string): boolean {
  return (
    /^(\+\+\+|---|@@|diff --git|index )/.test(line) ||
    (/^\+/.test(line) && !/^\+\+\+/.test(line)) ||
    (/^-/.test(line) && !/^---/.test(line))
  );
}

function renderSuggestedFix(suggestedFix: string | null): JSX.Element {
  if (!suggestedFix) {
    return <p className="mt-2 text-sm text-[var(--text-muted)]">No suggested fix provided.</p>;
  }

  const lines = suggestedFix.split("\n");
  const hasDiffMarkers = lines.some((line) => isDiffLine(line));

  return (
    <div className="mt-2 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">
        {hasDiffMarkers ? "Suggested diff" : "Suggested fix"}
      </p>
      <pre className="max-h-[220px] overflow-auto rounded-[var(--radius-input)] border border-slate-800 bg-[#07121f] p-3 text-xs text-slate-100">
        {lines.map((line, index) => {
          const toneClass = /^\+/.test(line) && !/^\+\+\+/.test(line)
            ? "text-emerald-300"
            : /^-/.test(line) && !/^---/.test(line)
              ? "text-rose-300"
              : /^@@/.test(line)
                ? "text-sky-300"
                : "text-slate-200";

          return (
            <span key={`${line}-${index}`} className={`block font-mono ${toneClass}`}>
              {line || " "}
            </span>
          );
        })}
      </pre>
    </div>
  );
}

function PhaseStepper({ phase }: { phase?: WorkflowUiState["runPhase"] }) {
  const phases: Array<{ key: "assembling" | "evaluating" | "formatting"; label: string }> = [
    { key: "assembling", label: "Assembling context" },
    { key: "evaluating", label: "Evaluating diff" },
    { key: "formatting", label: "Formatting findings" }
  ];

  const activeIndex = phase ? phases.findIndex((step) => step.key === phase) : -1;

  return (
    <ul className="space-y-2">
      {phases.map((step, index) => {
        const completed = activeIndex > index;
        const active = activeIndex === index;

        return (
          <li
            key={step.key}
            className={`flex items-center justify-between rounded-[var(--radius-input)] border px-3 py-2 text-sm ${
              active
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-strong)]"
                : completed
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-muted)]"
            }`}
          >
            <span>{step.label}</span>
            <span>{completed ? "✓" : active ? "…" : "○"}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function ResultsPanel({
  uiState,
  activeTab,
  currentRun,
  currentResult,
  currentMemory,
  currentMemoryId,
  memoryVersions,
  runs,
  promoting,
  selectedPrUrl,
  canApplyFix = false,
  applyingFixIndex = null,
  applyFixFeedback = null,
  onSelectTab,
  onChangeMemory,
  onProposeRule,
  onJumpToFinding,
  onApplyFix,
  onCancelRun,
  onRecoverError
}: ResultsPanelProps) {
  const [expandedFindingIndex, setExpandedFindingIndex] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isDemoMode = uiState.viewMode === "demo";

  const findingSummary = useMemo(
    () => summarizeFindings(currentResult?.findings ?? []),
    [currentResult?.findings]
  );

  const diffSummary = useMemo(() => {
    if (!currentRun) {
      return { files: 0, loc: 0 };
    }

    const files = extractDiffFileSummaries(currentRun.pr_diff);
    const loc = files.reduce((count, file) => count + file.additions + file.deletions, 0);

    return {
      files: files.length,
      loc
    };
  }, [currentRun]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        {!isDemoMode ? (
          <div className="flex items-center gap-1 rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-1">
            <Button variant={activeTab === "findings" ? "secondary" : "ghost"} className="px-2 py-1 text-xs" onClick={() => onSelectTab("findings")}>
              Findings
            </Button>
            <Button variant={activeTab === "memory" ? "secondary" : "ghost"} className="px-2 py-1 text-xs" onClick={() => onSelectTab("memory")}>
              Memory
            </Button>
            <Button
              variant={activeTab === "run_details" ? "secondary" : "ghost"}
              className="px-2 py-1 text-xs"
              onClick={() => onSelectTab("run_details")}
            >
              Run details
            </Button>
          </div>
        ) : (
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">Demo lane</p>
        )}

        {currentMemory ? <Badge variant="info">Memory v{currentMemory.version}</Badge> : null}
      </div>

      {isDemoMode ? (
        <DetailsDrawer open={detailsOpen} onToggle={() => setDetailsOpen((value) => !value)}>
          <div className="space-y-3">
            <MemoryPanel
              memoryVersions={memoryVersions}
              currentMemory={currentMemory}
              currentMemoryId={currentMemoryId}
              onChangeMemory={onChangeMemory}
            />
            <RunDetailsPanel currentRun={currentRun} runs={runs} />
          </div>
        </DetailsDrawer>
      ) : null}

      {!isDemoMode && activeTab === "memory" ? (
        <MemoryPanel
          memoryVersions={memoryVersions}
          currentMemory={currentMemory}
          currentMemoryId={currentMemoryId}
          onChangeMemory={onChangeMemory}
        />
      ) : null}

      {!isDemoMode && activeTab === "run_details" ? <RunDetailsPanel currentRun={currentRun} runs={runs} /> : null}

      {(isDemoMode || activeTab === "findings") ? (
        <>
          {uiState.status === "signed_out" ? (
            <section className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4">
              <p className="text-sm font-semibold text-[var(--text-strong)]">Connect GitHub to begin</p>
              <ol className="mt-2 space-y-1 text-sm text-[var(--text-muted)]">
                <li>1. Sign in with GitHub.</li>
                <li>2. Choose repository and PR.</li>
                <li>3. Run checkout safety review.</li>
              </ol>
            </section>
          ) : null}

          {uiState.status === "repo_loading" ? (
            <section className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">
              Loading pull requests for this repository...
            </section>
          ) : null}

          {uiState.status === "pr_loading" ? (
            <section className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">
              Pull request selected. Fetching diff preview...
            </section>
          ) : null}

          {uiState.status === "running" ? (
            <section className="space-y-3">
              <p className="text-sm font-semibold text-[var(--text-strong)]">Analysis in progress</p>
              <PhaseStepper phase={uiState.runPhase} />
              <div className="flex items-center justify-between rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3 text-sm text-[var(--text-muted)]">
                <p>Codex is processing the selected diff and team memory.</p>
                <Button variant="secondary" onClick={onCancelRun}>
                  Cancel
                </Button>
              </div>
            </section>
          ) : null}

          {uiState.status === "error" ? (
            <section className="space-y-3 rounded-[var(--radius-input)] border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-900">Analysis failed</p>
              <p className="text-sm text-red-800">{uiState.message ?? "Unknown error"}</p>
              <Button variant="danger" onClick={onRecoverError}>
                Recover
              </Button>
            </section>
          ) : null}

          {(uiState.status === "ready" || uiState.status === "done") && !currentResult ? (
            <section className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4">
              <p className="text-sm font-semibold text-[var(--text-strong)]">What this does</p>
              <ul className="mt-2 space-y-1 text-sm text-[var(--text-muted)]">
                <li>• Evaluates PR diff against your checkout safety memory.</li>
                <li>• Reports severity-scored findings with file and line references.</li>
                <li>• Suggests a new rule when repeat patterns are detected.</li>
              </ul>
              <p className="mt-3 rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 text-xs text-[var(--text-muted)]">
                Sample: Missing idempotency key in `src/payments/charge.ts:42` with suggested retry-safe fix.
              </p>
            </section>
          ) : null}

          {currentRun && currentResult ? (
            <section className="space-y-3">
              {isDemoMode ? (
                <>
                  <DemoFindingsList
                    currentRun={currentRun}
                    currentResult={currentResult}
                    promoting={promoting}
                    canApplyFix={canApplyFix}
                    applyingFixIndex={applyingFixIndex}
                    applyFixFeedback={applyFixFeedback}
                    onProposeRule={onProposeRule}
                    onJumpToFinding={onJumpToFinding}
                    onApplyFix={onApplyFix}
                  />
                  {!canApplyFix ? (
                    <p className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-muted)]">
                      Apply Fix is limited to one successful commit in eligible demo rounds.
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <header className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--text-strong)]">{currentResult.summary}</p>
                      <Badge variant={statusBadgeVariant(mergeRecommendationLabel(currentRun.merge_recommendation))}>
                        {mergeRecommendationLabel(currentRun.merge_recommendation)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      critical: {findingSummary.critical} · warning: {findingSummary.warning} · info: {findingSummary.info} · files: {diffSummary.files} · LOC: {diffSummary.loc} · runtime: {currentRun.duration_ms}ms
                    </p>
                  </header>

                  <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
                    {currentResult.findings.map((finding, index) => {
                      const expanded = expandedFindingIndex === index;

                      return (
                        <article key={`${finding.file}-${finding.line}-${index}`} className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold text-[var(--text-strong)]">{finding.title}</h4>
                            <Badge variant={severityVariant(finding.severity)}>{finding.severity}</Badge>
                          </div>
                          <p className="text-xs text-[var(--text-muted)]">
                            {finding.file}:{finding.line}
                          </p>
                          <p className="mt-1 text-sm text-[var(--text-muted)]">Why: {finding.description}</p>
                          <div className="mt-2">
                            {finding.memory_reference ? (
                              <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                                Caught by memory rule: {finding.memory_reference}
                              </span>
                            ) : (
                              <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]">
                                Heuristic detection
                              </span>
                            )}
                          </div>

                          {renderSuggestedFix(finding.suggested_fix)}

                          {expanded ? (
                            <div className="mt-2 rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-2 text-xs text-[var(--text-muted)]">
                              <p>Source: {finding.memory_reference ? `memory rule (${finding.memory_reference})` : "heuristic/model"}</p>
                              <p>Confidence: medium</p>
                            </div>
                          ) : null}

                          <div className="mt-2 flex flex-wrap gap-2">
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
                            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => onJumpToFinding(finding)}>
                              Jump to diff
                            </Button>
                            <Button
                              variant="ghost"
                              className="px-2 py-1 text-xs"
                              onClick={async () => {
                                if (navigator.clipboard) {
                                  await navigator.clipboard.writeText(findingToMarkdownComment(finding));
                                }
                              }}
                            >
                              Copy PR comment
                            </Button>
                            <a
                              href={selectedPrUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-[var(--radius-input)] border border-[var(--border-subtle)] px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                            >
                              Open in GitHub
                            </a>
                            <a
                              href={toIssueUrl(selectedPrUrl, finding)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-[var(--radius-input)] border border-[var(--border-subtle)] px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                            >
                              Create issue
                            </a>
                            <Button
                              variant="ghost"
                              className="px-2 py-1 text-xs"
                              onClick={() => setExpandedFindingIndex(expanded ? null : index)}
                            >
                              {expanded ? "Collapse" : "Expand"}
                            </Button>
                          </div>

                          {applyFixFeedback?.index === index ? (
                            <div
                              className={`mt-2 rounded-[var(--radius-input)] border px-2 py-1 text-xs ${
                                applyFixFeedback.type === "success"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : "border-rose-200 bg-rose-50 text-rose-800"
                              }`}
                            >
                              {applyFixFeedback.message}
                              {applyFixFeedback.type === "success" && applyFixFeedback.commitUrl ? (
                                <a
                                  href={applyFixFeedback.commitUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="ml-2 underline"
                                >
                                  View commit
                                </a>
                              ) : null}
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>

                  {currentResult.memory_suggestions[0] ? (
                    <article className="rounded-[var(--radius-input)] border border-[var(--accent)] bg-[var(--accent-soft)] p-3">
                      <p className="text-sm font-semibold text-[var(--text-strong)]">Memory suggestion</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{currentResult.memory_suggestions[0].content}</p>
                      <Button className="mt-2" onClick={onProposeRule} disabled={promoting}>
                        {promoting ? "Proposing..." : "Propose rule"}
                      </Button>
                    </article>
                  ) : null}
                </>
              )}
            </section>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
