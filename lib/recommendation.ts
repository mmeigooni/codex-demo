import type { Finding, MergeRecommendation } from "@/lib/types";

export function computeMergeRecommendation(findings: Finding[]): MergeRecommendation {
  if (findings.some((finding) => finding.severity === "critical")) {
    return "block";
  }

  if (findings.some((finding) => finding.severity === "warning")) {
    return "warnings";
  }

  return "pass";
}
