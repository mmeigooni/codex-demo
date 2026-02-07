export type Severity = "critical" | "warning" | "info";

export type MergeRecommendation = "pass" | "warnings" | "block";

export type ResponseSource = "live" | "fallback";

export interface Finding {
  severity: Severity;
  title: string;
  file: string;
  line: number;
  description: string;
  memory_reference: string | null;
  suggested_fix: string | null;
}

export interface MemorySuggestion {
  category: string;
  content: string;
  rationale: string;
}

export interface RunResult {
  summary: string;
  findings: Finding[];
  memory_suggestions: MemorySuggestion[];
}

export interface WorkflowPack {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  scope_globs: string[];
  output_schema: Record<string, unknown>;
  status: "active" | "coming_soon";
}

export interface MemoryVersion {
  id: string;
  workflow_pack_id: string;
  version: number;
  content: string;
  change_summary: string;
  change_details: AddedRuleGroup[];
  approved_by: string;
  created_at: string;
}

export interface AddedRuleGroup {
  category: string;
  rules: string[];
}

export interface RunRecord {
  id: string;
  workflow_pack_id: string;
  memory_version_id: string;
  pr_url: string;
  pr_title: string;
  pr_diff: string;
  assembled_prompt: string;
  parsed_findings: Finding[];
  memory_suggestions: MemorySuggestion[];
  merge_recommendation: MergeRecommendation;
  prompt_template_version: string;
  duration_ms: number;
  source: ResponseSource;
  error_details: string | null;
  created_at: string;
}

export interface PreparedDiff {
  diff: string;
  truncated: boolean;
  originalFiles: number;
  includedFiles: number;
}

export type RunPhase = "assembling" | "evaluating" | "formatting";

export type DemoViewMode = "demo" | "advanced";

export type WalkthroughStep = "review" | "teach" | "prove";

export interface DemoRoundDefinition {
  key: string;
  pass: "A" | "B";
  round: number;
  objective: string;
  prNumber: number;
  memoryVersionBefore: number;
  expectedRecommendation: MergeRecommendation;
  allowApplyFix: boolean;
}

export interface DemoRoundState {
  roundKey: string | null;
  walkthroughStep: WalkthroughStep;
  applyFixUsed: boolean;
}

export type WorkflowStatus =
  | "signed_out"
  | "repo_loading"
  | "pr_loading"
  | "ready"
  | "running"
  | "done"
  | "error";

export interface WorkflowUiState {
  status: WorkflowStatus;
  runPhase?: RunPhase;
  message?: string;
  retryable?: boolean;
  viewMode?: DemoViewMode;
  walkthroughStep?: WalkthroughStep;
  roundKey?: string | null;
  applyFixUsed?: boolean;
}

export type RightPanelTab = "findings" | "memory" | "run_details";

export interface GitHubPullRequest {
  number: number;
  title: string;
  html_url: string;
  updated_at: string;
  body?: string | null;
  user: {
    login: string;
    avatar_url: string;
  };
  diff_url: string;
  additions: number;
  deletions: number;
  changed_files: number;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
  };
}

export interface DiffFileSummary {
  path: string;
  additions: number;
  deletions: number;
}

export interface DiffLineAnchor {
  filePath: string;
  line: number;
  anchorId: string;
}

export interface RunRequestBody {
  workflowPackId: string;
  memoryVersionId: string;
  prUrl: string;
  prTitle: string;
  prDiff: string;
}

export interface PromoteMemoryBody {
  workflowPackId: string;
  sourceRunId: string;
  approvedBy: string;
  newContent: string;
  changeSummary: string;
  addedRules: AddedRuleGroup[];
}

export interface TimelineNode {
  id: string;
  type: "memory_version" | "run";
  date: string;
  memoryId?: string;
  memoryVersion?: number;
  ruleCount?: number;
  addedRules?: AddedRuleGroup[];
  approvedBy?: string;
  runId?: string;
  prTitle?: string;
  verdict?: MergeRecommendation;
  findingCount?: number;
  memoryVersionUsed?: number;
  triggeredPromotion?: boolean;
}
