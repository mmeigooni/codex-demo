import { useMemo } from "react";

import type { AddedRuleGroup, MemoryVersion, RunRecord, TimelineNode } from "@/lib/types";

function parseMemorySections(content: string): Array<{ title: string; rules: string[] }> {
  const lines = content.split(/\r?\n/);
  const sections: Array<{ title: string; rules: string[] }> = [];
  let currentSection: { title: string; rules: string[] } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith("### ")) {
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        title: line.replace(/^###\s+/, ""),
        rules: []
      };
      continue;
    }

    if (currentSection && line.startsWith("- ")) {
      currentSection.rules.push(line.replace(/^-\s+/, ""));
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

function ruleCountFromContent(content: string): number {
  const sections = parseMemorySections(content);
  return sections.reduce((total, section) => total + section.rules.length, 0);
}

function normalizeCategory(value: string): string {
  return value.trim().toLowerCase();
}

function getCategoriesFromChangeDetails(changeDetails: AddedRuleGroup[]): Set<string> {
  return new Set(changeDetails.map((item) => normalizeCategory(item.category)));
}

function getCategoriesFromRunSuggestions(run: RunRecord): Set<string> {
  return new Set(run.memory_suggestions.map((item) => normalizeCategory(item.category)));
}

export function buildTimelineNodes(memoryVersions: MemoryVersion[], runs: RunRecord[]): TimelineNode[] {
  if (!memoryVersions.length && !runs.length) {
    return [];
  }

  const memoryById = new Map(memoryVersions.map((memory) => [memory.id, memory]));
  const memoryByVersion = new Map(memoryVersions.map((memory) => [memory.version, memory]));

  const memoryNodes: TimelineNode[] = memoryVersions.map((memory) => ({
    id: `memory-${memory.id}`,
    type: "memory_version",
    date: memory.created_at,
    memoryVersion: memory.version,
    ruleCount: ruleCountFromContent(memory.content),
    addedRules: memory.change_details,
    approvedBy: memory.approved_by
  }));

  const runNodes: TimelineNode[] = runs.map((run) => {
    const sourceMemory = memoryById.get(run.memory_version_id);
    const nextMemory = sourceMemory ? memoryByVersion.get(sourceMemory.version + 1) : undefined;
    const nextCategories = nextMemory ? getCategoriesFromChangeDetails(nextMemory.change_details) : new Set<string>();
    const runCategories = getCategoriesFromRunSuggestions(run);

    const triggeredPromotion =
      Boolean(nextMemory) &&
      [...runCategories].some((category) => nextCategories.has(category)) &&
      new Date(run.created_at).getTime() <= new Date(nextMemory!.created_at).getTime();

    return {
      id: `run-${run.id}`,
      type: "run",
      date: run.created_at,
      runId: run.id,
      prTitle: run.pr_title,
      verdict: run.merge_recommendation,
      findingCount: run.parsed_findings.length,
      memoryVersionUsed: sourceMemory?.version,
      triggeredPromotion
    };
  });

  return [...memoryNodes, ...runNodes].sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime()
  );
}

export function useTimelineData(memoryVersions: MemoryVersion[], runs: RunRecord[]): TimelineNode[] {
  return useMemo(() => buildTimelineNodes(memoryVersions, runs), [memoryVersions, runs]);
}
