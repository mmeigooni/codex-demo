import { afterEach, describe, expect, test, vi } from "vitest";

import { loadStoryMode, saveStoryMode, STORY_MODE_STORAGE_KEY } from "@/lib/story-mode-storage";

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("story-mode-storage", () => {
  test("defaults to off when no window exists", () => {
    vi.stubGlobal("window", undefined);
    expect(loadStoryMode()).toBe("off");
  });

  test("loads persisted valid value", () => {
    const localStorage = new MemoryStorage();
    localStorage.setItem(STORY_MODE_STORAGE_KEY, "on");
    vi.stubGlobal("window", { localStorage });

    expect(loadStoryMode()).toBe("on");
  });

  test("falls back to off for invalid value", () => {
    const localStorage = new MemoryStorage();
    localStorage.setItem(STORY_MODE_STORAGE_KEY, "maybe");
    vi.stubGlobal("window", { localStorage });

    expect(loadStoryMode()).toBe("off");
  });

  test("saves selected story mode when window exists", () => {
    const localStorage = new MemoryStorage();
    vi.stubGlobal("window", { localStorage });

    saveStoryMode("on");

    expect(localStorage.getItem(STORY_MODE_STORAGE_KEY)).toBe("on");
  });
});
