import type { DemoViewMode, RunPhase, WalkthroughStep, WorkflowUiState } from "@/lib/types";

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
  | { type: "CLEAR_ERROR" }
  | { type: "DEMO_MODE_TOGGLED"; viewMode: DemoViewMode }
  | { type: "ROUND_SELECTED"; roundKey: string }
  | { type: "STEP_ADVANCED"; step: WalkthroughStep }
  | { type: "APPLY_FIX_CONSUMED" }
  | { type: "APPLY_FIX_RESET" };

export const initialWorkflowUiState: WorkflowUiState = {
  status: "signed_out",
  viewMode: "demo",
  walkthroughStep: "review",
  roundKey: null,
  applyFixUsed: false
};

export function reduceWorkflowUiState(state: WorkflowUiState, event: WorkflowUiEvent): WorkflowUiState {
  switch (event.type) {
    case "SESSION_CHANGED":
      return {
        ...state,
        status: event.signedIn ? "ready" : "signed_out"
      };
    case "REPO_LOAD_START":
      return { ...state, status: "repo_loading" };
    case "REPO_LOAD_SUCCESS":
      return { ...state, status: "ready" };
    case "REPO_LOAD_ERROR":
      return {
        ...state,
        status: "error",
        message: event.message,
        retryable: event.retryable ?? true
      };
    case "PR_LOAD_START":
      return { ...state, status: "pr_loading" };
    case "PR_LOAD_SUCCESS":
      return { ...state, status: "ready" };
    case "PR_LOAD_ERROR":
      return {
        ...state,
        status: "error",
        message: event.message,
        retryable: event.retryable ?? true
      };
    case "RUN_START":
      return { ...state, status: "running", runPhase: "assembling" };
    case "RUN_PHASE":
      return { ...state, status: "running", runPhase: event.phase };
    case "RUN_SUCCESS":
      return { ...state, status: "done" };
    case "RUN_CANCELLED":
      return { ...state, status: "ready" };
    case "RUN_ERROR":
      return {
        ...state,
        status: "error",
        message: event.message,
        retryable: event.retryable ?? true
      };
    case "CLEAR_ERROR":
      return state.status === "error"
        ? { ...state, status: "ready", message: undefined, retryable: undefined }
        : state;
    case "DEMO_MODE_TOGGLED":
      return {
        ...state,
        viewMode: event.viewMode
      };
    case "ROUND_SELECTED":
      return {
        ...state,
        roundKey: event.roundKey,
        walkthroughStep: "review",
        applyFixUsed: false
      };
    case "STEP_ADVANCED":
      return {
        ...state,
        walkthroughStep: event.step
      };
    case "APPLY_FIX_CONSUMED":
      return {
        ...state,
        applyFixUsed: true
      };
    case "APPLY_FIX_RESET":
      return {
        ...state,
        applyFixUsed: false
      };
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
