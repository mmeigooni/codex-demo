import type { Finding, RuntimePhaseState, WorkflowStatus } from "@/lib/types";

export type StoryMode = "off" | "on";

export type BrainAct = "signal" | "conflict" | "learning";

export type BrainPhase = "scan" | "detect" | "index" | "consolidate";

export type Salience = "low" | "medium" | "high";

export interface BrainStoryState {
  mode: StoryMode;
  act: BrainAct;
  phase: BrainPhase;
  salience: Salience;
  cueCount: number;
  hasSuggestions: boolean;
}

export interface DeriveBrainStoryStateInput {
  mode?: StoryMode;
  status: WorkflowStatus;
  runtimePhase: RuntimePhaseState;
  findings: Finding[];
  hasMemorySuggestion: boolean;
  canApply: boolean;
  applyFixUsed: boolean;
}

function toStoryPhase(input: DeriveBrainStoryStateInput): BrainPhase {
  if (input.status === "running") {
    return "detect";
  }

  if (input.runtimePhase.current === "recommend") {
    return "index";
  }

  if (input.runtimePhase.current === "apply" && !input.applyFixUsed) {
    return "consolidate";
  }

  return "scan";
}

function toStoryAct(phase: BrainPhase): BrainAct {
  if (phase === "detect") {
    return "conflict";
  }

  if (phase === "index" || phase === "consolidate") {
    return "learning";
  }

  return "signal";
}

function toSalience(input: DeriveBrainStoryStateInput): Salience {
  const severities = input.findings.map((finding) => finding.severity);

  if (severities.includes("critical")) {
    return "high";
  }

  if (input.findings.length > 0 && input.canApply && !input.applyFixUsed) {
    return "high";
  }

  if (severities.includes("warning") || input.hasMemorySuggestion) {
    return "medium";
  }

  return "low";
}

export function deriveBrainStoryState(input: DeriveBrainStoryStateInput): BrainStoryState {
  const phase = toStoryPhase(input);
  const cueCount = input.findings.filter((finding) => Boolean(finding.memory_reference)).length + (input.hasMemorySuggestion ? 1 : 0);

  return {
    mode: input.mode ?? "off",
    phase,
    act: toStoryAct(phase),
    salience: toSalience(input),
    cueCount,
    hasSuggestions: input.hasMemorySuggestion
  };
}
