import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import type { StoryMode } from "@/lib/brain-story-state";
import { MOTION_TRANSITIONS } from "@/lib/motion-tokens";

interface StoryModeToggleProps {
  mode: StoryMode;
  onChange: (mode: StoryMode) => void;
  disabled?: boolean;
}

export function StoryModeToggle({ mode, onChange, disabled = false }: StoryModeToggleProps) {
  const nextMode: StoryMode = mode === "on" ? "off" : "on";

  return (
    <Button
      type="button"
      variant={mode === "on" ? "secondary" : "ghost"}
      className="relative h-9 min-w-[132px] overflow-hidden px-3"
      aria-pressed={mode === "on"}
      aria-label={mode === "on" ? "Disable Story Mode" : "Enable Story Mode"}
      onClick={() => onChange(nextMode)}
      disabled={disabled}
    >
      <motion.span
        className="pointer-events-none absolute inset-0 rounded-[var(--radius-input)]"
        animate={{
          opacity: mode === "on" ? 1 : 0,
          scale: mode === "on" ? 1 : 0.97
        }}
        transition={MOTION_TRANSITIONS.ui}
        style={{
          background:
            "linear-gradient(120deg, rgb(19 82 163 / 12%), rgb(45 159 145 / 12%))"
        }}
      />
      <span className="relative z-10 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">
        <span aria-hidden="true">Neuro</span>
        {mode === "on" ? "Story Mode On" : "Story Mode Off"}
      </span>
    </Button>
  );
}
