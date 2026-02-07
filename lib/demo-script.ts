import type { DemoRoundDefinition } from "@/lib/types";

export const PASS_A_ROUNDS: DemoRoundDefinition[] = [
  {
    key: "A-1",
    pass: "A",
    round: 1,
    objective: "Baseline",
    prNumber: 1,
    memoryVersionBefore: 1,
    expectedRecommendation: "pass",
    allowApplyFix: false
  },
  {
    key: "A-2",
    pass: "A",
    round: 2,
    objective: "The Catch",
    prNumber: 2,
    memoryVersionBefore: 1,
    expectedRecommendation: "block",
    allowApplyFix: false
  },
  {
    key: "A-3",
    pass: "A",
    round: 3,
    objective: "Learning Proof",
    prNumber: 2,
    memoryVersionBefore: 2,
    expectedRecommendation: "block",
    allowApplyFix: true
  }
];

export const PASS_B_ROUNDS: DemoRoundDefinition[] = [
  {
    key: "B-1",
    pass: "B",
    round: 1,
    objective: "Baseline Confirmation",
    prNumber: 1,
    memoryVersionBefore: 1,
    expectedRecommendation: "pass",
    allowApplyFix: false
  },
  {
    key: "B-2",
    pass: "B",
    round: 2,
    objective: "Catch Reconfirmation",
    prNumber: 2,
    memoryVersionBefore: 1,
    expectedRecommendation: "block",
    allowApplyFix: false
  },
  {
    key: "B-3",
    pass: "B",
    round: 3,
    objective: "Learning Replay",
    prNumber: 2,
    memoryVersionBefore: 2,
    expectedRecommendation: "block",
    allowApplyFix: true
  },
  {
    key: "B-4",
    pass: "B",
    round: 4,
    objective: "Transfer to Another Developer",
    prNumber: 2,
    memoryVersionBefore: 2,
    expectedRecommendation: "block",
    allowApplyFix: false
  },
  {
    key: "B-5",
    pass: "B",
    round: 5,
    objective: "Final Recording Readiness",
    prNumber: 1,
    memoryVersionBefore: 2,
    expectedRecommendation: "pass",
    allowApplyFix: false
  }
];

export const DEMO_SCRIPT_ROUNDS: DemoRoundDefinition[] = [...PASS_A_ROUNDS, ...PASS_B_ROUNDS];

export function getRoundByKey(roundKey: string | null | undefined): DemoRoundDefinition | null {
  if (!roundKey) {
    return null;
  }

  return DEMO_SCRIPT_ROUNDS.find((round) => round.key === roundKey) ?? null;
}

export function initialRoundKey(): string {
  return PASS_A_ROUNDS[0].key;
}
