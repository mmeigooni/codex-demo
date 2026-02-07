import picomatch from "picomatch";

import type { WorkflowPack } from "@/lib/types";

export interface RecommendedPackOption {
  id: string;
  name: string;
  status: WorkflowPack["status"];
  score: number;
}

export interface RecommendPackInput {
  packs: WorkflowPack[];
  diffPaths: string[];
  titleTags: string[];
}

export interface RecommendPackOutput {
  suggestedPackId: string | null;
  alternatives: RecommendedPackOption[];
  lockReason?: string;
}

const TAG_HINTS: Record<string, string[]> = {
  baseline: ["checkout", "safety", "review"],
  catch: ["dependency", "incident", "governance"],
  learn: ["checkout", "memory", "review"],
  transfer: ["test", "repair", "ci"]
};

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

function pathMatchScore(pack: WorkflowPack, diffPaths: string[]): number {
  if (!diffPaths.length) {
    return 0;
  }

  const matchers = pack.scope_globs.map((glob) => picomatch(glob, { dot: true }));
  let score = 0;

  for (const path of diffPaths) {
    if (matchers.some((matches) => matches(path))) {
      score += 5;
    }
  }

  return score;
}

function tagMatchScore(pack: WorkflowPack, titleTags: string[]): number {
  if (!titleTags.length) {
    return 0;
  }

  const name = `${pack.name} ${pack.description}`.toLowerCase();
  let score = 0;

  for (const tag of titleTags.map(normalizeTag)) {
    const hints = TAG_HINTS[tag] ?? [tag];
    if (hints.some((hint) => name.includes(hint))) {
      score += 3;
    }
  }

  return score;
}

function compareByScoreThenName(a: RecommendedPackOption, b: RecommendedPackOption): number {
  if (b.score !== a.score) {
    return b.score - a.score;
  }

  return a.name.localeCompare(b.name);
}

export function recommendPackForPr(input: RecommendPackInput): RecommendPackOutput {
  if (!input.packs.length) {
    return {
      suggestedPackId: null,
      alternatives: []
    };
  }

  const ranked = input.packs
    .map((pack) => ({
      id: pack.id,
      name: pack.name,
      status: pack.status,
      score: pathMatchScore(pack, input.diffPaths) + tagMatchScore(pack, input.titleTags)
    }))
    .sort(compareByScoreThenName);

  const [suggested, ...rest] = ranked;
  const alternatives = [...rest].sort(compareByScoreThenName);

  if (suggested.status === "coming_soon") {
    const nearestActive = alternatives.find((candidate) => candidate.status === "active");

    return {
      suggestedPackId: suggested.id,
      alternatives: nearestActive ? [nearestActive, ...alternatives.filter((candidate) => candidate.id !== nearestActive.id)] : alternatives,
      lockReason: nearestActive
        ? `${suggested.name} is coming soon. Use ${nearestActive.name} for this run.`
        : `${suggested.name} is coming soon and no active alternative pack is available.`
    };
  }

  return {
    suggestedPackId: suggested.id,
    alternatives
  };
}
