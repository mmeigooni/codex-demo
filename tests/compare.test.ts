import { describe, expect, test } from "vitest";

import { findNewFindings } from "@/lib/compare";
import type { Finding } from "@/lib/types";

const base: Finding = {
  severity: "warning",
  title: "Retry loop lacks exponential backoff",
  file: "src/checkout/a.ts",
  line: 10,
  description: "No backoff",
  memory_reference: null,
  suggested_fix: null
};

describe("findNewFindings", () => {
  test("detects only findings not present in previous run by file+title", () => {
    const previous = [base];
    const current: Finding[] = [
      { ...base, line: 99 },
      {
        ...base,
        title: "PII exposure in payment handler logs",
        severity: "critical",
        line: 31
      }
    ];

    const added = findNewFindings(previous, current);
    expect(added).toHaveLength(1);
    expect(added[0].title).toContain("PII exposure");
  });
});
