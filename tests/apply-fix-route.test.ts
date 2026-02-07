import { beforeEach, describe, expect, test, vi } from "vitest";

import { AppError } from "@/lib/errors";

const resolveTokenMock = vi.hoisted(() => vi.fn());
const applyFixMock = vi.hoisted(() => vi.fn());
const createSupabaseMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  resolveGitHubTokenFromRequest: resolveTokenMock
}));

vi.mock("@/lib/codex-fix-service", () => ({
  applyFixToPullRequest: applyFixMock
}));

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServiceClient: createSupabaseMock
}));

describe("POST /api/codex/apply-fix", () => {
  beforeEach(() => {
    resolveTokenMock.mockReset();
    applyFixMock.mockReset();
    createSupabaseMock.mockReset();
  });

  test("returns 401 when GitHub token cannot be resolved", async () => {
    resolveTokenMock.mockRejectedValue(
      new AppError(401, "missing_github_token", "Missing GitHub token in session. Re-authenticate with GitHub.")
    );
    createSupabaseMock.mockReturnValue({});

    const { POST } = await import("@/app/api/codex/apply-fix/route");
    const response = await POST(
      new Request("http://localhost:3000/api/codex/apply-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        })
      })
    );

    const payload = await response.json();
    expect(response.status).toBe(401);
    expect(payload.code).toBe("missing_github_token");
  });
});
