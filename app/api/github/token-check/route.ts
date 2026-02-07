import { NextResponse } from "next/server";

import { resolveGitHubTokenFromRequest } from "@/lib/auth";
import { toAppError } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const token = await resolveGitHubTokenFromRequest(request);

    return NextResponse.json({
      ok: true,
      token_present: Boolean(token)
    });
  } catch (error) {
    const appError = toAppError(error, "github_token_check_failed");

    return NextResponse.json(
      {
        ok: false,
        error: appError.message,
        code: appError.code
      },
      { status: appError.status }
    );
  }
}
