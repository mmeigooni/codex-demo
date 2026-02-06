import { describe, expect, test } from "vitest";

import {
  REPO_AUTOLOAD_DEBOUNCE_MS,
  isValidRepoFormat,
  normalizeRepoInput,
  repoValidationMessage,
  shouldAutoloadRepo
} from "@/lib/repo-utils";

describe("repo utils", () => {
  test("normalizes and validates repository format", () => {
    expect(normalizeRepoInput("  owner/repo.git ")).toBe("owner/repo");
    expect(isValidRepoFormat("owner/repo")).toBe(true);
    expect(isValidRepoFormat("owner")).toBe(false);
  });

  test("returns meaningful validation messages", () => {
    expect(repoValidationMessage("")).toBe("Repository is required");
    expect(repoValidationMessage("owner")).toBe("Use owner/name format");
    expect(repoValidationMessage("owner/repo")).toBeNull();
  });

  test("autoload is gated by token and valid repo", () => {
    expect(shouldAutoloadRepo("owner/repo", "token")).toBe(true);
    expect(shouldAutoloadRepo("owner", "token")).toBe(false);
    expect(shouldAutoloadRepo("owner/repo", undefined)).toBe(false);
  });

  test("debounce constant is tuned for typeahead", () => {
    expect(REPO_AUTOLOAD_DEBOUNCE_MS).toBeGreaterThanOrEqual(300);
    expect(REPO_AUTOLOAD_DEBOUNCE_MS).toBeLessThanOrEqual(1000);
  });
});
