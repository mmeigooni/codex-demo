import { createSupabaseAuthClient } from "@/lib/supabase-auth-server";
import { AppError } from "@/lib/errors";
import { decryptGitHubToken, GITHUB_TOKEN_COOKIE_NAME } from "@/lib/github-token-cookie";
import { getServerEnv } from "@/lib/env";

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  const pairs = cookieHeader.split(";").map((item) => item.trim()).filter(Boolean);
  const cookies: Record<string, string> = {};

  for (const pair of pairs) {
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();

    if (key && value) {
      cookies[key] = decodeURIComponent(value);
    }
  }

  return cookies;
}

export async function resolveGitHubTokenFromRequest(request: Request): Promise<string> {
  const env = getServerEnv();
  const cookieHeader = request.headers.get("cookie");
  const parsedCookies = parseCookieHeader(cookieHeader);
  const sealedToken = parsedCookies[GITHUB_TOKEN_COOKIE_NAME];

  if (sealedToken) {
    const decryptedToken = decryptGitHubToken(sealedToken, env.githubTokenCookieSecret);
    if (decryptedToken) {
      return decryptedToken;
    }
  }

  const authClient = await createSupabaseAuthClient();
  const { data } = await authClient.auth.getSession();
  const providerToken = (data.session as { provider_token?: string } | null)?.provider_token;

  if (!providerToken) {
    throw new AppError(401, "missing_github_token", "Missing GitHub token in session. Re-authenticate with GitHub.");
  }

  return providerToken;
}
