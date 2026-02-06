import { describe, expect, test } from "vitest";

import {
  findingToMarkdownComment,
  mergeRecommendationLabel,
  summarizeFindings
} from "@/lib/results-summary";

describe("results summary", () => {
  test("computes severity counts", () => {
    const summary = summarizeFindings([
      {
        severity: "critical",
        title: "a",
        file: "a.ts",
        line: 1,
        description: "x",
        memory_reference: null,
        suggested_fix: null
      },
      {
        severity: "warning",
        title: "b",
        file: "b.ts",
        line: 2,
        description: "y",
        memory_reference: "Rule 1",
        suggested_fix: "fix"
      }
    ]);

    expect(summary).toEqual({
      total: 2,
      critical: 1,
      warning: 1,
      info: 0
    });
  });

  test("maps merge recommendation to status label", () => {
    expect(mergeRecommendationLabel("pass")).toBe("PASS");
    expect(mergeRecommendationLabel("warnings")).toBe("REVIEW");
    expect(mergeRecommendationLabel("block")).toBe("BLOCK");
  });

  test("builds markdown comment text", () => {
    const comment = findingToMarkdownComment({
      severity: "warning",
      title: "Retry missing backoff",
      file: "src/checkout/service.ts",
      line: 22,
      description: "Retries are immediate",
      memory_reference: "Retry rule",
      suggested_fix: "Use exponential backoff"
    });

    expect(comment).toContain("Retry missing backoff");
    expect(comment).toContain("Location: src/checkout/service.ts:22");
    expect(comment).toContain("Memory rule: Retry rule");
  });
});
