import { describe, expect, test } from "vitest";

import { runResultSchema } from "@/lib/schemas";

describe("runResultSchema", () => {
  test("accepts valid structured output", () => {
    const value = {
      summary: "Found issues",
      findings: [
        {
          severity: "warning",
          title: "Retry loop issue",
          file: "src/checkout/a.ts",
          line: 12,
          description: "No backoff",
          memory_reference: "Retry logic must use exponential backoff",
          suggested_fix: "Use jitter"
        }
      ],
      memory_suggestions: [
        {
          category: "Data Safety",
          content: "- Never log req.body",
          rationale: "PII risk"
        }
      ]
    };

    const result = runResultSchema.safeParse(value);
    expect(result.success).toBe(true);
  });

  test("rejects malformed output", () => {
    const result = runResultSchema.safeParse({ summary: "x", findings: [{}], memory_suggestions: [] });
    expect(result.success).toBe(false);
  });
});
