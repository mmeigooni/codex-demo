import { NextResponse } from "next/server";

import { resolveGitHubTokenFromRequest } from "@/lib/auth";
import { applyFixToPullRequest } from "@/lib/codex-fix-service";
import { toErrorResponse } from "@/lib/errors";
import { applyFixRequestSchema } from "@/lib/schemas";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const parsedBody = applyFixRequestSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          code: "invalid_apply_fix_payload",
          details: parsedBody.error.flatten()
        },
        { status: 422 }
      );
    }

    const token = await resolveGitHubTokenFromRequest(request);
    const supabase = createSupabaseServiceClient();
    const result = await applyFixToPullRequest(parsedBody.data, token, { supabase });

    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error, "apply_fix_failed");
  }
}
