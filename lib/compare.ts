import type { Finding } from "@/lib/types";

export function findingKey(finding: Finding): string {
  return `${finding.file}::${finding.title}`;
}

export function findNewFindings(previous: Finding[], current: Finding[]): Finding[] {
  const previousKeys = new Set(previous.map(findingKey));
  return current.filter((finding) => !previousKeys.has(findingKey(finding)));
}
