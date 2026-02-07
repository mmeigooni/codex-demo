import { NextResponse } from "next/server";

import { AppError, toErrorResponse } from "@/lib/errors";
import {
  encryptGitHubToken,
  GITHUB_TOKEN_COOKIE_NAME,
  getGitHubTokenCookieMaxAge
} from "@/lib/github-token-cookie";
import { githubTokenCookieSchema } from "@/lib/schemas";
import { getServerEnv } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const parsedBody = githubTokenCookieSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      throw new AppError(422, "invalid_token_payload", "Invalid request body");
    }

    const env = getServerEnv();
    const sealedToken = encryptGitHubToken(parsedBody.data.providerToken, env.githubTokenCookieSecret);
    const response = NextResponse.json({ ok: true });

    response.cookies.set({
      name: GITHUB_TOKEN_COOKIE_NAME,
      value: sealedToken,
      httpOnly: true,
      sameSite: "lax",
      path: "/api",
      maxAge: getGitHubTokenCookieMaxAge(),
      secure: process.env.NODE_ENV === "production"
    });

    return response;
  } catch (error) {
    return toErrorResponse(error, "auth_token_set_failed");
  }
}

export function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: GITHUB_TOKEN_COOKIE_NAME,
    value: "",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    path: "/api",
    secure: process.env.NODE_ENV === "production"
  });
  return response;
}
