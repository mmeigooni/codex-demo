import { NextResponse } from "next/server";

import { resolveGitHubTokenFromRequest } from "@/lib/auth";
import { AppError, toErrorResponse } from "@/lib/errors";
import { createOAuthGitHubAdapter } from "@/lib/github-adapter";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const repo = url.searchParams.get("repo");

    if (!repo) {
      throw new AppError(422, "invalid_repo_param", "Missing required query param: repo");
    }

    const token = await resolveGitHubTokenFromRequest(request);
    const adapter = createOAuthGitHubAdapter();
    const pullRequests = await adapter.listPullRequests(repo, token);

    return NextResponse.json({
      repository: repo,
      pullRequests
    });
  } catch (error) {
    return toErrorResponse(error, "github_prs_failed");
  }
}
