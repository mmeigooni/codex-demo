import type {
  GitHubPullRequest,
  MemoryVersion,
  ResponseSource,
  RunRecord,
  RunResult,
  WorkflowPack
} from "@/lib/types";

export interface GitHubPrsResponse {
  repository: string;
  pullRequests: GitHubPullRequest[];
}

export interface GitHubDiffResponse {
  repository: string;
  pullNumber: number;
  title: string;
  url: string;
  diff: string;
}

export interface RunApiResponse {
  run: RunRecord;
  result: RunResult;
  source: ResponseSource;
  validation: "valid" | "fallback";
}

export interface PromoteMemoryResponse {
  memoryVersion: MemoryVersion;
}

export interface DashboardBootstrapResponse {
  activePack: WorkflowPack;
  memoryVersions: MemoryVersion[];
  runs: RunRecord[];
}
