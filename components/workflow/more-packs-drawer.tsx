import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PLANNED_PACKS = ["Dependency Governance Pack", "CI Incident Triage Pack", "Checkout Test Repair Pack"];

export function MorePacksDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--text-strong)]">More packs</p>
          <p className="text-xs text-[var(--text-muted)]">Planned workflows are available as previews.</p>
        </div>
        <Button variant="secondary" onClick={() => setOpen((value) => !value)}>
          {open ? "Hide" : "Show"}
        </Button>
      </div>

      {open ? (
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {PLANNED_PACKS.map((name) => (
            <article key={name} className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-[var(--text-strong)]">{name}</p>
                <Badge variant="neutral">Planned</Badge>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Coming soon</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
