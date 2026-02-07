import { describe, expect, test } from "vitest";

import { buildTimelineNodes } from "@/lib/use-timeline-data";
import type { MemoryVersion, RunRecord } from "@/lib/types";

const packId = "11111111-1111-1111-1111-111111111111";

function makeMemory(overrides: Partial<MemoryVersion>): MemoryVersion {
  return {
    id: "55555555-5555-5555-5555-555555555555",
    workflow_pack_id: packId,
    version: 1,
    content: "### Code Patterns\n- Rule A\n- Rule B",
    change_summary: "seed",
    change_details: [],
    approved_by: "seed",
    created_at: "2026-02-03T09:00:00Z",
    ...overrides
  };
}

function makeRun(overrides: Partial<RunRecord>): RunRecord {
  return {
    id: "run-1",
    workflow_pack_id: packId,
    memory_version_id: "55555555-5555-5555-5555-555555555555",
    pr_url: "https://github.com/mmeigooni/ecommerce-checkout-demo/pull/1",
    pr_title: "PR 1",
    pr_diff: "diff --git a/src/a.ts b/src/a.ts",
    assembled_prompt: "prompt",
    parsed_findings: [],
    memory_suggestions: [],
    merge_recommendation: "pass",
    prompt_template_version: "v1",
    duration_ms: 1000,
    source: "live",
    error_details: null,
    created_at: "2026-02-03T09:30:00Z",
    ...overrides
  };
}

describe("buildTimelineNodes", () => {
  test("returns empty list for empty inputs", () => {
    expect(buildTimelineNodes([], [])).toEqual([]);
  });

  test("returns 8 sorted nodes for 3 memories and 5 runs", () => {
    const memories: MemoryVersion[] = [
      makeMemory({
        id: "m1",
        version: 1,
        created_at: "2026-02-03T09:00:00Z",
        content: "### A\n- x\n- y"
      }),
      makeMemory({
        id: "m2",
        version: 2,
        created_at: "2026-02-04T10:00:00Z",
        content: "### A\n- x\n- y\n### Data Safety\n- do-not-log",
        change_details: [{ category: "Data Safety", rules: ["do-not-log"] }]
      }),
      makeMemory({
        id: "m3",
        version: 3,
        created_at: "2026-02-06T12:00:00Z",
        content: "### A\n- x\n- y\n### Data Safety\n- do-not-log\n### Webhook Security\n- verify-signature",
        change_details: [{ category: "Webhook Security", rules: ["verify-signature"] }]
      })
    ];

    const runs: RunRecord[] = [
      makeRun({ id: "r1", memory_version_id: "m1", pr_title: "PR #1", created_at: "2026-02-03T09:20:00Z" }),
      makeRun({
        id: "r2",
        memory_version_id: "m1",
        pr_title: "PR #2",
        created_at: "2026-02-04T09:30:00Z",
        merge_recommendation: "block",
        parsed_findings: [
          {
            severity: "critical",
            title: "x",
            file: "a.ts",
            line: 1,
            description: "x",
            memory_reference: null,
            suggested_fix: null
          }
        ],
        memory_suggestions: [
          {
            category: "Data Safety",
            content: "- do-not-log",
            rationale: "PII"
          }
        ]
      }),
      makeRun({
        id: "r3",
        memory_version_id: "m2",
        pr_title: "PR #2 rerun",
        created_at: "2026-02-04T10:10:00Z",
        merge_recommendation: "block",
        parsed_findings: [
          {
            severity: "critical",
            title: "x",
            file: "a.ts",
            line: 1,
            description: "x",
            memory_reference: "rule",
            suggested_fix: null
          },
          {
            severity: "warning",
            title: "y",
            file: "b.ts",
            line: 2,
            description: "y",
            memory_reference: null,
            suggested_fix: null
          }
        ]
      }),
      makeRun({
        id: "r4",
        memory_version_id: "m2",
        pr_title: "PR #3",
        created_at: "2026-02-05T09:00:00Z",
        merge_recommendation: "block",
        memory_suggestions: [
          {
            category: "Webhook Security",
            content: "- verify-signature",
            rationale: "security"
          }
        ]
      }),
      makeRun({
        id: "r5",
        memory_version_id: "m3",
        pr_title: "PR #5",
        created_at: "2026-02-06T12:30:00Z",
        merge_recommendation: "pass"
      })
    ];

    const nodes = buildTimelineNodes(memories, runs);
    expect(nodes).toHaveLength(8);

    const dates = nodes.map((node) => new Date(node.date).getTime());
    expect(dates).toEqual([...dates].sort((a, b) => a - b));
  });

  test("flags runs that trigger next memory promotion", () => {
    const memories: MemoryVersion[] = [
      makeMemory({
        id: "m1",
        version: 1,
        created_at: "2026-02-03T09:00:00Z"
      }),
      makeMemory({
        id: "m2",
        version: 2,
        created_at: "2026-02-04T09:00:00Z",
        change_details: [{ category: "Data Safety", rules: ["no raw body logging"] }]
      })
    ];

    const runs: RunRecord[] = [
      makeRun({
        id: "promoter",
        memory_version_id: "m1",
        created_at: "2026-02-04T08:30:00Z",
        memory_suggestions: [
          { category: "Data Safety", content: "- no raw body logging", rationale: "PII risk" }
        ]
      }),
      makeRun({
        id: "non-promoter",
        memory_version_id: "m1",
        created_at: "2026-02-03T10:00:00Z",
        memory_suggestions: [
          { category: "Webhook Security", content: "- verify signatures", rationale: "spoofing risk" }
        ]
      })
    ];

    const nodes = buildTimelineNodes(memories, runs);
    const promotingRun = nodes.find((node) => node.runId === "promoter");
    const nonPromotingRun = nodes.find((node) => node.runId === "non-promoter");

    expect(promotingRun?.triggeredPromotion).toBe(true);
    expect(nonPromotingRun?.triggeredPromotion).toBe(false);
  });
});
