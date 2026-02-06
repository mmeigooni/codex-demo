import { describe, expect, test } from "vitest";

import { computeMergeRecommendation } from "@/lib/recommendation";

describe("computeMergeRecommendation", () => {
  test("returns block when any critical finding exists", () => {
    const result = computeMergeRecommendation([
      {
        severity: "critical",
        title: "x",
        file: "a.ts",
        line: 1,
        description: "x",
        memory_reference: null,
        suggested_fix: null
      }
    ]);

    expect(result).toBe("block");
  });

  test("returns warnings when warning exists and no critical", () => {
    const result = computeMergeRecommendation([
      {
        severity: "warning",
        title: "x",
        file: "a.ts",
        line: 1,
        description: "x",
        memory_reference: null,
        suggested_fix: null
      }
    ]);

    expect(result).toBe("warnings");
  });

  test("returns pass for empty findings", () => {
    expect(computeMergeRecommendation([])).toBe("pass");
  });
});
