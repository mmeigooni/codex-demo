import { describe, expect, test } from "vitest";

import {
  buildDiffAnchorId,
  extractDiffFileChunks,
  extractDiffFileSummaries,
  mapFindingToDiffAnchor
} from "@/lib/diff-anchors";
import type { Finding } from "@/lib/types";

const diff = `diff --git a/src/checkout/endpoint.ts b/src/checkout/endpoint.ts
--- a/src/checkout/endpoint.ts
+++ b/src/checkout/endpoint.ts
@@ -1,4 +1,5 @@
 export function handler() {
-  return 1;
+  const retry = true;
+  return retry ? 2 : 1;
 }

diff --git a/src/payments/charge.ts b/src/payments/charge.ts
--- a/src/payments/charge.ts
+++ b/src/payments/charge.ts
@@ -40,3 +40,4 @@ export async function createCharge() {
-  return doCharge();
+  const idempotencyKey = input.requestId;
+  return doCharge(idempotencyKey);
 }
`;

describe("diff anchors", () => {
  test("extracts file summaries and chunks", () => {
    const summaries = extractDiffFileSummaries(diff);
    expect(summaries).toHaveLength(2);
    expect(summaries[0].path).toBe("src/checkout/endpoint.ts");

    const chunks = extractDiffFileChunks(diff);
    expect(chunks[1].chunk).toContain("idempotencyKey");
  });

  test("maps finding to diff anchor with partial path match", () => {
    const finding: Finding = {
      severity: "critical",
      title: "Missing idempotency key",
      file: "charge.ts",
      line: 42,
      description: "No idempotency key",
      memory_reference: null,
      suggested_fix: null
    };

    const anchor = mapFindingToDiffAnchor(finding, extractDiffFileSummaries(diff));
    expect(anchor).not.toBeNull();
    expect(anchor?.filePath).toBe("src/payments/charge.ts");
    expect(anchor?.anchorId).toBe(buildDiffAnchorId("src/payments/charge.ts", 42));
  });
});
