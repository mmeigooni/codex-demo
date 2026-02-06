import { useEffect, useMemo, useState } from "react";
import { Diff, Hunk, getChangeKey, parseDiff, type ChangeData, type HunkData, type ViewType } from "react-diff-view";

import { Button } from "@/components/ui/button";
import { extractDiffFileChunks, lineAnchorForChange } from "@/lib/diff-anchors";
import type { DiffLineAnchor } from "@/lib/types";

interface DiffPanelProps {
  diffText: string;
  loading: boolean;
  jumpAnchor: DiffLineAnchor | null;
  onJumpHandled: () => void;
}

interface ParsedFile {
  path: string;
  diffType: string;
  hunks: HunkData[];
}

function fileIncludesQuery(file: ParsedFile, query: string): boolean {
  if (!query) {
    return true;
  }

  const normalized = query.toLowerCase();
  if (file.path.toLowerCase().includes(normalized)) {
    return true;
  }

  return file.hunks.some((hunk) => hunk.changes.some((change) => change.content.toLowerCase().includes(normalized)));
}

function filterHunksByQuery(hunks: HunkData[], query: string): HunkData[] {
  if (!query) {
    return hunks;
  }

  const normalized = query.toLowerCase();

  return hunks
    .map((hunk) => ({
      ...hunk,
      changes: hunk.changes.filter((change) => change.content.toLowerCase().includes(normalized))
    }))
    .filter((hunk) => hunk.changes.length > 0);
}

function findHighlightedChangeKeys(hunks: HunkData[], line: number | null): string[] {
  if (!line) {
    return [];
  }

  const keys: string[] = [];
  for (const hunk of hunks) {
    for (const change of hunk.changes) {
      const newLine = "lineNumber" in change ? change.lineNumber : undefined;
      const oldLine = "oldLineNumber" in change ? change.oldLineNumber : undefined;
      if (newLine === line || oldLine === line) {
        keys.push(getChangeKey(change));
      }
    }
  }

  return keys;
}

export function DiffPanel({ diffText, loading, jumpAnchor, onJumpHandled }: DiffPanelProps) {
  const [viewType, setViewType] = useState<ViewType>("unified");
  const [search, setSearch] = useState("");
  const [selectedPath, setSelectedPath] = useState<string>("");

  const diffChunks = useMemo(() => extractDiffFileChunks(diffText), [diffText]);

  const parsed = useMemo(() => {
    if (!diffText.trim()) {
      return { files: [] as ParsedFile[], parseError: false };
    }

    try {
      const files = parseDiff(diffText, { nearbySequences: "zip" }).map((file) => ({
        path: String(file.newPath || file.oldPath || "unknown"),
        diffType: String(file.type),
        hunks: file.hunks as HunkData[]
      }));

      return { files, parseError: false };
    } catch {
      return { files: [] as ParsedFile[], parseError: true };
    }
  }, [diffText]);

  const parsedFiles = useMemo(
    () => parsed.files.filter((file) => fileIncludesQuery(file, search)),
    [parsed.files, search]
  );

  useEffect(() => {
    if (!parsedFiles.length) {
      setSelectedPath("");
      return;
    }

    if (!parsedFiles.some((file) => file.path === selectedPath)) {
      setSelectedPath(parsedFiles[0].path);
    }
  }, [parsedFiles, selectedPath]);

  useEffect(() => {
    if (!jumpAnchor) {
      return;
    }

    setSelectedPath(jumpAnchor.filePath);
    setTimeout(() => {
      const anchor = document.getElementById(jumpAnchor.anchorId);
      if (anchor) {
        anchor.scrollIntoView({ block: "center" });
      }
      onJumpHandled();
    }, 80);
  }, [jumpAnchor, onJumpHandled]);

  if (!diffText.trim()) {
    return (
      <section className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4">
        <p className="text-sm font-semibold text-[var(--text-strong)]">Ready to analyze a PR</p>
        <ol className="mt-2 space-y-1 text-sm text-[var(--text-muted)]">
          <li>1. Connect GitHub and choose a repository.</li>
          <li>2. Pick an open pull request from the list.</li>
          <li>3. Run analysis to load findings and jumpable code references.</li>
        </ol>
      </section>
    );
  }

  if (parsed.parseError) {
    return (
      <section className="space-y-2">
        <div className="rounded-[var(--radius-input)] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Diff parser failed. Showing raw fallback preview.
        </div>
        <pre className="h-[420px] overflow-auto rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[#07121f] p-3 font-mono text-xs text-[#b9f5db]">
          {diffText}
        </pre>
      </section>
    );
  }

  const selectedFile = parsed.files.find((file) => file.path === selectedPath) ?? parsed.files[0] ?? null;
  const displayedHunks = selectedFile ? filterHunksByQuery(selectedFile.hunks, search) : [];
  const highlightedKeys = findHighlightedChangeKeys(displayedHunks, jumpAnchor?.line ?? null);

  const chunkByPath = new Map(diffChunks.map((file) => [file.path, file.chunk]));

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search file path or diff content"
          className="flex-1 rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-3 py-2 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        />
        <div className="flex items-center gap-1 rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-1">
          <Button variant={viewType === "unified" ? "secondary" : "ghost"} className="px-2 py-1 text-xs" onClick={() => setViewType("unified")}>
            Unified
          </Button>
          <Button variant={viewType === "split" ? "secondary" : "ghost"} className="px-2 py-1 text-xs" onClick={() => setViewType("split")}>
            Split
          </Button>
        </div>
        <Button
          variant="secondary"
          className="px-2 py-1 text-xs"
          onClick={async () => {
            if (!selectedFile) {
              return;
            }

            const chunk = chunkByPath.get(selectedFile.path) ?? "";
            if (chunk && navigator.clipboard) {
              await navigator.clipboard.writeText(chunk);
            }
          }}
        >
          Copy snippet
        </Button>
      </div>

      <div className="grid gap-3 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="max-h-[420px] overflow-auto rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-primary)]">
          {parsedFiles.map((file) => {
            const summary = diffChunks.find((entry) => entry.path === file.path);
            const active = file.path === selectedPath;

            return (
              <button
                key={file.path}
                type="button"
                onClick={() => setSelectedPath(file.path)}
                className={`w-full border-b border-[var(--border-subtle)] px-3 py-2 text-left text-sm last:border-b-0 ${
                  active ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--surface-muted)]"
                }`}
              >
                <p className="truncate font-medium text-[var(--text-strong)]">{file.path}</p>
                {summary ? (
                  <p className="text-xs text-[var(--text-dim)]">+{summary.additions} / -{summary.deletions}</p>
                ) : null}
              </button>
            );
          })}
        </aside>

        <div className="h-[420px] overflow-auto rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-2">
          {selectedFile && displayedHunks.length ? (
            <Diff
              viewType={viewType}
              diffType={selectedFile.diffType as "add" | "delete" | "modify" | "rename" | "copy"}
              hunks={displayedHunks}
              gutterType="anchor"
              generateAnchorID={(change) => lineAnchorForChange(selectedFile.path, change as ChangeData)}
              selectedChanges={highlightedKeys}
            >
              {(hunks) => hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)}
            </Diff>
          ) : (
            <p className="px-3 py-6 text-sm text-[var(--text-muted)]">{loading ? "Loading diff..." : "No lines matched this search."}</p>
          )}
        </div>
      </div>
    </section>
  );
}
