import { NextResponse } from "next/server";

import { resolveGitHubTokenFromRequest } from "@/lib/auth";
import { createOAuthGitHubAdapter } from "@/lib/github-adapter";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const repo = url.searchParams.get("repo");
    const pullNumberString = url.searchParams.get("pullNumber");

    if (!repo || !pullNumberString) {
      return NextResponse.json(
        { error: "Missing required query params: repo and pullNumber" },
        { status: 400 }
      );
    }

    const pullNumber = Number.parseInt(pullNumberString, 10);
    if (Number.isNaN(pullNumber)) {
      return NextResponse.json({ error: "Invalid pullNumber" }, { status: 400 });
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
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "unknown_error"
      },
      { status: 500 }
    );
  }
}
