import type { TimelineNode } from "@/lib/types";

interface MemoryTimelineProps {
  nodes: TimelineNode[];
  selectedNodeId?: string;
  onSelectNode: (node: TimelineNode) => void;
  compact?: boolean;
}

function verdictTone(verdict?: TimelineNode["verdict"]): string {
  if (verdict === "pass") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  if (verdict === "block") {
    return "border-rose-300 bg-rose-50 text-rose-700";
  }

  if (verdict === "warnings") {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }

  return "border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-muted)]";
}

function verdictLabel(verdict?: TimelineNode["verdict"]): string {
  if (verdict === "pass") return "PASS";
  if (verdict === "warnings") return "REVIEW";
  if (verdict === "block") return "BLOCK";
  return "RUN";
}

export function MemoryTimeline({ nodes, selectedNodeId, onSelectNode, compact = false }: MemoryTimelineProps) {
  if (!nodes.length) {
    return (
      <section className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">
        Timeline will appear after memory versions and runs are available.
      </section>
    );
  }

  return (
    <section className={`space-y-3 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] ${compact ? "p-3" : "p-4"} shadow-[var(--shadow-soft)]`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text-strong)]">Memory Timeline</p>
          {!compact ? (
            <p className="text-xs text-[var(--text-muted)]">Track learning over runs and jump directly to the underlying context.</p>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <ol className="flex min-w-max items-start gap-3 pr-2">
          {nodes.map((node, index) => {
            const selected = selectedNodeId === node.id;
            const isMemoryNode = node.type === "memory_version";
            const toneClass = isMemoryNode
              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
              : verdictTone(node.verdict);

            return (
              <li key={node.id} className="relative flex items-start">
                {index > 0 ? (
                  <span className="absolute -left-3 top-[20px] h-[1px] w-3 bg-[var(--border-subtle)]" />
                ) : null}

                <button
                  type="button"
                  onClick={() => onSelectNode(node)}
                  className={`rounded-[var(--radius-input)] border p-3 text-left transition hover:bg-[var(--surface-muted)] ${
                    selected ? "ring-2 ring-[var(--accent)] ring-offset-1" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 inline-block h-4 w-4 rounded-full border ${
                        isMemoryNode ? "border-[var(--accent)] bg-[var(--accent)]" : "border-current bg-current"
                      }`}
                    />
                    <div className="space-y-1">
                      <div className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${toneClass}`}>
                        {isMemoryNode ? `MEMORY v${node.memoryVersion ?? "-"}` : verdictLabel(node.verdict)}
                      </div>
                        <p className={`${compact ? "max-w-[180px]" : "max-w-[210px]"} text-sm font-medium text-[var(--text-strong)]`}>
                          {isMemoryNode ? `Approved by ${node.approvedBy ?? "unknown"}` : node.prTitle ?? "Run"}
                        </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {isMemoryNode
                          ? `${node.ruleCount ?? 0} rules`
                          : `${node.findingCount ?? 0} findings · Memory v${node.memoryVersionUsed ?? "-"}`}
                      </p>
                      <p className="text-[11px] text-[var(--text-dim)]">{new Date(node.date).toLocaleString()}</p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
