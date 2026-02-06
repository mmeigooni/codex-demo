import { describe, expect, test } from "vitest";

import { assembleContext, PROMPT_TEMPLATE_VERSION } from "@/lib/prompt";
import type { MemoryVersion, WorkflowPack } from "@/lib/types";

const pack: WorkflowPack = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Checkout Safety Review",
  description: "Review checkout diffs",
  trigger_type: "pr_review",
  scope_globs: ["src/checkout/**", "src/payments/**"],
  output_schema: {},
  status: "active"
};

const memory: MemoryVersion = {
  id: "55555555-5555-5555-5555-555555555555",
  workflow_pack_id: pack.id,
  version: 1,
  content: "- idempotency key",
  change_summary: "seed",
  change_details: [],
  approved_by: "seed",
  created_at: new Date().toISOString()
};

describe("assembleContext", () => {
  test("assembles context with pack, memory, and diff", () => {
    const prompt = assembleContext(pack, memory, {
      diff: "diff --git a/src/checkout/a.ts b/src/checkout/a.ts\n+console.log('x')",
      truncated: false,
      originalFiles: 2,
      includedFiles: 1
    });

    expect(prompt).toContain("Checkout Safety Review");
    expect(prompt).toContain("Team Memory (v1)");
    expect(prompt).toContain(PROMPT_TEMPLATE_VERSION);
    expect(prompt).toContain("diff --git");
    expect(prompt).toContain("1/2 files in scope");
  });
});
