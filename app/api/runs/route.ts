import { NextResponse } from "next/server";

import { prepareDiff } from "@/lib/diff-utils";
import { runRequestSchema } from "@/lib/schemas";
import { executeRunPipeline } from "@/lib/run-service";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const parsedBody = runRequestSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsedBody.error.flatten()
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceClient();

    const workflowPackResult = await supabase
      .from("workflow_packs")
      .select("*")
      .eq("id", parsedBody.data.workflowPackId)
      .single();

    if (workflowPackResult.error || !workflowPackResult.data) {
      return NextResponse.json({ error: "Workflow pack not found" }, { status: 404 });
    }

    const memoryResult = await supabase
      .from("memory_versions")
      .select("*")
      .eq("id", parsedBody.data.memoryVersionId)
      .single();

    if (memoryResult.error || !memoryResult.data) {
      return NextResponse.json({ error: "Memory version not found" }, { status: 404 });
    }

    const preparedDiff = prepareDiff(
      parsedBody.data.prDiff,
      workflowPackResult.data.scope_globs,
      12_000
    );

    const output = await executeRunPipeline(
      {
        workflowPack: workflowPackResult.data,
        memoryVersion: memoryResult.data,
        prUrl: parsedBody.data.prUrl,
        prTitle: parsedBody.data.prTitle,
        preparedDiff
      },
      {
        supabase
      }
    );

    return NextResponse.json(output);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Analysis unavailable",
        details: error instanceof Error ? error.message : "unknown_error",
        retryable: true
      },
      { status: 503 }
    );
  }
}
