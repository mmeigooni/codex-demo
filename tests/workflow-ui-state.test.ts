import { describe, expect, test } from "vitest";

import { canRunAnalysis, initialWorkflowUiState, reduceWorkflowUiState } from "@/lib/workflow-ui-state";

describe("workflow ui state", () => {
  test("moves through repository and PR loading states", () => {
    let state = reduceWorkflowUiState(initialWorkflowUiState, { type: "SESSION_CHANGED", signedIn: true });
    expect(state.status).toBe("ready");

    state = reduceWorkflowUiState(state, { type: "REPO_LOAD_START" });
    expect(state.status).toBe("repo_loading");

    state = reduceWorkflowUiState(state, { type: "REPO_LOAD_SUCCESS" });
    expect(state.status).toBe("ready");

    state = reduceWorkflowUiState(state, { type: "PR_LOAD_START" });
    expect(state.status).toBe("pr_loading");

    state = reduceWorkflowUiState(state, { type: "PR_LOAD_SUCCESS" });
    expect(state.status).toBe("ready");
  });

  test("tracks running phases and completion", () => {
    let state = reduceWorkflowUiState({ status: "ready" }, { type: "RUN_START" });
    expect(state).toEqual({ status: "running", runPhase: "assembling" });

    state = reduceWorkflowUiState(state, { type: "RUN_PHASE", phase: "evaluating" });
    expect(state).toEqual({ status: "running", runPhase: "evaluating" });

    state = reduceWorkflowUiState(state, { type: "RUN_SUCCESS" });
    expect(state.status).toBe("done");
  });

  test("can cancel run and recover from errors", () => {
    let state = reduceWorkflowUiState({ status: "running", runPhase: "evaluating" }, { type: "RUN_CANCELLED" });
    expect(state.status).toBe("ready");

    state = reduceWorkflowUiState(state, { type: "RUN_ERROR", message: "boom" });
    expect(state.status).toBe("error");

    state = reduceWorkflowUiState(state, { type: "CLEAR_ERROR" });
    expect(state.status).toBe("ready");
  });

  test("run button availability depends on state + inputs", () => {
    expect(canRunAnalysis({ status: "ready" }, true)).toBe(true);
    expect(canRunAnalysis({ status: "done" }, true)).toBe(true);
    expect(canRunAnalysis({ status: "running", runPhase: "formatting" }, true)).toBe(false);
    expect(canRunAnalysis({ status: "ready" }, false)).toBe(false);
  });
});
