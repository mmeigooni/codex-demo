import { describe, expect, test } from "vitest";

import { deriveBrainStoryState } from "@/lib/brain-story-state";
import type { Finding, RuntimePhaseState, WorkflowStatus } from "@/lib/types";

function makeInput(overrides: Partial<{
  status: WorkflowStatus;
  runtimePhase: RuntimePhaseState;
  findings: Finding[];
  hasMemorySuggestion: boolean;
  canApply: boolean;
  applyFixUsed: boolean;
}> = {}) {
  return {
    status: "ready" as WorkflowStatus,
    runtimePhase: {
      phases: ["review"],
      current: "review",
      completed: []
    } as RuntimePhaseState,
    findings: [] as Finding[],
    hasMemorySuggestion: false,
    canApply: false,
    applyFixUsed: false,
    ...overrides
  };
}

describe("deriveBrainStoryState", () => {
  test("returns low-salience signal scan state when idle", () => {
    const state = deriveBrainStoryState(makeInput());

    expect(state.phase).toBe("scan");
    expect(state.act).toBe("signal");
    expect(state.salience).toBe("low");
    expect(state.mode).toBe("off");
  });

  test("maps running status to detect/conflict", () => {
    const state = deriveBrainStoryState(
      makeInput({
        status: "running"
      })
    );

    expect(state.phase).toBe("detect");
    expect(state.act).toBe("conflict");
  });

  test("maps recommend phase to index/learning", () => {
    const state = deriveBrainStoryState(
      makeInput({
        runtimePhase: {
          phases: ["review", "recommend"],
          current: "recommend",
          completed: ["review"]
        },
        hasMemorySuggestion: true
      })
    );

    expect(state.phase).toBe("index");
    expect(state.act).toBe("learning");
    expect(state.hasSuggestions).toBe(true);
  });

  test("maps apply phase to consolidate when apply has not been consumed", () => {
    const state = deriveBrainStoryState(
      makeInput({
        runtimePhase: {
          phases: ["review", "apply"],
          current: "apply",
          completed: ["review"]
        },
        canApply: true,
        applyFixUsed: false,
        findings: [
          {
            severity: "warning",
            title: "Retry without backoff",
            file: "src/retry.ts",
            line: 18,
            description: "Immediate retry causes bursts.",
            memory_reference: null,
            suggested_fix: null
          }
        ]
      })
    );

    expect(state.phase).toBe("consolidate");
    expect(state.act).toBe("learning");
  });

  test("applies high salience for critical findings", () => {
    const state = deriveBrainStoryState(
      makeInput({
        findings: [
          {
            severity: "critical",
            title: "PII in logs",
            file: "src/logger.ts",
            line: 42,
            description: "Sensitive data is logged.",
            memory_reference: "rule_002",
            suggested_fix: null
          }
        ]
      })
    );

    expect(state.salience).toBe("high");
    expect(state.cueCount).toBe(1);
  });

  test("is deterministic for identical inputs", () => {
    const input = makeInput({
      hasMemorySuggestion: true,
      canApply: true,
      findings: [
        {
          severity: "warning",
          title: "Missing backoff",
          file: "src/checkout/retry.ts",
          line: 12,
          description: "Retries should include backoff.",
          memory_reference: "rule_001",
          suggested_fix: null
        }
      ]
    });

    expect(deriveBrainStoryState(input)).toEqual(deriveBrainStoryState(input));
  });
});
