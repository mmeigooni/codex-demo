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

export type PanelState =
  | { view: "memory" }
  | { view: "assembling"; checklist: string[] }
  | { view: "results"; runId: string }
  | { view: "compare"; runIds: [string, string] }
  | { view: "error"; message: string; retryable: boolean };

export interface GitHubPullRequest {
  number: number;
  title: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  diff_url: string;
  additions: number;
  deletions: number;
  changed_files: number;
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
