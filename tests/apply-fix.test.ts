import { describe, expect, test, vi } from "vitest";

import { applyFixToPullRequest } from "@/lib/codex-fix-service";

function createWorkflowPackSupabase(scopeGlobs: string[] = ["src/checkout/**"]) {
  return {
    from: (_table: string) => ({
      select: (_columns: string) => ({
        eq: (_key: string, _value: string) => ({
          single: async () => ({
            data: {
              id: "11111111-1111-1111-1111-111111111111",
              scope_globs: scopeGlobs
            },
            error: null
          })
        })
      })
    })
  };
}

describe("applyFixToPullRequest", () => {
  test("commits generated fix for a valid request", async () => {
    const githubAdapter = {
      listPullRequests: vi.fn(),
      getPullRequestDiff: vi.fn().mockResolvedValue({
        diff: [
          "diff --git a/src/checkout/handler.ts b/src/checkout/handler.ts",
          "--- a/src/checkout/handler.ts",
          "+++ b/src/checkout/handler.ts",
          "@@ -1,1 +1,1 @@",
          "-return oldValue;",
          "+return newValue;"
        ].join("\n"),
        title: "PR",
        url: "https://github.com/mmeigooni/ecommerce-checkout-demo/pull/2"
      }),
      getFileContent: vi.fn().mockResolvedValue({
        content: "export const handler = () => oldValue;\n",
        sha: "abc123"
      }),
      commitFileContent: vi.fn().mockResolvedValue({
        commitSha: "def456",
        commitUrl: "https://github.com/mmeigooni/ecommerce-checkout-demo/commit/def456"
      })
    };

    const result = await applyFixToPullRequest(
      {
        workflowPackId: "11111111-1111-1111-1111-111111111111",
        repo: "mmeigooni/ecommerce-checkout-demo",
        pullNumber: 2,
        branch: "feat/checkout",
        finding: {
          file: "src/checkout/handler.ts",
          line: 1,
          title: "Return value uses old variable",
          description: "Outdated variable in handler return statement",
          suggested_fix: "Use newValue"
        }
      },
      "github-token",
      {
        supabase: createWorkflowPackSupabase() as never,
        githubAdapter: githubAdapter as never,
        fixGenerator: async () => "export const handler = () => newValue;\n"
      }
    );

    expect(githubAdapter.getPullRequestDiff).toHaveBeenCalledOnce();
    expect(githubAdapter.getFileContent).toHaveBeenCalledWith(
      "mmeigooni/ecommerce-checkout-demo",
      "src/checkout/handler.ts",
      "feat/checkout",
      "github-token"
    );
    expect(githubAdapter.commitFileContent).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "src/checkout/handler.ts",
        branch: "feat/checkout"
      })
    );
    expect(result).toEqual({
      commitSha: "def456",
      commitUrl: "https://github.com/mmeigooni/ecommerce-checkout-demo/commit/def456",
      filePath: "src/checkout/handler.ts"
    });
  });

  test("returns apply_fix_model_error when fix generation fails", async () => {
    const githubAdapter = {
      listPullRequests: vi.fn(),
      getPullRequestDiff: vi.fn().mockResolvedValue({
        diff: [
          "diff --git a/src/checkout/handler.ts b/src/checkout/handler.ts",
          "--- a/src/checkout/handler.ts",
          "+++ b/src/checkout/handler.ts"
        ].join("\n"),
        title: "PR",
        url: "https://github.com/mmeigooni/ecommerce-checkout-demo/pull/2"
      }),
      getFileContent: vi.fn().mockResolvedValue({
        content: "export const handler = () => oldValue;\n",
        sha: "abc123"
      }),
      commitFileContent: vi.fn()
    };

    await expect(
      applyFixToPullRequest(
        {
          workflowPackId: "11111111-1111-1111-1111-111111111111",
          repo: "mmeigooni/ecommerce-checkout-demo",
          pullNumber: 2,
          branch: "feat/checkout",
          finding: {
            file: "src/checkout/handler.ts",
            line: 1,
            title: "Return value uses old variable",
            description: "Outdated variable in handler return statement"
          }
        },
        "github-token",
        {
          supabase: createWorkflowPackSupabase() as never,
          githubAdapter: githubAdapter as never,
          fixGenerator: async () => {
            throw new Error("model exploded");
          }
        }
      )
    ).rejects.toMatchObject({
      status: 502,
      code: "apply_fix_model_error"
    });
  });

  test("rejects fix when resolved file is outside scope", async () => {
    const githubAdapter = {
      listPullRequests: vi.fn(),
      getPullRequestDiff: vi.fn().mockResolvedValue({
        diff: [
          "diff --git a/src/checkout/handler.ts b/src/checkout/handler.ts",
          "--- a/src/checkout/handler.ts",
          "+++ b/src/checkout/handler.ts"
        ].join("\n"),
        title: "PR",
        url: "https://github.com/mmeigooni/ecommerce-checkout-demo/pull/2"
      }),
      getFileContent: vi.fn(),
      commitFileContent: vi.fn()
    };

    await expect(
      applyFixToPullRequest(
        {
          workflowPackId: "11111111-1111-1111-1111-111111111111",
          repo: "mmeigooni/ecommerce-checkout-demo",
          pullNumber: 2,
          branch: "feat/checkout",
          finding: {
            file: "src/checkout/handler.ts",
            line: 1,
            title: "Return value uses old variable",
            description: "Outdated variable in handler return statement"
          }
        },
        "github-token",
        {
          supabase: createWorkflowPackSupabase(["src/payments/**"]) as never,
          githubAdapter: githubAdapter as never,
          fixGenerator: async () => "new content"
        }
      )
    ).rejects.toMatchObject({
      status: 422,
      code: "finding_file_out_of_scope"
    });
  });
});
