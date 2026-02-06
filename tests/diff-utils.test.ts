import { describe, expect, test } from "vitest";

import { filterDiffByScope, prepareDiff } from "@/lib/diff-utils";

const sampleDiff = `diff --git a/src/checkout/a.ts b/src/checkout/a.ts
--- a/src/checkout/a.ts
+++ b/src/checkout/a.ts
@@ -1,1 +1,1 @@
-console.log('old')
+console.log('new')
diff --git a/src/other/b.ts b/src/other/b.ts
--- a/src/other/b.ts
+++ b/src/other/b.ts
@@ -1,1 +1,1 @@
-export const x = 1
+export const x = 2
`;

describe("diff utils", () => {
  test("filters files by scope globs", () => {
    const output = filterDiffByScope(sampleDiff, ["src/checkout/**"]);
    expect(output.originalFiles).toBe(2);
    expect(output.includedFiles).toBe(1);
    expect(output.filtered).toContain("src/checkout/a.ts");
    expect(output.filtered).not.toContain("src/other/b.ts");
  });

  test("marks truncation when byte limit exceeded", () => {
    const output = prepareDiff(sampleDiff.repeat(100), ["src/checkout/**", "src/other/**"], 100);
    expect(output.truncated).toBe(true);
    expect(Buffer.byteLength(output.diff, "utf8")).toBeLessThanOrEqual(100);
  });
});
