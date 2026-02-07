import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface DetailsDrawerProps {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function DetailsDrawer({ open, onToggle, children }: DetailsDrawerProps) {
  return (
    <section className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-primary)]">
      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">Details</p>
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={onToggle}>
          {open ? "Hide" : "Show"}
        </Button>
      </div>
      {open ? <div className="border-t border-[var(--border-subtle)] p-3">{children}</div> : null}
    </section>
  );
}
