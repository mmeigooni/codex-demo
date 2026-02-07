import { describe, expect, test } from "vitest";

import { loadFallbackFixture } from "@/lib/fixtures";

describe("loadFallbackFixture", () => {
  test("returns v1 fixture for memory version 1", async () => {
    const fixture = await loadFallbackFixture(1);
    expect(fixture.findings.length).toBe(3);
  });

  test("returns v2 fixture for memory version 2", async () => {
    const fixture = await loadFallbackFixture(2);
    expect(fixture.findings.length).toBe(4);
  });

  test("returns v3 fixture for memory version >= 3", async () => {
    const fixture = await loadFallbackFixture(3);
    expect(fixture.findings.length).toBe(2);
    expect(fixture.memory_suggestions).toHaveLength(0);
  });
});
