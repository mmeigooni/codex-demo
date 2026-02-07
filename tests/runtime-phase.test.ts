import { describe, expect, test } from "vitest";

import { deriveRuntimePhaseState } from "@/lib/runtime-phase";

describe("deriveRuntimePhaseState", () => {
  test("returns review-only when no findings exist", () => {
    const state = deriveRuntimePhaseState({
      status: "done",
      findingsCount: 0,
      hasMemorySuggestion: false,
      canApply: false,
      recommendationCompleted: false
    });

    expect(state.phases).toEqual(["review"]);
    expect(state.current).toBe("review");
  });

  test("returns review/apply when findings exist without recommendation", () => {
    const state = deriveRuntimePhaseState({
      status: "done",
      findingsCount: 2,
      hasMemorySuggestion: false,
      canApply: true,
      recommendationCompleted: false
    });

    expect(state.phases).toEqual(["review", "apply"]);
    expect(state.current).toBe("apply");
  });

  test("returns three phases and starts at recommend when recommendation not completed", () => {
    const state = deriveRuntimePhaseState({
      status: "done",
      findingsCount: 3,
      hasMemorySuggestion: true,
      canApply: true,
      recommendationCompleted: false
    });

    expect(state.phases).toEqual(["review", "recommend", "apply"]);
    expect(state.current).toBe("recommend");
    expect(state.completed).toEqual(["review"]);
  });

  test("advances to apply when recommendation is completed", () => {
    const state = deriveRuntimePhaseState({
      status: "done",
      findingsCount: 1,
      hasMemorySuggestion: true,
      canApply: true,
      recommendationCompleted: true
    });

    expect(state.current).toBe("apply");
    expect(state.completed).toEqual(["review", "recommend"]);
  });
});
