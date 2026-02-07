import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { StoryMode } from "@/lib/brain-story-state";

export interface UnifiedDetailsTab {
  id: string;
  label: string;
  content: ReactNode;
}

interface UnifiedDetailsDrawerProps {
  open: boolean;
  activeTab: string;
  tabs: UnifiedDetailsTab[];
  storyMode?: StoryMode;
  onToggle: () => void;
  onSelectTab: (tabId: string) => void;
}

const STORY_TAB_LABELS: Record<string, string> = {
  diff: "Evidence",
  timeline: "Episodes",
  memory: "Index",
  run_details: "Cortex Record"
};

export function UnifiedDetailsDrawer({ open, activeTab, tabs, storyMode = "off", onToggle, onSelectTab }: UnifiedDetailsDrawerProps) {
  const selectedTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0] ?? null;

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">{storyMode === "on" ? "Cognitive Details" : "Details"}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {storyMode === "on"
              ? "Evidence, episode timeline, memory index, and cortical run record."
              : "Diff, timeline, memory, and run diagnostics."}
          </p>
        </div>
        <Button
          variant="ghost"
          className="h-8 w-8 rounded-full border border-[var(--border-subtle)] p-0 text-sm"
          onClick={onToggle}
          aria-label={open ? "Close details drawer" : "Open details drawer"}
          title={open ? "Close details" : "Open details"}
        >
          i
        </Button>
      </div>

      {open && selectedTab ? (
        <div className="mt-3 space-y-3 border-t border-[var(--border-subtle)] pt-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={tab.id === selectedTab.id ? "secondary" : "ghost"}
                className="px-2 py-1 text-xs"
                onClick={() => onSelectTab(tab.id)}
              >
                {storyMode === "on" ? STORY_TAB_LABELS[tab.id] ?? tab.label : tab.label}
              </Button>
            ))}
          </div>

          <div>{selectedTab.content}</div>
        </div>
      ) : null}
    </section>
  );
}
