import { createSupabaseAuthClient } from "@/lib/supabase-auth-server";

export async function resolveGitHubTokenFromRequest(request: Request): Promise<string> {
  const headerToken = request.headers.get("x-github-token");
  if (headerToken) {
    return headerToken;
  }

  const authClient = await createSupabaseAuthClient();
  const { data } = await authClient.auth.getSession();
  const providerToken = (data.session as { provider_token?: string } | null)?.provider_token;

  if (!providerToken) {
    throw new Error("Missing GitHub token in session. Re-authenticate with GitHub.");
  }

  return providerToken;
}
