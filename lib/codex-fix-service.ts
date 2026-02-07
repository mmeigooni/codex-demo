import OpenAI from "openai";
import picomatch from "picomatch";
import type { SupabaseClient } from "@supabase/supabase-js";

import { extractDiffFileSummaries, mapFindingToDiffAnchor } from "@/lib/diff-anchors";
import { getServerEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { createOAuthGitHubAdapter, type GitHubAdapter } from "@/lib/github-adapter";
import type { Finding, WorkflowPack } from "@/lib/types";

export interface ApplyFixInput {
  workflowPackId: string;
  repo: string;
  pullNumber: number;
  branch: string;
  finding: {
    file: string;
    line: number;
    title: string;
    description: string;
    suggested_fix?: string | null;
  };
}

export interface ApplyFixResult {
  commitSha: string;
  commitUrl: string;
  filePath: string;
}

interface FixGenerationContext {
  filePath: string;
  currentContent: string;
  finding: ApplyFixInput["finding"];
}

interface ApplyFixDeps {
  supabase: SupabaseClient;
  githubAdapter?: GitHubAdapter;
  fixGenerator?: (context: FixGenerationContext) => Promise<string>;
}

function stripCodeFences(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```[a-zA-Z0-9_-]*\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
  }

  return trimmed;
}

async function defaultFixGenerator(context: FixGenerationContext): Promise<string> {
  const env = getServerEnv();
  const client = new OpenAI({ apiKey: env.openAiApiKey });

  const prompt = [
    "You are applying a minimal, production-safe fix to a single file.",
    `Target file: ${context.filePath}`,
    `Finding title: ${context.finding.title}`,
    `Finding description: ${context.finding.description}`,
    context.finding.suggested_fix ? `Suggested fix hint: ${context.finding.suggested_fix}` : "",
    "Return only the complete updated file content.",
    "Do not include markdown, backticks, or explanations.",
    "",
    "Current file content:",
    context.currentContent
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.responses.create({
    model: "gpt-5.1-codex-mini",
    input: [
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const text = response.output_text?.trim();
  if (!text) {
    throw new AppError(502, "apply_fix_model_error", "Model did not return updated file content", true);
  }

  return stripCodeFences(text);
}

function toFindingForPathResolution(finding: ApplyFixInput["finding"]): Finding {
  return {
    severity: "warning",
    title: finding.title,
    file: finding.file,
    line: finding.line,
    description: finding.description,
    memory_reference: null,
    suggested_fix: finding.suggested_fix ?? null
  };
}

export async function applyFixToPullRequest(
  input: ApplyFixInput,
  token: string,
  deps: ApplyFixDeps
): Promise<ApplyFixResult> {
  const workflowPackResult = await deps.supabase
    .from("workflow_packs")
    .select("id,scope_globs")
    .eq("id", input.workflowPackId)
    .single();

  if (workflowPackResult.error || !workflowPackResult.data) {
    throw new AppError(422, "workflow_pack_not_found", "Workflow pack not found for apply-fix");
  }

  const workflowPack = workflowPackResult.data as Pick<WorkflowPack, "id" | "scope_globs">;
  const githubAdapter = deps.githubAdapter ?? createOAuthGitHubAdapter();

  const pullRequestData = await githubAdapter.getPullRequestDiff(input.repo, input.pullNumber, token);
  const diffFiles = extractDiffFileSummaries(pullRequestData.diff);
  const resolvedAnchor = mapFindingToDiffAnchor(toFindingForPathResolution(input.finding), diffFiles);

  if (!resolvedAnchor) {
    throw new AppError(
      422,
      "finding_file_not_in_diff",
      `Finding file '${input.finding.file}' is not present in the selected pull request diff`
    );
  }

  const inScope = workflowPack.scope_globs
    .map((glob) => picomatch(glob))
    .some((matcher) => matcher(resolvedAnchor.filePath));

  if (!inScope) {
    throw new AppError(
      422,
      "finding_file_out_of_scope",
      `Resolved file '${resolvedAnchor.filePath}' is outside workflow scope`
    );
  }

  const currentFile = await githubAdapter.getFileContent(input.repo, resolvedAnchor.filePath, input.branch, token);
  const generator = deps.fixGenerator ?? defaultFixGenerator;

  let updatedContent: string;
  try {
    updatedContent = await generator({
      filePath: resolvedAnchor.filePath,
      currentContent: currentFile.content,
      finding: input.finding
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      502,
      "apply_fix_model_error",
      error instanceof Error ? error.message : "Model failed to generate a fix",
      true
    );
  }

  if (!updatedContent.trim()) {
    throw new AppError(422, "invalid_fix_output", "Generated fix output was empty");
  }

  const originalLines = currentFile.content.split(/\r?\n/).length;
  const updatedLines = updatedContent.split(/\r?\n/).length;
  if (updatedLines > Math.max(originalLines * 2, originalLines + 200)) {
    throw new AppError(
      422,
      "fix_output_too_large",
      `Generated fix expanded file too much (${updatedLines} lines from ${originalLines})`
    );
  }

  const commitResult = await githubAdapter.commitFileContent({
    repo: input.repo,
    path: resolvedAnchor.filePath,
    branch: input.branch,
    token,
    message: `fix: ${input.finding.title}`,
    content: updatedContent,
    sha: currentFile.sha
  });

  return {
    commitSha: commitResult.commitSha,
    commitUrl: commitResult.commitUrl,
    filePath: resolvedAnchor.filePath
  };
}
