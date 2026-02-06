import type { MemoryVersion, PreparedDiff, WorkflowPack } from "@/lib/types";

export const PROMPT_TEMPLATE_VERSION = "1.0";

export function assembleContext(
  pack: WorkflowPack,
  memory: MemoryVersion,
  preparedDiff: PreparedDiff
): string {
  const truncationNote = preparedDiff.truncated
    ? `\nNOTE: Diff was truncated for model limits. Review only included code.`
    : "";

  return [
    "You are a code review agent for an eCommerce engineering team.",
    "",
    `Template version: ${PROMPT_TEMPLATE_VERSION}`,
    "",
    `## Workflow: ${pack.name}`,
    pack.description,
    "",
    `## Scope`,
    `Only review files matching: ${pack.scope_globs.join(", ")}`,
    "",
    `## Team Memory (v${memory.version})`,
    memory.content,
    "",
    "## Output Format",
    "Return JSON that matches this schema:",
    JSON.stringify(
      {
        summary: "string",
        findings: [
          {
            severity: "critical | warning | info",
            title: "string",
            file: "string",
            line: 1,
            description: "string",
            memory_reference: "string | null",
            suggested_fix: "string | null"
          }
        ],
        memory_suggestions: [
          {
            category: "string",
            content: "string",
            rationale: "string"
          }
        ]
      },
      null,
      2
    ),
    "",
    `## PR Diff (${preparedDiff.includedFiles}/${preparedDiff.originalFiles} files in scope)`,
    "```diff",
    preparedDiff.diff,
    "```",
    truncationNote,
    "",
    "Analyze this diff against team memory. Reference memory rules where applicable and be specific."
  ]
    .filter(Boolean)
    .join("\n");
}
