import { motion } from "framer-motion";

import type { BrainStoryState } from "@/lib/brain-story-state";
import { MOTION_DURATIONS, MOTION_TRANSITIONS, salienceGlowClass } from "@/lib/motion-tokens";

interface BrainHeroProps {
  state: BrainStoryState;
}

function actTitle(state: BrainStoryState): string {
  if (state.act === "conflict") {
    return "Conflict: anomaly detection active";
  }

  if (state.act === "learning") {
    return "Learning: index and consolidation active";
  }

  return "Signal: context scan active";
}

function phaseLabel(state: BrainStoryState): string {
  if (state.phase === "detect") {
    return "Detect";
  }

  if (state.phase === "index") {
    return "Index";
  }

  if (state.phase === "consolidate") {
    return "Consolidate";
  }

  return "Scan";
}

export function BrainHero({ state }: BrainHeroProps) {
  return (
    <section
      className={`story-mode-surface rounded-[var(--radius-card)] border border-[var(--border-subtle)] p-4 ${salienceGlowClass(state.salience)}`}
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">Hippocampus Signal</p>
          <p className="text-sm font-semibold text-[var(--text-strong)]">{actTitle(state)}</p>
          <p className="text-xs text-[var(--text-muted)]">
            Phase: {phaseLabel(state)} · cues: {state.cueCount} · salience: {state.salience}
          </p>
        </div>

        <motion.svg
          width="128"
          height="64"
          viewBox="0 0 128 64"
          role="img"
          aria-label="Abstract hippocampus signal"
          initial={false}
          animate={{ opacity: state.mode === "on" ? 1 : 0.55 }}
          transition={MOTION_TRANSITIONS.ui}
        >
          <motion.path
            d="M8 34 C 20 8, 44 8, 56 26 C 64 38, 80 40, 94 28 C 102 22, 112 24, 120 36"
            fill="none"
            stroke="var(--neuro-core)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{
              pathLength: state.mode === "on" ? 1 : 0.6
            }}
            transition={MOTION_TRANSITIONS.hero}
          />
          <motion.circle
            cx="56"
            cy="26"
            r="7"
            fill="var(--neuro-cue)"
            animate={{
              scale: state.salience === "high" ? [1, 1.12, 1] : state.salience === "medium" ? [1, 1.06, 1] : 1
            }}
            transition={{
              duration: MOTION_DURATIONS.ambient,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.circle
            cx="94"
            cy="28"
            r="5"
            fill="var(--neuro-core)"
            animate={{
              scale: state.hasSuggestions ? [1, 1.09, 1] : 1,
              opacity: state.hasSuggestions ? [0.75, 1, 0.75] : 0.75
            }}
            transition={{
              duration: MOTION_DURATIONS.ambient,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.45
            }}
          />
        </motion.svg>
      </div>
    </section>
  );
}
