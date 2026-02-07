import type { RuntimePhase, RuntimePhaseState, WorkflowStatus } from "@/lib/types";

export interface DeriveRuntimePhaseInput {
  status: WorkflowStatus;
  findingsCount: number;
  hasMemorySuggestion: boolean;
  canApply: boolean;
  recommendationCompleted: boolean;
}

function getCurrentPhase(phases: RuntimePhase[], input: DeriveRuntimePhaseInput): RuntimePhase {
  if (input.status === "running" || input.status === "repo_loading" || input.status === "pr_loading") {
    return "review";
  }

  if (phases.includes("recommend") && !input.recommendationCompleted) {
    return "recommend";
  }

  if (phases.includes("apply")) {
    return "apply";
  }

  return "review";
}

export function deriveRuntimePhaseState(input: DeriveRuntimePhaseInput): RuntimePhaseState {
  const phases: RuntimePhase[] = ["review"];

  if (input.findingsCount > 0 && input.hasMemorySuggestion) {
    phases.push("recommend");
  }

  if (input.findingsCount > 0 && input.canApply) {
    phases.push("apply");
  }

  const current = getCurrentPhase(phases, input);
  const currentIndex = phases.indexOf(current);

  return {
    phases,
    current,
    completed: currentIndex > 0 ? phases.slice(0, currentIndex) : []
  };
}
