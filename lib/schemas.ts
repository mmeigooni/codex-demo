import { z } from "zod";

export const findingSchema = z.object({
  severity: z.enum(["critical", "warning", "info"]),
  title: z.string().min(1),
  file: z.string().min(1),
  line: z.number().int().nonnegative(),
  description: z.string().min(1),
  memory_reference: z.string().nullable(),
  suggested_fix: z.string().nullable()
});

export const memorySuggestionSchema = z.object({
  category: z.string().min(1),
  content: z.string().min(1),
  rationale: z.string().min(1)
});

export const runResultSchema = z.object({
  summary: z.string().min(1),
  findings: z.array(findingSchema),
  memory_suggestions: z.array(memorySuggestionSchema)
});

export const runRequestSchema = z.object({
  workflowPackId: z.string().uuid(),
  memoryVersionId: z.string().uuid(),
  prUrl: z.string().url(),
  prTitle: z.string().min(1),
  prDiff: z.string().min(1)
});

export const githubTokenCookieSchema = z.object({
  providerToken: z.string().min(1)
});

export const addedRuleGroupSchema = z.object({
  category: z.string().min(1),
  rules: z.array(z.string().min(1)).min(1)
});

export const promoteMemorySchema = z.object({
  workflowPackId: z.string().uuid(),
  sourceRunId: z.string().uuid(),
  approvedBy: z.string().min(1),
  newContent: z.string().min(1),
  changeSummary: z.string().min(1),
  addedRules: z.array(addedRuleGroupSchema).min(1)
});

export const applyFixFindingSchema = z.object({
  file: z.string().min(1),
  line: z.number().int().nonnegative(),
  title: z.string().min(1),
  description: z.string().min(1),
  suggested_fix: z.string().nullable().optional()
});

export const applyFixRequestSchema = z.object({
  workflowPackId: z.string().uuid(),
  repo: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "Use owner/name format"),
  pullNumber: z.number().int().positive(),
  branch: z.string().min(1),
  finding: applyFixFindingSchema
});

export const openAiOutputJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "findings", "memory_suggestions"],
  properties: {
    summary: { type: "string" },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "severity",
          "title",
          "file",
          "line",
          "description",
          "memory_reference",
          "suggested_fix"
        ],
        properties: {
          severity: { type: "string", enum: ["critical", "warning", "info"] },
          title: { type: "string" },
          file: { type: "string" },
          line: { type: "number" },
          description: { type: "string" },
          memory_reference: { type: ["string", "null"] },
          suggested_fix: { type: ["string", "null"] }
        }
      }
    },
    memory_suggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "content", "rationale"],
        properties: {
          category: { type: "string" },
          content: { type: "string" },
          rationale: { type: "string" }
        }
      }
    }
  }
} as const;
