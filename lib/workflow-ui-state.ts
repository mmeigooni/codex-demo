import type { RunPhase, WorkflowUiState } from "@/lib/types";

export type WorkflowUiEvent =
  | { type: "SESSION_CHANGED"; signedIn: boolean }
  | { type: "REPO_LOAD_START" }
  | { type: "REPO_LOAD_SUCCESS" }
  | { type: "REPO_LOAD_ERROR"; message: string; retryable?: boolean }
  | { type: "PR_LOAD_START" }
  | { type: "PR_LOAD_SUCCESS" }
  | { type: "PR_LOAD_ERROR"; message: string; retryable?: boolean }
  | { type: "RUN_START" }
  | { type: "RUN_PHASE"; phase: RunPhase }
  | { type: "RUN_SUCCESS" }
  | { type: "RUN_CANCELLED" }
  | { type: "RUN_ERROR"; message: string; retryable?: boolean }
  | { type: "CLEAR_ERROR" };

export const initialWorkflowUiState: WorkflowUiState = {
  status: "signed_out"
};

export function reduceWorkflowUiState(state: WorkflowUiState, event: WorkflowUiEvent): WorkflowUiState {
  switch (event.type) {
    case "SESSION_CHANGED":
      return event.signedIn ? { status: "ready" } : { status: "signed_out" };
    case "REPO_LOAD_START":
      return { status: "repo_loading" };
    case "REPO_LOAD_SUCCESS":
      return { status: "ready" };
    case "REPO_LOAD_ERROR":
      return {
        status: "error",
        message: event.message,
        retryable: event.retryable ?? true
      };
    case "PR_LOAD_START":
      return { status: "pr_loading" };
    case "PR_LOAD_SUCCESS":
      return { status: "ready" };
    case "PR_LOAD_ERROR":
      return {
        status: "error",
        message: event.message,
        retryable: event.retryable ?? true
      };
    case "RUN_START":
      return { status: "running", runPhase: "assembling" };
    case "RUN_PHASE":
      return { status: "running", runPhase: event.phase };
    case "RUN_SUCCESS":
      return { status: "done" };
    case "RUN_CANCELLED":
      return { status: "ready" };
    case "RUN_ERROR":
      return {
        status: "error",
        message: event.message,
        retryable: event.retryable ?? true
      };
    case "CLEAR_ERROR":
      return state.status === "error" ? { status: "ready" } : state;
    default:
      return state;
  }
}

export function canRunAnalysis(state: WorkflowUiState, hasRequiredInputs: boolean): boolean {
  if (!hasRequiredInputs) {
    return false;
  }

  return state.status === "ready" || state.status === "done";
}
