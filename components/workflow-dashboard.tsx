"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { findNewFindings } from "@/lib/compare";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type {
  Finding,
  MemorySuggestion,
  MemoryVersion,
  PanelState,
  RunRecord,
  RunResult,
  WorkflowPack
} from "@/lib/types";

const DEFAULT_REPO = "mo-demo/ecommerce-checkout";

type SessionLike = {
  user: {
    email?: string;
    user_metadata?: {
      avatar_url?: string;
      user_name?: string;
      full_name?: string;
    };
  };
  provider_token?: string;
};

type PanelAction =
  | { type: "SHOW_MEMORY" }
  | { type: "SHOW_ASSEMBLING"; checklist: string[] }
  | { type: "SHOW_RESULTS"; runId: string }
  | { type: "SHOW_COMPARE"; runIds: [string, string] }
  | { type: "SHOW_ERROR"; message: string; retryable: boolean };

function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case "SHOW_MEMORY":
      return { view: "memory" };
    case "SHOW_ASSEMBLING":
      return { view: "assembling", checklist: action.checklist };
    case "SHOW_RESULTS":
      return { view: "results", runId: action.runId };
    case "SHOW_COMPARE":
      return { view: "compare", runIds: action.runIds };
    case "SHOW_ERROR":
      return { view: "error", message: action.message, retryable: action.retryable };
    default:
      return state;
  }
}

function severityVariant(severity: Finding["severity"]): "danger" | "warning" | "info" {
  if (severity === "critical") return "danger";
  if (severity === "warning") return "warning";
  return "info";
}

function mergeVariant(merge: RunRecord["merge_recommendation"]): "success" | "warning" | "danger" {
  if (merge === "pass") return "success";
  if (merge === "warnings") return "warning";
  return "danger";
}

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

  const [panelState, dispatch] = useReducer(panelReducer, { view: "memory" } as PanelState);
  const [session, setSession] = useState<SessionLike | null>(null);

  const [repo, setRepo] = useState(DEFAULT_REPO);
  const [pack, setPack] = useState<WorkflowPack | null>(null);
  const [memoryVersions, setMemoryVersions] = useState<MemoryVersion[]>([]);
  const [currentMemoryId, setCurrentMemoryId] = useState<string | null>(null);

  const [pullRequests, setPullRequests] = useState<Array<Record<string, unknown>>>([]);
  const [selectedPrNumber, setSelectedPrNumber] = useState<number | null>(null);
  const [selectedPrTitle, setSelectedPrTitle] = useState("");
  const [selectedPrUrl, setSelectedPrUrl] = useState("");
  const [prDiff, setPrDiff] = useState("");

  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [currentRun, setCurrentRun] = useState<RunRecord | null>(null);
  const [currentResult, setCurrentResult] = useState<RunResult | null>(null);

  const [loadingBootstrap, setLoadingBootstrap] = useState(true);
  const [loadingPrs, setLoadingPrs] = useState(false);
  const [running, setRunning] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const currentMemory = useMemo(
    () => memoryVersions.find((memory) => memory.id === currentMemoryId) ?? memoryVersions.at(-1) ?? null,
    [memoryVersions, currentMemoryId]
  );

  const userName =
    session?.user.user_metadata?.full_name ??
    session?.user.user_metadata?.user_name ??
    session?.user.email ??
    "Anonymous";

  const githubToken = session?.provider_token;

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
      dispatch({ type: "SHOW_MEMORY" });
    } catch (error) {
      dispatch({
        type: "SHOW_ERROR",
        message: error instanceof Error ? error.message : "Unknown bootstrap error",
        retryable: true
      });
    } finally {
      setLoadingBootstrap(false);
    }
  }

  async function loadPullRequests() {
    if (!githubToken) {
      return;
    }

    setLoadingPrs(true);
    try {
      const response = await fetch(`/api/github/prs?repo=${encodeURIComponent(repo)}`, {
        headers: {
          "x-github-token": githubToken
        }
      });

      if (!response.ok) {
        throw new Error("Failed to load pull requests");
      }

      const data = (await response.json()) as {
        pullRequests: Array<Record<string, unknown>>;
      };

      setPullRequests(data.pullRequests);
    } catch (error) {
      dispatch({
        type: "SHOW_ERROR",
        message: error instanceof Error ? error.message : "Unknown GitHub error",
        retryable: true
      });
    } finally {
      setLoadingPrs(false);
    }
  }

  async function selectPullRequest(pullNumber: number) {
    if (!githubToken) {
      return;
    }

    const response = await fetch(
      `/api/github/diff?repo=${encodeURIComponent(repo)}&pullNumber=${pullNumber}`,
      {
        headers: {
          "x-github-token": githubToken
        }
      }
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
  }

  async function runAnalysis() {
    if (!pack || !currentMemory || !selectedPrUrl || !prDiff) {
      return;
    }

    setRunning(true);
    setCurrentResult(null);
    dispatch({
      type: "SHOW_ASSEMBLING",
      checklist: [
        `Workflow Definition (${pack.name})`,
        `Team Memory (v${currentMemory.version})`,
        `PR Diff (${selectedPrTitle})`
      ]
    });

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
        })
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
      dispatch({ type: "SHOW_RESULTS", runId: data.run.id });
    } catch (error) {
      dispatch({
        type: "SHOW_ERROR",
        message: error instanceof Error ? error.message : "Run failed",
        retryable: true
      });
    } finally {
      setRunning(false);
    }
  }

  async function promoteSuggestion() {
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
        throw new Error("Failed to promote memory");
      }

      const payload = (await response.json()) as { memoryVersion: MemoryVersion };
      setMemoryVersions((previous) => [...previous, payload.memoryVersion]);
      setCurrentMemoryId(payload.memoryVersion.id);
      dispatch({ type: "SHOW_MEMORY" });
    } catch (error) {
      dispatch({
        type: "SHOW_ERROR",
        message: error instanceof Error ? error.message : "Promotion failed",
        retryable: true
      });
    } finally {
      setPromoting(false);
    }
  }

  function showCompare() {
    if (runs.length < 2) {
      return;
    }

    const lastTwo = runs.slice(-2);
    dispatch({ type: "SHOW_COMPARE", runIds: [lastTwo[0].id, lastTwo[1].id] });
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
      setSession((data.session as SessionLike | null) ?? null);
    };

    void initializeSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession((nextSession as SessionLike | null) ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const runById = useMemo(() => new Map(runs.map((run) => [run.id, run])), [runs]);

  const compareRuns =
    panelState.view === "compare"
      ? [runById.get(panelState.runIds[0]), runById.get(panelState.runIds[1])]
      : [undefined, undefined];

  const compareNewFindings =
    compareRuns[0] && compareRuns[1]
      ? findNewFindings(compareRuns[0].parsed_findings, compareRuns[1].parsed_findings)
      : [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50 px-6 py-6">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Workflow Packs</h1>
            <p className="text-sm text-slate-600">Checkout Safety Review Demo</p>
          </div>

          <div className="flex items-center gap-2">
            {session ? (
              <>
                {session.user.user_metadata?.avatar_url ? (
                  <img
                    src={session.user.user_metadata.avatar_url}
                    alt="User avatar"
                    className="h-8 w-8 rounded-full border border-slate-200"
                  />
                ) : null}
                <span className="text-sm text-slate-700">{userName}</span>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    if (!supabase) return;
                    await supabase.auth.signOut();
                  }}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                disabled={!supabase}
                onClick={async () => {
                  if (!supabase) return;
                  await supabase.auth.signInWithOAuth({
                    provider: "github",
                    options: {
                      redirectTo: `${window.location.origin}/auth/callback`,
                      scopes: "repo read:user"
                    }
                  });
                }}
              >
                {supabase ? "Sign in with GitHub" : "Supabase env missing"}
              </Button>
            )}
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="min-h-[620px]">
            <CardHeader>
              <CardTitle>Pull Request Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="text-xs font-medium uppercase text-slate-500">Repository</label>
              <div className="flex gap-2">
                <input
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={repo}
                  onChange={(event) => setRepo(event.target.value)}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    void loadPullRequests();
                  }}
                  disabled={!githubToken || loadingPrs}
                >
                  {loadingPrs ? "Loading..." : "Load PRs"}
                </Button>
              </div>

              <label className="text-xs font-medium uppercase text-slate-500">Open Pull Requests</label>
              <select
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={selectedPrNumber ?? ""}
                onChange={(event) => {
                  const pullNumber = Number.parseInt(event.target.value, 10);
                  if (!Number.isNaN(pullNumber)) {
                    void selectPullRequest(pullNumber);
                  }
                }}
                disabled={!pullRequests.length}
              >
                <option value="">Select a pull request</option>
                {pullRequests.map((pr) => (
                  <option key={String(pr.number)} value={String(pr.number)}>
                    {String(pr.number)} - {String(pr.title)}
                  </option>
                ))}
              </select>

              {selectedPrTitle ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="font-medium">{selectedPrTitle}</p>
                  <a className="text-brand-700 underline" href={selectedPrUrl} target="_blank" rel="noreferrer">
                    Open on GitHub
                  </a>
                </div>
              ) : null}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium uppercase text-slate-500">Diff Preview</label>
                  <Button
                    variant="default"
                    onClick={() => {
                      void runAnalysis();
                    }}
                    disabled={!pack || !currentMemory || !selectedPrUrl || !prDiff || running || loadingBootstrap}
                  >
                    {running ? "Running..." : "Run Analysis"}
                  </Button>
                </div>
                <pre className="h-[340px] overflow-auto rounded-md border border-slate-200 bg-slate-950 p-3 text-xs text-emerald-200">
                  {prDiff || "Load a pull request to see diff."}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-[620px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Review Engine</CardTitle>
                {currentMemory ? <Badge variant="info">Memory v{currentMemory.version}</Badge> : null}
              </div>
            </CardHeader>
            <CardContent>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                {panelState.view === "memory" && currentMemory ? (
                  <section className="space-y-3">
                    <p className="text-sm text-slate-600">Current team memory used for review runs.</p>
                    <pre className="h-[410px] overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
                      {currentMemory.content}
                    </pre>
                  </section>
                ) : null}

                {panelState.view === "assembling" ? (
                  <section className="space-y-4">
                    <p className="text-sm font-medium text-slate-800">Assembling Context...</p>
                    <ul className="space-y-2">
                      {panelState.checklist.map((entry, index) => (
                        <motion.li
                          key={entry}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.18 }}
                          className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                        >
                          <span>✅</span>
                          <span>{entry}</span>
                        </motion.li>
                      ))}
                    </ul>
                    <p className="text-xs text-slate-500">Sending context to Codex...</p>
                  </section>
                ) : null}

                {panelState.view === "results" && currentRun && currentResult ? (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-700">{currentResult.summary}</p>
                      <Badge variant={mergeVariant(currentRun.merge_recommendation)}>
                        {currentRun.merge_recommendation.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="max-h-[330px] space-y-2 overflow-auto pr-1">
                      {currentResult.findings.map((finding, index) => (
                        <div key={`${finding.file}-${index}`} className="rounded-md border border-slate-200 p-3">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-900">{finding.title}</p>
                            <Badge variant={severityVariant(finding.severity)}>{finding.severity}</Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            {finding.file}:{finding.line}
                          </p>
                          <p className="mt-1 text-sm text-slate-700">{finding.description}</p>
                          {finding.memory_reference ? (
                            <p className="mt-1 text-xs text-slate-500">Memory: {finding.memory_reference}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    {currentResult.memory_suggestions[0] ? (
                      <div className="rounded-md border border-brand-200 bg-brand-50 p-3">
                        <p className="text-sm font-medium text-brand-900">Memory suggestion</p>
                        <p className="text-xs text-brand-800">{currentResult.memory_suggestions[0].content}</p>
                        <Button
                          className="mt-2"
                          onClick={() => {
                            void promoteSuggestion();
                          }}
                          disabled={promoting}
                        >
                          {promoting ? "Promoting..." : "Promote to Memory"}
                        </Button>
                      </div>
                    ) : null}

                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={showCompare} disabled={runs.length < 2}>
                        Compare Runs
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => dispatch({ type: "SHOW_MEMORY" })}
                      >
                        View Memory
                      </Button>
                    </div>
                  </section>
                ) : null}

                {panelState.view === "compare" ? (
                  <section className="space-y-3">
                    <p className="text-sm font-medium text-slate-800">Compare Runs</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {compareRuns.map((run, index) => (
                        <div key={run?.id ?? index} className="rounded-md border border-slate-200 p-3">
                          <p className="text-sm font-semibold text-slate-900">Run {index + 1}</p>
                          <p className="text-xs text-slate-500">{run?.id ?? "N/A"}</p>
                          <div className="mt-2 space-y-2">
                            {run?.parsed_findings.map((finding) => {
                              const isNew =
                                index === 1 &&
                                compareNewFindings.some(
                                  (candidate) =>
                                    candidate.file === finding.file && candidate.title === finding.title
                                );

                              return (
                                <div key={`${finding.file}-${finding.title}`} className="rounded-md bg-slate-50 p-2">
                                  <p className="text-xs font-medium text-slate-800">{finding.title}</p>
                                  {isNew ? <Badge variant="info">NEW</Badge> : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button variant="ghost" onClick={() => dispatch({ type: "SHOW_RESULTS", runId: currentRun?.id ?? "" })}>
                      Back to Results
                    </Button>
                  </section>
                ) : null}

                {panelState.view === "error" ? (
                  <section className="space-y-3 rounded-md border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-800">Analysis failed</p>
                    <p className="text-sm text-red-700">{panelState.message}</p>
                    {panelState.retryable ? (
                      <Button
                        variant="danger"
                        onClick={() => {
                          dispatch({ type: "SHOW_MEMORY" });
                        }}
                      >
                        Recover
                      </Button>
                    ) : null}
                  </section>
                ) : null}
              </motion.div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {["Dependency Governance Pack", "CI Incident Triage Pack", "Checkout Test Repair Pack"].map((name) => (
            <Card key={name}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{name}</p>
                  <p className="text-xs text-slate-500">Coming Soon</p>
                </div>
                <Badge variant="neutral">Planned</Badge>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
