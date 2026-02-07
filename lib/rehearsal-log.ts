import type { DemoRoundDefinition } from "@/lib/types";

export interface RehearsalDraft {
  pass: "A" | "B";
  round: number;
  objective: string;
  expectedRecommendation: string;
  prNumber: number;
  memoryVersionBefore: number;
  runId: string;
  mergeRecommendation: string;
  source: "live" | "fallback" | "unknown";
  promoted: "yes" | "no";
  memoryVersionAfter: string;
  keyFindings: [string, string, string];
  varianceNotes: string;
  recoveryAction: string;
}

export function createRehearsalDraft(round: DemoRoundDefinition): RehearsalDraft {
  return {
    pass: round.pass,
    round: round.round,
    objective: round.objective,
    expectedRecommendation: round.expectedRecommendation.toUpperCase(),
    prNumber: round.prNumber,
    memoryVersionBefore: round.memoryVersionBefore,
    runId: "[fill]",
    mergeRecommendation: "[fill]",
    source: "unknown",
    promoted: "no",
    memoryVersionAfter: "",
    keyFindings: ["1. [fill]", "2. [fill]", "3. [fill]"],
    varianceNotes: "",
    recoveryAction: ""
  };
}

export function formatRehearsalDraftMarkdown(draft: RehearsalDraft): string {
  return [
    `### Pass: \`${draft.pass}\` | Round: \`${draft.round}\``,
    "",
    `- Objective: ${draft.objective}`,
    "- Inputs:",
    `  - PR: ${draft.prNumber}`,
    `  - Memory version before run: ${draft.memoryVersionBefore}`,
    `- Expected result: ${draft.expectedRecommendation}`,
    "- Actual result:",
    `  - Run ID: ${draft.runId}`,
    `  - Merge recommendation: ${draft.mergeRecommendation}`,
    `  - Source (\`live\` or \`fallback\`): \`${draft.source}\``,
    "- Key findings observed:",
    `  - ${draft.keyFindings[0]}`,
    `  - ${draft.keyFindings[1]}`,
    `  - ${draft.keyFindings[2]}`,
    "- Memory promotion performed:",
    `  - \`${draft.promoted}\``,
    `  - New memory version ID (if yes): ${draft.memoryVersionAfter}`,
    "- Screenshots captured:",
    "  - Findings panel: [fill]",
    "  - Memory panel: [fill]",
    "  - Timeline (if applicable): [fill]",
    `- Variance notes: ${draft.varianceNotes}`,
    `- Recovery action taken (if any): ${draft.recoveryAction}`
  ].join("\n");
}
