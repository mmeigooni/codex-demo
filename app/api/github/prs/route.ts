import { NextResponse } from "next/server";

import { resolveGitHubTokenFromRequest } from "@/lib/auth";
import { createOAuthGitHubAdapter } from "@/lib/github-adapter";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const repo = url.searchParams.get("repo");

    if (!repo) {
      return NextResponse.json({ error: "Missing required query param: repo" }, { status: 400 });
    }

    const token = await resolveGitHubTokenFromRequest(request);
    const adapter = createOAuthGitHubAdapter();
    const pullRequests = await adapter.listPullRequests(repo, token);

    return NextResponse.json({
      repository: repo,
      pullRequests
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "unknown_error"
      },
      { status: 500 }
    );
  }
}
