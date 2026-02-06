import type { Finding, MergeRecommendation } from "@/lib/types";

export interface FindingSummary {
  total: number;
  critical: number;
  warning: number;
  info: number;
}

export function summarizeFindings(findings: Finding[]): FindingSummary {
  return findings.reduce<FindingSummary>(
    (summary, finding) => {
      summary.total += 1;
      summary[finding.severity] += 1;
      return summary;
    },
    {
      total: 0,
      critical: 0,
      warning: 0,
      info: 0
    }
  );
}

export function mergeRecommendationLabel(merge: MergeRecommendation): "PASS" | "REVIEW" | "BLOCK" {
  if (merge === "pass") {
    return "PASS";
  }

  if (merge === "warnings") {
    return "REVIEW";
  }

  return "BLOCK";
}

export function findingToMarkdownComment(finding: Finding): string {
  const location = `${finding.file}:${finding.line}`;
  const header = `- **${finding.title}** (${finding.severity.toUpperCase()})`;
  const reason = `  - Why: ${finding.description}`;
  const fix = finding.suggested_fix ? `  - Suggested fix: ${finding.suggested_fix}` : "";
  const memory = finding.memory_reference ? `  - Memory rule: ${finding.memory_reference}` : "";
  const lines = [header, `  - Location: ${location}`, reason, fix, memory].filter(Boolean);

  return lines.join("\n");
}
