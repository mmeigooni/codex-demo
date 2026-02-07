"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DiffPanel } from "@/components/workflow/diff-panel";
import { MemoryTimeline } from "@/components/workflow/memory-timeline";
import { MorePacksDrawer } from "@/components/workflow/more-packs-drawer";
import { PrContextPanel } from "@/components/workflow/pr-context-panel";
import { ResultsPanel } from "@/components/workflow/results-panel";
import { TopBar } from "@/components/workflow/top-bar";
import { DEFAULT_DEMO_REPO, GITHUB_OAUTH_SCOPES } from "@/lib/constants";
import { mapFindingToDiffAnchor, extractDiffFileSummaries } from "@/lib/diff-anchors";
import { normalizeRepoInput, repoValidationMessage, REPO_AUTOLOAD_DEBOUNCE_MS, shouldAutoloadRepo } from "@/lib/repo-utils";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useTimelineData } from "@/lib/use-timeline-data";
import {
  canRunAnalysis,
  initialWorkflowUiState,
  reduceWorkflowUiState
} from "@/lib/workflow-ui-state";
import type {
  DiffLineAnchor,
  Finding,
  GitHubPullRequest,
  MemorySuggestion,
  MemoryVersion,
  RightPanelTab,
  RunRecord,
  RunResult,
  WorkflowPack
} from "@/lib/types";

type SessionLike = {
  user: {
    email?: string;
    user_metadata?: {
      avatar_url?: string;
      user_name?: string;
      full_name?: string;
    };
  };
};

function memoryFromSuggestion(memory: MemoryVersion, suggestion: MemorySuggestion): { newContent: string; section: string } {
  const section = suggestion.category;
  const lines = suggestion.content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.startsWith("-") ? line : `- ${line}`));

  const newSection = `\n\n### ${section}\n${lines.join("\n")}`;

  return {
    section,
    newContent: `${memory.content}${newSection}`
  };
}

export function WorkflowDashboard() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [uiState, dispatchUiState] = useReducer(reduceWorkflowUiState, initialWorkflowUiState);
  const [activeTab, setActiveTab] = useState<RightPanelTab>("findings");

  const [session, setSession] = useState<SessionLike | null>(null);

  const [repo, setRepo] = useState(DEFAULT_DEMO_REPO);
  const [pack, setPack] = useState<WorkflowPack | null>(null);
  const [memoryVersions, setMemoryVersions] = useState<MemoryVersion[]>([]);
  const [currentMemoryId, setCurrentMemoryId] = useState<string | null>(null);

  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [selectedPrNumber, setSelectedPrNumber] = useState<number | null>(null);
  const [selectedPrTitle, setSelectedPrTitle] = useState("");
  const [selectedPrUrl, setSelectedPrUrl] = useState("");
  const [prDiff, setPrDiff] = useState("");
  const [diffJumpAnchor, setDiffJumpAnchor] = useState<DiffLineAnchor | null>(null);

  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [currentRun, setCurrentRun] = useState<RunRecord | null>(null);
  const [currentResult, setCurrentResult] = useState<RunResult | null>(null);
  const [selectedTimelineNodeId, setSelectedTimelineNodeId] = useState<string | null>(null);

  const [loadingBootstrap, setLoadingBootstrap] = useState(true);
  const [loadingPrs, setLoadingPrs] = useState(false);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [running, setRunning] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [applyingFixIndex, setApplyingFixIndex] = useState<number | null>(null);
  const [applyFixFeedback, setApplyFixFeedback] = useState<{
    index: number;
    type: "success" | "error";
    message: string;
    commitUrl?: string;
  } | null>(null);

  const runAbortRef = useRef<AbortController | null>(null);
  const runPhaseTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const currentMemory = useMemo(
    () => memoryVersions.find((memory) => memory.id === currentMemoryId) ?? memoryVersions.at(-1) ?? null,
    [memoryVersions, currentMemoryId]
  );

  const userName =
    session?.user.user_metadata?.full_name ??
    session?.user.user_metadata?.user_name ??
    session?.user.email ??
    "Anonymous";

  const repoMessage = repoValidationMessage(repo);

  const canRun = canRunAnalysis(
    uiState,
    Boolean(pack && currentMemory && selectedPrUrl && prDiff && !loadingBootstrap && !loadingDiff)
  );

  const runLabel = running ? "Running..." : currentRun ? "Re-run" : "Run";
  const runHelper = `Pack: ${pack?.name ?? "N/A"} · Memory v${currentMemory?.version ?? "-"}`;
  const timelineNodes = useTimelineData(memoryVersions, runs);
  const selectedPullRequest = useMemo(
    () => pullRequests.find((pullRequest) => pullRequest.number === selectedPrNumber) ?? null,
    [pullRequests, selectedPrNumber]
  );

  async function loadBootstrap() {
    setLoadingBootstrap(true);
    try {
      const response = await fetch("/api/bootstrap");
      if (!response.ok) {
        throw new Error("Could not load bootstrap data");
      }

      const data = (await response.json()) as {
        activePack: WorkflowPack;
        memoryVersions: MemoryVersion[];
        runs: RunRecord[];
      };

      setPack(data.activePack);
      setMemoryVersions(data.memoryVersions);
      setCurrentMemoryId(data.memoryVersions.at(-1)?.id ?? null);
      setRuns(data.runs);
      setCurrentRun(data.runs.at(-1) ?? null);
    } catch (error) {
      dispatchUiState({
        type: "REPO_LOAD_ERROR",
        message: error instanceof Error ? error.message : "Unknown bootstrap error",
        retryable: true
      });
    } finally {
      setLoadingBootstrap(false);
    }
  }

  async function loadPullRequests(targetRepo: string) {
    dispatchUiState({ type: "REPO_LOAD_START" });
    setLoadingPrs(true);

    try {
      const response = await fetch(`/api/github/prs?repo=${encodeURIComponent(targetRepo)}`);

      if (!response.ok) {
        throw new Error("Failed to load pull requests");
      }

      const data = (await response.json()) as {
        pullRequests: GitHubPullRequest[];
      };

      setPullRequests(data.pullRequests);

      if (selectedPrNumber && !data.pullRequests.some((pullRequest) => pullRequest.number === selectedPrNumber)) {
        setSelectedPrNumber(null);
        setSelectedPrTitle("");
        setSelectedPrUrl("");
        setPrDiff("");
      }

      dispatchUiState({ type: "REPO_LOAD_SUCCESS" });
    } catch (error) {
      dispatchUiState({
        type: "REPO_LOAD_ERROR",
        message: error instanceof Error ? error.message : "Unknown GitHub error",
        retryable: true
      });
    } finally {
      setLoadingPrs(false);
    }
  }

  async function selectPullRequest(pullNumber: number) {
    setSelectedPrNumber(pullNumber);
    setLoadingDiff(true);
    dispatchUiState({ type: "PR_LOAD_START" });

    try {
      const response = await fetch(
        `/api/github/diff?repo=${encodeURIComponent(normalizeRepoInput(repo))}&pullNumber=${pullNumber}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch pull request diff");
      }

      const data = (await response.json()) as {
        pullNumber: number;
        title: string;
        url: string;
        diff: string;
      };

      setSelectedPrNumber(data.pullNumber);
      setSelectedPrTitle(data.title);
      setSelectedPrUrl(data.url);
      setPrDiff(data.diff);
      setDiffJumpAnchor(null);
      setActiveTab("findings");
      dispatchUiState({ type: "PR_LOAD_SUCCESS" });
    } catch (error) {
      dispatchUiState({
        type: "PR_LOAD_ERROR",
        message: error instanceof Error ? error.message : "Unknown pull request error",
        retryable: true
      });
    } finally {
      setLoadingDiff(false);
    }
  }

  function clearRunTimers() {
    for (const timer of runPhaseTimersRef.current) {
      clearTimeout(timer);
    }

    runPhaseTimersRef.current = [];
  }

  function cancelRun() {
    runAbortRef.current?.abort();
    runAbortRef.current = null;
    clearRunTimers();
    setRunning(false);
    dispatchUiState({ type: "RUN_CANCELLED" });
  }

  async function runAnalysis() {
    if (!pack || !currentMemory || !selectedPrUrl || !prDiff || running) {
      return;
    }

    setRunning(true);
    setActiveTab("findings");
    dispatchUiState({ type: "RUN_START" });

    const evaluatingTimer = setTimeout(() => {
      dispatchUiState({ type: "RUN_PHASE", phase: "evaluating" });
    }, 600);

    const formattingTimer = setTimeout(() => {
      dispatchUiState({ type: "RUN_PHASE", phase: "formatting" });
    }, 1_600);

    runPhaseTimersRef.current = [evaluatingTimer, formattingTimer];

    const controller = new AbortController();
    runAbortRef.current = controller;

    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          workflowPackId: pack.id,
          memoryVersionId: currentMemory.id,
          prUrl: selectedPrUrl,
          prTitle: selectedPrTitle,
          prDiff
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details ?? error.error ?? "Run failed");
      }

      const data = (await response.json()) as {
        run: RunRecord;
        result: RunResult;
      };

      setRuns((previous) => [...previous, data.run]);
      setCurrentRun(data.run);
      setCurrentResult(data.result);
      dispatchUiState({ type: "RUN_SUCCESS" });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        dispatchUiState({ type: "RUN_CANCELLED" });
      } else {
        dispatchUiState({
          type: "RUN_ERROR",
          message: error instanceof Error ? error.message : "Run failed",
          retryable: true
        });
      }
    } finally {
      clearRunTimers();
      runAbortRef.current = null;
      setRunning(false);
    }
  }

  async function proposeRule() {
    if (!pack || !currentMemory || !currentRun || !currentResult?.memory_suggestions?.[0]) {
      return;
    }

    setPromoting(true);
    try {
      const firstSuggestion = currentResult.memory_suggestions[0];
      const proposed = memoryFromSuggestion(currentMemory, firstSuggestion);

      const response = await fetch("/api/memory/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          workflowPackId: pack.id,
          sourceRunId: currentRun.id,
          approvedBy: userName,
          newContent: proposed.newContent,
          changeSummary: `Added ${proposed.section} section from run ${currentRun.id}`,
          addedRules: [
            {
              category: proposed.section,
              rules: firstSuggestion.content
                .split("\n")
                .map((line) => line.replace(/^-\s*/, "").trim())
                .filter(Boolean)
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error("Failed to propose rule");
      }

      const payload = (await response.json()) as { memoryVersion: MemoryVersion };
      setMemoryVersions((previous) => [...previous, payload.memoryVersion]);
      setCurrentMemoryId(payload.memoryVersion.id);
      setActiveTab("memory");
    } catch (error) {
      dispatchUiState({
        type: "RUN_ERROR",
        message: error instanceof Error ? error.message : "Rule proposal failed",
        retryable: true
      });
    } finally {
      setPromoting(false);
    }
  }

  function handleJumpToFinding(finding: Finding) {
    const diffFiles = extractDiffFileSummaries(prDiff);
    const anchor = mapFindingToDiffAnchor(finding, diffFiles);

    if (!anchor) {
      return;
    }

    setDiffJumpAnchor(anchor);
  }

  async function applyFix(finding: Finding, index: number) {
    if (!pack || !selectedPrNumber || !selectedPullRequest?.head.ref) {
      setApplyFixFeedback({
        index,
        type: "error",
        message: "Apply Fix unavailable: missing PR branch context."
      });
      return;
    }

    setApplyingFixIndex(index);
    setApplyFixFeedback(null);

    try {
      const response = await fetch("/api/codex/apply-fix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          workflowPackId: pack.id,
          repo: normalizeRepoInput(repo),
          pullNumber: selectedPrNumber,
          branch: selectedPullRequest.head.ref,
          finding
        })
      });

      const payload = (await response.json()) as {
        commitSha?: string;
        commitUrl?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Apply Fix failed");
      }

      const shortSha = payload.commitSha ? payload.commitSha.slice(0, 7) : "unknown";
      setApplyFixFeedback({
        index,
        type: "success",
        message: `Fix committed (${shortSha}). Diff refreshed.`,
        commitUrl: payload.commitUrl
      });

      await selectPullRequest(selectedPrNumber);
    } catch (error) {
      setApplyFixFeedback({
        index,
        type: "error",
        message: error instanceof Error ? error.message : "Apply Fix failed"
      });
    } finally {
      setApplyingFixIndex(null);
    }
  }

  function summaryFromHistoricalRun(run: RunRecord): string {
    const findings = run.parsed_findings.length;
    if (!findings) {
      return `Historical run for ${run.pr_title} completed with no findings.`;
    }

    return `Historical run for ${run.pr_title} completed with ${findings} finding${findings === 1 ? "" : "s"}.`;
  }

  function handleSelectTimelineNode(nodeId: string) {
    setSelectedTimelineNodeId(nodeId);
    const node = timelineNodes.find((candidate) => candidate.id === nodeId);
    if (!node) {
      return;
    }

    if (node.type === "memory_version" && node.memoryId) {
      setCurrentMemoryId(node.memoryId);
      setActiveTab("memory");
      return;
    }

    if (node.type === "run" && node.runId) {
      const run = runs.find((candidate) => candidate.id === node.runId);
      if (!run) {
        return;
      }

      setCurrentRun(run);
      setCurrentResult({
        summary: summaryFromHistoricalRun(run),
        findings: run.parsed_findings,
        memory_suggestions: run.memory_suggestions
      });
      setSelectedPrTitle(run.pr_title);
      setSelectedPrUrl(run.pr_url);
      setPrDiff(run.pr_diff);
      setDiffJumpAnchor(null);

      const pullNumber = Number.parseInt(run.pr_url.match(/\/pull\/(\d+)/)?.[1] ?? "", 10);
      setSelectedPrNumber(Number.isFinite(pullNumber) ? pullNumber : null);
      setActiveTab("findings");
    }
  }

  useEffect(() => {
    void loadBootstrap();
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const initializeSession = async () => {
      const { data } = await supabase.auth.getSession();
      const nextSession = (data.session as SessionLike | null) ?? null;
      setSession(nextSession);
      dispatchUiState({ type: "SESSION_CHANGED", signedIn: Boolean(nextSession) });
    };

    void initializeSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const typedSession = (nextSession as SessionLike | null) ?? null;
      setSession(typedSession);
      dispatchUiState({ type: "SESSION_CHANGED", signedIn: Boolean(typedSession) });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const normalizedRepo = normalizeRepoInput(repo);
    if (!shouldAutoloadRepo(normalizedRepo, session ? "session" : undefined)) {
      return;
    }

    const timer = setTimeout(() => {
      void loadPullRequests(normalizedRepo);
    }, REPO_AUTOLOAD_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [repo, session]);

  useEffect(() => {
    return () => {
      clearRunTimers();
      runAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!timelineNodes.length) {
      return;
    }

    if (!selectedTimelineNodeId || !timelineNodes.some((node) => node.id === selectedTimelineNodeId)) {
      setSelectedTimelineNodeId(timelineNodes.at(-1)?.id ?? null);
    }
  }, [timelineNodes, selectedTimelineNodeId]);

  return (
    <main className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4">
        <TopBar
          packName={pack?.name ?? "Workflow Pack"}
          repo={normalizeRepoInput(repo)}
          selectedPrLabel={selectedPrTitle || "No PR selected"}
          runLabel={runLabel}
          runHelper={runHelper}
          runDisabled={!canRun}
          session={session}
          userName={userName}
          onRun={() => {
            void runAnalysis();
          }}
          onSignOut={async () => {
            if (!supabase) return;
            await fetch("/api/auth/github-token", { method: "DELETE" });
            await supabase.auth.signOut();
          }}
          onSignIn={async () => {
            if (!supabase) return;
            await supabase.auth.signInWithOAuth({
              provider: "github",
              options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                scopes: GITHUB_OAUTH_SCOPES
              }
            });
          }}
        />

        <MemoryTimeline
          nodes={timelineNodes}
          selectedNodeId={selectedTimelineNodeId ?? undefined}
          onSelectNode={(node) => handleSelectTimelineNode(node.id)}
        />

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pull Request Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PrContextPanel
                repo={repo}
                onRepoChange={setRepo}
                repoValidationMessage={repoMessage}
                hasGithubAuth={Boolean(session)}
                pullRequests={pullRequests}
                loadingPrs={loadingPrs}
                loadingDiff={loadingDiff}
                selectedPrNumber={selectedPrNumber}
                selectedPrTitle={selectedPrTitle}
                selectedPrUrl={selectedPrUrl}
                onRefreshPullRequests={() => {
                  const normalizedRepo = normalizeRepoInput(repo);
                  if (!repoValidationMessage(normalizedRepo)) {
                    void loadPullRequests(normalizedRepo);
                  }
                }}
                onSelectPullRequest={(pullNumber) => {
                  void selectPullRequest(pullNumber);
                }}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">Diff preview</label>
                  <p className="text-xs text-[var(--text-muted)]">Jump from findings to exact lines</p>
                </div>

                <DiffPanel
                  diffText={prDiff}
                  loading={loadingDiff}
                  jumpAnchor={diffJumpAnchor}
                  onJumpHandled={() => setDiffJumpAnchor(null)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Review Engine</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultsPanel
                uiState={uiState}
                activeTab={activeTab}
                currentRun={currentRun}
                currentResult={currentResult}
                currentMemory={currentMemory}
                currentMemoryId={currentMemoryId}
                memoryVersions={memoryVersions}
                runs={runs}
                promoting={promoting}
                selectedPrUrl={selectedPrUrl}
                canApplyFix={Boolean(pack && selectedPrNumber && selectedPullRequest?.head.ref)}
                applyingFixIndex={applyingFixIndex}
                applyFixFeedback={applyFixFeedback}
                onSelectTab={setActiveTab}
                onChangeMemory={setCurrentMemoryId}
                onProposeRule={() => {
                  void proposeRule();
                }}
                onJumpToFinding={handleJumpToFinding}
                onApplyFix={(finding, index) => {
                  void applyFix(finding, index);
                }}
                onCancelRun={cancelRun}
                onRecoverError={() => dispatchUiState({ type: "CLEAR_ERROR" })}
              />
            </CardContent>
          </Card>
        </section>

        <MorePacksDrawer />
      </div>
    </main>
  );
}
