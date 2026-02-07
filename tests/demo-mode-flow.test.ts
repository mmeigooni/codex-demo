import { describe, expect, test } from "vitest";

import { getRoundByKey } from "@/lib/demo-script";
import { canUseApplyFix } from "@/lib/round-guards";
import { reduceWorkflowUiState } from "@/lib/workflow-ui-state";

describe("demo mode flow integration", () => {
  test("A-2 and A-3 script expectations preserve narrative arc", () => {
    const a2 = getRoundByKey("A-2");
    const a3 = getRoundByKey("A-3");

    expect(a2?.expectedRecommendation).toBe("block");
    expect(a2?.allowApplyFix).toBe(false);

    expect(a3?.expectedRecommendation).toBe("block");
    expect(a3?.allowApplyFix).toBe(true);
    expect(a3?.memoryVersionBefore).toBeGreaterThan(a2?.memoryVersionBefore ?? 0);
  });

  test("state + guard sequence reflects one successful apply-fix in demo round", () => {
    let state = reduceWorkflowUiState(
      { status: "ready", viewMode: "demo", walkthroughStep: "review", roundKey: null, applyFixUsed: false },
      { type: "ROUND_SELECTED", roundKey: "A-3" }
    );

    const beforeCommitAllowed = canUseApplyFix({
      viewMode: state.viewMode ?? "demo",
      allowApplyFixForRound: true,
      applyFixUsedInRound: state.applyFixUsed ?? false,
      hasBackendCapability: true
    });
    expect(beforeCommitAllowed).toBe(true);

    state = reduceWorkflowUiState(state, { type: "APPLY_FIX_CONSUMED" });

    const afterCommitAllowed = canUseApplyFix({
      viewMode: state.viewMode ?? "demo",
      allowApplyFixForRound: true,
      applyFixUsedInRound: state.applyFixUsed ?? false,
      hasBackendCapability: true
    });
    expect(afterCommitAllowed).toBe(false);
  });
});
