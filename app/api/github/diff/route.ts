import { NextResponse } from "next/server";

import { resolveGitHubTokenFromRequest } from "@/lib/auth";
import { AppError, toErrorResponse } from "@/lib/errors";
import { createOAuthGitHubAdapter } from "@/lib/github-adapter";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const repo = url.searchParams.get("repo");
    const pullNumberString = url.searchParams.get("pullNumber");

    if (!repo || !pullNumberString) {
      throw new AppError(422, "invalid_diff_params", "Missing required query params: repo and pullNumber");
    }

    const pullNumber = Number.parseInt(pullNumberString, 10);
    if (Number.isNaN(pullNumber)) {
      throw new AppError(422, "invalid_pull_number", "Invalid pullNumber");
    }

    const token = await resolveGitHubTokenFromRequest(request);
    const adapter = createOAuthGitHubAdapter();
    const data = await adapter.getPullRequestDiff(repo, pullNumber, token);

    return NextResponse.json({
      repository: repo,
      pullNumber,
      title: data.title,
      url: data.url,
      diff: data.diff
    });
  } catch (error) {
    return toErrorResponse(error, "github_diff_failed");
  }
}
