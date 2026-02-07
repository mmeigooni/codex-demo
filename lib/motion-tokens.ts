export const MOTION_DURATIONS = {
  fast: 0.12,
  ui: 0.18,
  panel: 0.28,
  hero: 0.42,
  ambient: 5.5
} as const;

export const MOTION_EASINGS = {
  standard: [0.2, 0, 0, 1],
  emphasis: [0.16, 1, 0.3, 1],
  settle: [0.22, 1, 0.36, 1]
} as const;

export const MOTION_TRANSITIONS = {
  fast: {
    duration: MOTION_DURATIONS.fast,
    ease: MOTION_EASINGS.standard
  },
  ui: {
    duration: MOTION_DURATIONS.ui,
    ease: MOTION_EASINGS.standard
  },
  panel: {
    duration: MOTION_DURATIONS.panel,
    ease: MOTION_EASINGS.standard
  },
  hero: {
    duration: MOTION_DURATIONS.hero,
    ease: MOTION_EASINGS.emphasis
  },
  settle: {
    duration: MOTION_DURATIONS.ui,
    ease: MOTION_EASINGS.settle
  }
} as const;

export type SalienceLevel = "low" | "medium" | "high";

export function salienceGlowClass(salience: SalienceLevel): string {
  if (salience === "high") {
    return "story-mode-glow--high";
  }

  if (salience === "medium") {
    return "story-mode-glow--medium";
  }

  return "story-mode-glow--low";
}
