import type { DemoViewMode } from "@/lib/types";

interface ApplyFixGateInput {
  viewMode: DemoViewMode;
  allowApplyFixForRound: boolean;
  applyFixUsedInRound: boolean;
  hasBackendCapability: boolean;
}

export function canUseApplyFix(input: ApplyFixGateInput): boolean {
  if (!input.hasBackendCapability) {
    return false;
  }

  if (input.viewMode !== "demo") {
    return true;
  }

  return input.allowApplyFixForRound && !input.applyFixUsedInRound;
}
