const REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export const REPO_AUTOLOAD_DEBOUNCE_MS = 450;

export function normalizeRepoInput(repo: string): string {
  const trimmed = repo.trim();
  return trimmed.endsWith(".git") ? trimmed.slice(0, -4) : trimmed;
}

export function isValidRepoFormat(repo: string): boolean {
  return REPO_PATTERN.test(normalizeRepoInput(repo));
}

export function repoValidationMessage(repo: string): string | null {
  const normalized = normalizeRepoInput(repo);
  if (!normalized) {
    return "Repository is required";
  }

  if (!isValidRepoFormat(normalized)) {
    return "Use owner/name format";
  }

  return null;
}

export function shouldAutoloadRepo(repo: string, githubToken?: string): boolean {
  if (!githubToken) {
    return false;
  }

  return isValidRepoFormat(repo);
}
