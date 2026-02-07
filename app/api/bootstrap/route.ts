import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = createSupabaseServiceClient();

    const [packsResult, memoryResult, runResult] = await Promise.all([
      supabase.from("workflow_packs").select("*").order("status", { ascending: true }).order("name", { ascending: true }),
      supabase.from("memory_versions").select("*").order("version", { ascending: true }),
      supabase.from("runs").select("*").order("created_at", { ascending: true })
    ]);

    if (packsResult.error || !packsResult.data) {
      return NextResponse.json({ error: packsResult.error?.message ?? "Failed to load workflow packs" }, { status: 500 });
    }

    const defaultPack = packsResult.data.find((pack) => pack.status === "active");
    if (!defaultPack) {
      return NextResponse.json(
        {
          error: "No active workflow pack available",
          code: "default_pack_not_found"
        },
        { status: 404 }
      );
    }

    if (memoryResult.error) {
      return NextResponse.json({ error: memoryResult.error.message }, { status: 500 });
    }

    if (runResult.error) {
      return NextResponse.json({ error: runResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      workflowPacks: packsResult.data,
      defaultPackId: defaultPack.id,
      memoryVersions: memoryResult.data,
      runs: runResult.data
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "unknown_error" },
      { status: 500 }
    );
  }
}
