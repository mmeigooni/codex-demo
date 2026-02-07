import { describe, expect, test } from "vitest";

import { recommendPackForPr } from "@/lib/pack-recommendation";
import type { WorkflowPack } from "@/lib/types";

const PACKS: WorkflowPack[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Checkout Safety Review",
    description: "Review checkout and payment pull requests against team safety memory.",
    trigger_type: "pr_review",
    scope_globs: ["src/checkout/**", "src/payments/**"],
    output_schema: {},
    status: "active"
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Dependency Governance Pack",
    description: "Dependency and governance checks.",
    trigger_type: "pr_review",
    scope_globs: ["package*.json", "pnpm-lock.yaml", "yarn.lock"],
    output_schema: {},
    status: "coming_soon"
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Checkout Test Repair Pack",
    description: "Repair checkout test failures.",
    trigger_type: "pr_review",
    scope_globs: ["tests/**", "src/checkout/**"],
    output_schema: {},
    status: "active"
  }
];

describe("recommendPackForPr", () => {
  test("prefers strongest diff-path match deterministically", () => {
    const output = recommendPackForPr({
      packs: PACKS,
      diffPaths: ["src/payments/charge.ts", "src/checkout/endpoint.ts"],
      titleTags: []
    });

    expect(output.suggestedPackId).toBe("11111111-1111-1111-1111-111111111111");
    expect(output.lockReason).toBeUndefined();
  });

  test("returns lock reason and active fallback when top pack is coming soon", () => {
    const output = recommendPackForPr({
      packs: PACKS,
      diffPaths: ["package-lock.json"],
      titleTags: ["catch"]
    });

    expect(output.suggestedPackId).toBe("22222222-2222-2222-2222-222222222222");
    expect(output.lockReason).toContain("coming soon");
    expect(output.alternatives[0]?.status).toBe("active");
  });

  test("breaks score ties by pack name", () => {
    const output = recommendPackForPr({
      packs: [PACKS[2], PACKS[0]],
      diffPaths: [],
      titleTags: []
    });

    // Same score; alphabetical by name.
    expect(output.suggestedPackId).toBe("11111111-1111-1111-1111-111111111111");
  });
});
