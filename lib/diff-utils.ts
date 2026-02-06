import picomatch from "picomatch";

import type { PreparedDiff } from "@/lib/types";

interface DiffFileBlock {
  path: string;
  chunk: string;
}

function splitDiffByFile(diff: string): DiffFileBlock[] {
  const blocks = diff
    .split(/^diff --git /m)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => `diff --git ${chunk}`);

  return blocks.map((chunk) => {
    const match = chunk.match(/^\+\+\+ b\/(.+)$/m) ?? chunk.match(/^--- a\/(.+)$/m);
    const path = match?.[1]?.trim() ?? "unknown";

    return { path, chunk: `${chunk}\n` };
  });
}

export function filterDiffByScope(diff: string, globs: string[]): { filtered: string; originalFiles: number; includedFiles: number } {
  const files = splitDiffByFile(diff);
  const matchers = globs.map((glob) => picomatch(glob));
  const scoped = files.filter((file) => matchers.some((matcher) => matcher(file.path)));

  return {
    filtered: scoped.map((file) => file.chunk).join(""),
    originalFiles: files.length,
    includedFiles: scoped.length
  };
}

export function prepareDiff(rawDiff: string, globs: string[], maxBytes = 12_000): PreparedDiff {
  const { filtered, originalFiles, includedFiles } = filterDiffByScope(rawDiff, globs);
  const bytes = Buffer.byteLength(filtered, "utf8");
  const truncated = bytes > maxBytes;
  const diff = truncated ? filtered.slice(0, maxBytes) : filtered;

  return {
    diff,
    truncated,
    originalFiles,
    includedFiles
  };
}
