import { beforeEach, describe, expect, test, vi } from "vitest";

const authClientMock = vi.fn();
const decryptMock = vi.fn();

vi.mock("@/lib/supabase-auth-server", () => ({
  createSupabaseAuthClient: authClientMock
}));

vi.mock("@/lib/github-token-cookie", () => ({
  GITHUB_TOKEN_COOKIE_NAME: "gh_provider_token",
  decryptGitHubToken: decryptMock
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({
    githubTokenCookieSecret: "test-secret"
  })
}));

describe("resolveGitHubTokenFromRequest", () => {
  beforeEach(() => {
    vi.resetModules();
    decryptMock.mockReset();
    authClientMock.mockReset();
  });

  test("returns decrypted token from cookie when present", async () => {
    decryptMock.mockReturnValue("cookie-token");
    authClientMock.mockResolvedValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } })
      }
    });

    const { resolveGitHubTokenFromRequest } = await import("@/lib/auth");
    const request = new Request("http://localhost:3000/api/github/prs", {
      headers: {
        cookie: "gh_provider_token=sealed-value"
      }
    });

    const token = await resolveGitHubTokenFromRequest(request);
    expect(token).toBe("cookie-token");
  });

  test("falls back to Supabase provider_token when cookie is absent", async () => {
    decryptMock.mockReturnValue(null);
    authClientMock.mockResolvedValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              provider_token: "session-token"
            }
          }
        })
      }
    });

    const { resolveGitHubTokenFromRequest } = await import("@/lib/auth");
    const request = new Request("http://localhost:3000/api/github/prs");
    const token = await resolveGitHubTokenFromRequest(request);

    expect(token).toBe("session-token");
  });

  test("throws typed 401 error when neither cookie nor session token exists", async () => {
    decryptMock.mockReturnValue(null);
    authClientMock.mockResolvedValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: null
          }
        })
      }
    });

    const { resolveGitHubTokenFromRequest } = await import("@/lib/auth");
    const request = new Request("http://localhost:3000/api/github/prs");

    await expect(resolveGitHubTokenFromRequest(request)).rejects.toMatchObject({
      status: 401,
      code: "missing_github_token"
    });
  });
});
