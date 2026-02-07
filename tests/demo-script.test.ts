import { describe, expect, test } from "vitest";

import { DEMO_SCRIPT_ROUNDS, PASS_A_ROUNDS, PASS_B_ROUNDS, getRoundByKey, initialRoundKey } from "@/lib/demo-script";
import { canUseApplyFix } from "@/lib/round-guards";
import { createRehearsalDraft, formatRehearsalDraftMarkdown } from "@/lib/rehearsal-log";
import { initialWorkflowUiState, reduceWorkflowUiState } from "@/lib/workflow-ui-state";

describe("demo script contracts", () => {
  test("exports expected pass A and pass B round counts", () => {
    expect(PASS_A_ROUNDS).toHaveLength(3);
    expect(PASS_B_ROUNDS).toHaveLength(5);
    expect(DEMO_SCRIPT_ROUNDS).toHaveLength(8);
  });

  test("round keys are unique and initial round is resolvable", () => {
    const keys = DEMO_SCRIPT_ROUNDS.map((round) => round.key);
    expect(new Set(keys).size).toBe(keys.length);

    const key = initialRoundKey();
    expect(getRoundByKey(key)?.key).toBe(key);
  });
});

describe("walkthrough reducer + guard behavior", () => {
  test("selecting a round resets step and apply-fix usage", () => {
    let state = reduceWorkflowUiState(initialWorkflowUiState, { type: "ROUND_SELECTED", roundKey: "A-3" });
    expect(state.roundKey).toBe("A-3");
    expect(state.walkthroughStep).toBe("review");
    expect(state.applyFixUsed).toBe(false);

    state = reduceWorkflowUiState(state, { type: "APPLY_FIX_CONSUMED" });
    expect(state.applyFixUsed).toBe(true);

    state = reduceWorkflowUiState(state, { type: "ROUND_SELECTED", roundKey: "B-1" });
    expect(state.applyFixUsed).toBe(false);
    expect(state.walkthroughStep).toBe("review");
  });

  test("apply-fix gate enforces once-per-round only in demo mode", () => {
    expect(
      canUseApplyFix({
        viewMode: "demo",
        allowApplyFixForRound: true,
        applyFixUsedInRound: false,
        hasBackendCapability: true
      })
    ).toBe(true);

    expect(
      canUseApplyFix({
        viewMode: "demo",
        allowApplyFixForRound: true,
        applyFixUsedInRound: true,
        hasBackendCapability: true
      })
    ).toBe(false);

    expect(
      canUseApplyFix({
        viewMode: "advanced",
        allowApplyFixForRound: false,
        applyFixUsedInRound: true,
        hasBackendCapability: true
      })
    ).toBe(true);
  });
});

describe("rehearsal markdown", () => {
  test("formats copy-ready markdown with round metadata", () => {
    const draft = createRehearsalDraft(PASS_A_ROUNDS[0]);
    const markdown = formatRehearsalDraftMarkdown(draft);

    expect(markdown).toContain("### Pass: `A` | Round: `1`");
    expect(markdown).toContain("- Objective: Baseline");
    expect(markdown).toContain("- Expected result: PASS");
  });
});
