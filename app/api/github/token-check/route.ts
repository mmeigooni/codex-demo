import { NextResponse } from "next/server";

import { resolveGitHubTokenFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const token = await resolveGitHubTokenFromRequest(request);

    return NextResponse.json({
      ok: true,
      token_present: Boolean(token)
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "unknown_error"
      },
      { status: 401 }
    );
  }
}
