import type { StoryMode } from "@/lib/brain-story-state";

export const STORY_MODE_STORAGE_KEY = "workflow.storyMode.v1";

function isStoryMode(value: unknown): value is StoryMode {
  return value === "on" || value === "off";
}

export function loadStoryMode(): StoryMode {
  if (typeof window === "undefined") {
    return "off";
  }

  try {
    const storedValue = window.localStorage.getItem(STORY_MODE_STORAGE_KEY);
    return isStoryMode(storedValue) ? storedValue : "off";
  } catch {
    return "off";
  }
}

export function saveStoryMode(mode: StoryMode): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORY_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore storage failures so runtime interaction remains usable.
  }
}
