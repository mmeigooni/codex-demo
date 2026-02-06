import { describe, expect, test } from "vitest";

import { executeRunPipeline } from "@/lib/run-service";
import type { MemoryVersion, RunResult, WorkflowPack } from "@/lib/types";

class FakeQuery {
  private readonly table: string;
  private readonly store: Record<string, unknown[]>;

  constructor(table: string, store: Record<string, unknown[]>) {
    this.table = table;
    this.store = store;
  }

  insert(payload: Record<string, unknown>) {
    this.store[this.table].push(payload);
    return this;
  }

  select() {
    return this;
  }

  single() {
    const rows = this.store[this.table];
    const latest = rows[rows.length - 1] as Record<string, unknown>;

    return Promise.resolve({
      data: {
        id: `run-${rows.length}`,
        created_at: new Date().toISOString(),
        ...latest
      },
      error: null
    });
  }
}

class FakeSupabase {
  store: Record<string, unknown[]> = {
    runs: [],
    audit_events: []
  };

  from(table: string) {
    if (!this.store[table]) {
      this.store[table] = [];
    }

    return new FakeQuery(table, this.store);
  }
}

const pack: WorkflowPack = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Checkout Safety Review",
  description: "Review checkout diffs",
  trigger_type: "pr_review",
  scope_globs: ["src/checkout/**"],
  output_schema: {},
  status: "active"
};

const memory: MemoryVersion = {
  id: "55555555-5555-5555-5555-555555555555",
  workflow_pack_id: pack.id,
  version: 1,
  content: "- Idempotency",
  change_summary: "seed",
  change_details: [],
  approved_by: "seed",
  created_at: new Date().toISOString()
};

describe("executeRunPipeline", () => {
  test("persists run and computes merge recommendation", async () => {
    const fakeSupabase = new FakeSupabase();
    const fakeResult: RunResult = {
      summary: "Found one warning",
      findings: [
        {
          severity: "warning",
          title: "Retry logic issue",
          file: "src/checkout/a.ts",
          line: 12,
          description: "No backoff",
          memory_reference: "Retry logic must use exponential backoff",
          suggested_fix: "Add backoff"
        }
      ],
      memory_suggestions: []
    };

    const output = await executeRunPipeline(
      {
        workflowPack: pack,
        memoryVersion: memory,
        prUrl: "https://github.com/mmeigooni/ecommerce-checkout-demo/pull/2",
        prTitle: "Add express checkout endpoint",
        preparedDiff: {
          diff: "diff --git a/src/checkout/a.ts b/src/checkout/a.ts",
          truncated: false,
          originalFiles: 1,
          includedFiles: 1
        }
      },
      {
        supabase: fakeSupabase as never,
        modelExecutor: async () => fakeResult
      }
    );

    expect(output.run.merge_recommendation).toBe("warnings");
    expect((fakeSupabase.store.runs.length)).toBe(1);
    expect((fakeSupabase.store.audit_events.length)).toBe(1);
  });
});
