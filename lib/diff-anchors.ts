import type { DiffFileSummary, DiffLineAnchor, Finding } from "@/lib/types";

interface DiffFileMapEntry {
  path: string;
  normalizedPath: string;
  additions: number;
  deletions: number;
  chunk: string;
}

function normalizePath(path: string): string {
  return path.replace(/^\.\//, "").replace(/^a\//, "").replace(/^b\//, "").trim();
}

function slugifyPath(path: string): string {
  return path.replace(/[^A-Za-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

export function buildDiffAnchorId(filePath: string, line: number): string {
  const safePath = slugifyPath(filePath) || "file";
  const safeLine = Number.isFinite(line) && line > 0 ? Math.floor(line) : 1;
  return `diff-${safePath}-${safeLine}`;
}

export function extractDiffFileSummaries(diff: string): DiffFileSummary[] {
  return extractDiffFileChunks(diff).map((file) => ({
    path: file.path,
    additions: file.additions,
    deletions: file.deletions
  }));
}

export interface DiffFileChunk {
  path: string;
  additions: number;
  deletions: number;
  chunk: string;
}

export function extractDiffFileChunks(diff: string): DiffFileChunk[] {
  const lines = diff.split(/\r?\n/);
  const files: DiffFileMapEntry[] = [];

  let current: DiffFileMapEntry | null = null;
  let currentChunk: string[] = [];

  for (const line of lines) {
    if (line.startsWith("diff --git ")) {
      if (current) {
        current.chunk = `${currentChunk.join("\n")}\n`;
        files.push(current);
      }

      const match = /^diff --git a\/(.+) b\/(.+)$/.exec(line);
      const nextPath = normalizePath(match?.[2] ?? match?.[1] ?? "unknown");
      current = {
        path: nextPath,
        normalizedPath: nextPath.toLowerCase(),
        additions: 0,
        deletions: 0,
        chunk: ""
      };
      currentChunk = [line];
      continue;
    }

    if (!current) {
      continue;
    }

    currentChunk.push(line);

    if (line.startsWith("+++ b/")) {
      const path = normalizePath(line.slice(6));
      current.path = path;
      current.normalizedPath = path.toLowerCase();
      continue;
    }

    if (line.startsWith("+") && !line.startsWith("+++")) {
      current.additions += 1;
      continue;
    }

    if (line.startsWith("-") && !line.startsWith("---")) {
      current.deletions += 1;
    }
  }

  if (current) {
    current.chunk = `${currentChunk.join("\n")}\n`;
    files.push(current);
  }

  return files.map((file) => ({
    path: file.path,
    additions: file.additions,
    deletions: file.deletions,
    chunk: file.chunk
  }));
}

function rankPathMatch(candidate: string, findingPath: string): number {
  if (candidate === findingPath) {
    return 3;
  }

  if (candidate.endsWith(`/${findingPath}`) || findingPath.endsWith(`/${candidate}`)) {
    return 2;
  }

  if (candidate.includes(findingPath) || findingPath.includes(candidate)) {
    return 1;
  }

  return 0;
}

export function mapFindingToDiffAnchor(finding: Finding, diffFiles: DiffFileSummary[]): DiffLineAnchor | null {
  if (!diffFiles.length) {
    return null;
  }

  const normalizedFindingPath = normalizePath(finding.file).toLowerCase();

  const match = diffFiles
    .map((file) => ({ file, score: rankPathMatch(file.path.toLowerCase(), normalizedFindingPath) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)[0];

  if (!match) {
    return null;
  }

  const safeLine = finding.line > 0 ? finding.line : 1;

  return {
    filePath: match.file.path,
    line: safeLine,
    anchorId: buildDiffAnchorId(match.file.path, safeLine)
  };
}

export function lineAnchorForChange(filePath: string, change: { lineNumber?: number; oldLineNumber?: number }): string {
  const line = change.lineNumber ?? change.oldLineNumber ?? 1;
  return buildDiffAnchorId(filePath, line);
}
