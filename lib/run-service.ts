import type { SupabaseClient } from "@supabase/supabase-js";

import { loadFallbackFixture } from "@/lib/fixtures";
import { executeStructuredReview } from "@/lib/openai-client";
import { PROMPT_TEMPLATE_VERSION, assembleContext } from "@/lib/prompt";
import { computeMergeRecommendation } from "@/lib/recommendation";
import type {
  MemoryVersion,
  PreparedDiff,
  ResponseSource,
  RunRecord,
  RunResult,
  WorkflowPack
} from "@/lib/types";

export interface ExecuteRunInput {
  workflowPack: WorkflowPack;
  memoryVersion: MemoryVersion;
  prUrl: string;
  prTitle: string;
  preparedDiff: PreparedDiff;
}

export interface ExecuteRunOutput {
  run: RunRecord;
  result: RunResult;
  source: ResponseSource;
  validation: "valid" | "fallback";
}

interface RunServiceDeps {
  supabase: SupabaseClient;
  modelExecutor?: typeof executeStructuredReview;
}

export async function executeRunPipeline(
  input: ExecuteRunInput,
  deps: RunServiceDeps
): Promise<ExecuteRunOutput> {
  const start = Date.now();

  const assembledPrompt = assembleContext(input.workflowPack, input.memoryVersion, {
    diff: input.preparedDiff.diff,
    truncated: input.preparedDiff.truncated,
    originalFiles: input.preparedDiff.originalFiles,
    includedFiles: input.preparedDiff.includedFiles
  });

  let source: ResponseSource = "live";
  let validation: "valid" | "fallback" = "valid";
  let errorDetails: string | null = null;
  let result: RunResult;

  try {
    const executor = deps.modelExecutor ?? executeStructuredReview;
    result = await executor(assembledPrompt, 15_000);
  } catch (error) {
    source = "fallback";
    validation = "fallback";
    errorDetails = error instanceof Error ? error.message : "unknown_error";
    result = await loadFallbackFixture(input.memoryVersion.version);
  }

  const durationMs = Date.now() - start;
  const mergeRecommendation = computeMergeRecommendation(result.findings);

  const { data: inserted, error } = await deps.supabase
    .from("runs")
    .insert({
      workflow_pack_id: input.workflowPack.id,
      memory_version_id: input.memoryVersion.id,
      pr_url: input.prUrl,
      pr_title: input.prTitle,
      pr_diff: input.preparedDiff.diff,
      assembled_prompt: assembledPrompt,
      parsed_findings: result.findings,
      memory_suggestions: result.memory_suggestions,
      merge_recommendation: mergeRecommendation,
      prompt_template_version: PROMPT_TEMPLATE_VERSION,
      duration_ms: durationMs,
      source,
      error_details: errorDetails
    })
    .select()
    .single();

  if (error || !inserted) {
    throw new Error(`Failed to persist run: ${error?.message ?? "unknown"}`);
  }

  await deps.supabase.from("audit_events").insert({
    event_type: "run_created",
    actor: "system",
    details: {
      run_id: inserted.id,
      source,
      validation,
      duration_ms: durationMs
    }
  });

  return {
    run: inserted as RunRecord,
    result,
    source,
    validation
  };
}
