import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = createSupabaseServiceClient();

    const [packResult, memoryResult, runResult] = await Promise.all([
      supabase.from("workflow_packs").select("*").eq("status", "active").limit(1).single(),
      supabase.from("memory_versions").select("*").order("version", { ascending: true }),
      supabase.from("runs").select("*").order("created_at", { ascending: true })
    ]);

    if (packResult.error || !packResult.data) {
      return NextResponse.json({ error: "Active workflow pack not found" }, { status: 404 });
    }

    if (memoryResult.error) {
      return NextResponse.json({ error: memoryResult.error.message }, { status: 500 });
    }

    if (runResult.error) {
      return NextResponse.json({ error: runResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      activePack: packResult.data,
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
