import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RecommendedPackOption } from "@/lib/pack-recommendation";
import type { WorkflowPack } from "@/lib/types";

interface PackSuggestionStripProps {
  packs: WorkflowPack[];
  selectedPackId: string | null;
  suggestedPackId: string | null;
  alternatives: RecommendedPackOption[];
  lockReason?: string;
  onSelectPack: (packId: string) => void;
}

function statusVariant(status: WorkflowPack["status"]): "success" | "warning" {
  return status === "active" ? "success" : "warning";
}

export function PackSuggestionStrip({
  packs,
  selectedPackId,
  suggestedPackId,
  alternatives,
  lockReason,
  onSelectPack
}: PackSuggestionStripProps) {
  const selectedPack = packs.find((pack) => pack.id === selectedPackId) ?? null;
  const suggestedPack = packs.find((pack) => pack.id === suggestedPackId) ?? null;
  const fallback = alternatives.find((candidate) => candidate.status === "active");

  return (
    <section className="space-y-3 rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">Step 2</p>
          <h3 className="text-sm font-semibold text-[var(--text-strong)]">Confirm workflow pack</h3>
        </div>
        {selectedPack ? <Badge variant={statusVariant(selectedPack.status)}>{selectedPack.status === "active" ? "Active" : "Coming Soon"}</Badge> : null}
      </header>

      {suggestedPack ? (
        <article className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">Suggested pack</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-strong)]">{suggestedPack.name}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{suggestedPack.description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="px-2 py-1 text-xs"
              onClick={() => onSelectPack(suggestedPack.id)}
              disabled={selectedPackId === suggestedPack.id}
            >
              {selectedPackId === suggestedPack.id ? "Selected" : "Use suggested"}
            </Button>
            <Badge variant={statusVariant(suggestedPack.status)}>{suggestedPack.status === "active" ? "Active" : "Coming Soon"}</Badge>
          </div>
        </article>
      ) : (
        <p className="text-xs text-[var(--text-muted)]">Select a PR to generate a workflow pack recommendation.</p>
      )}

      {lockReason ? (
        <div className="rounded-[var(--radius-input)] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <p>{lockReason}</p>
          {fallback ? (
            <Button variant="secondary" className="mt-2 px-2 py-1 text-xs" onClick={() => onSelectPack(fallback.id)}>
              Switch to {fallback.name}
            </Button>
          ) : null}
        </div>
      ) : null}

      {alternatives.length ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">Alternatives</p>
          <div className="flex flex-wrap gap-2">
            {alternatives.slice(0, 3).map((option) => (
              <Button
                key={option.id}
                variant="ghost"
                className="px-2 py-1 text-xs"
                onClick={() => onSelectPack(option.id)}
                disabled={selectedPackId === option.id}
              >
                {option.name}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
