import { NextResponse } from "next/server";

import { promoteMemorySchema } from "@/lib/schemas";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const parsedBody = promoteMemorySchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsedBody.error.flatten()
        },
        { status: 400 }
      );
    }

    const payload = parsedBody.data;
    const supabase = createSupabaseServiceClient();

    const latestResult = await supabase
      .from("memory_versions")
      .select("version")
      .eq("workflow_pack_id", payload.workflowPackId)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    if (latestResult.error || !latestResult.data) {
      return NextResponse.json({ error: "Could not resolve latest memory version" }, { status: 500 });
    }

    const nextVersion = latestResult.data.version + 1;

    const insertResult = await supabase
      .from("memory_versions")
      .insert({
        workflow_pack_id: payload.workflowPackId,
        version: nextVersion,
        content: payload.newContent,
        change_summary: payload.changeSummary,
        change_details: payload.addedRules,
        approved_by: payload.approvedBy
      })
      .select()
      .single();

    if (insertResult.error || !insertResult.data) {
      return NextResponse.json({ error: "Failed to create memory version" }, { status: 500 });
    }

    await supabase.from("audit_events").insert({
      event_type: "memory_promoted",
      actor: payload.approvedBy,
      details: {
        source_run_id: payload.sourceRunId,
        workflow_pack_id: payload.workflowPackId,
        memory_version_id: insertResult.data.id,
        next_version: nextVersion
      }
    });

    return NextResponse.json({ memoryVersion: insertResult.data });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "unknown_error"
      },
      { status: 500 }
    );
  }
}
