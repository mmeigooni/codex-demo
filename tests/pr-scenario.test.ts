import { describe, expect, test } from "vitest";

import { parsePrScenario } from "@/lib/pr-scenario";

describe("parsePrScenario", () => {
  test("parses prefix and suffix markers case-insensitively", () => {
    const parsed = parsePrScenario("[BASELINE] Harden checkout retries [Transfer]");

    expect(parsed.tags).toEqual(["baseline", "transfer"]);
    expect(parsed.tone).toBe("baseline");
  });

  test("returns empty result when no markers exist", () => {
    const parsed = parsePrScenario("Add checkout endpoint");

    expect(parsed.tags).toEqual([]);
    expect(parsed.tone).toBeUndefined();
  });

  test("de-duplicates repeated markers", () => {
    const parsed = parsePrScenario("[catch] Fix token handling [CATCH]");

    expect(parsed.tags).toEqual(["catch"]);
    expect(parsed.tone).toBe("catch");
  });
});
