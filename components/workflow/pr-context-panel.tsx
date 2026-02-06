import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { GitHubPullRequest } from "@/lib/types";

interface PrContextPanelProps {
  repo: string;
  onRepoChange: (value: string) => void;
  repoValidationMessage: string | null;
  pullRequests: GitHubPullRequest[];
  loadingPrs: boolean;
  loadingDiff: boolean;
  selectedPrNumber: number | null;
  selectedPrTitle: string;
  selectedPrUrl: string;
  onRefreshPullRequests: () => void;
  onSelectPullRequest: (pullNumber: number) => void;
}

function formatRelativeTime(updatedAt: string): string {
  const updated = new Date(updatedAt).getTime();
  const now = Date.now();
  const diffMinutes = Math.floor((now - updated) / 60_000);

  if (!Number.isFinite(diffMinutes) || diffMinutes < 1) {
    return "just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return `${Math.floor(diffHours / 24)}d ago`;
}

export function PrContextPanel({
  repo,
  onRepoChange,
  repoValidationMessage,
  pullRequests,
  loadingPrs,
  loadingDiff,
  selectedPrNumber,
  selectedPrTitle,
  selectedPrUrl,
  onRefreshPullRequests,
  onSelectPullRequest
}: PrContextPanelProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredPullRequests = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return pullRequests;
    }

    return pullRequests.filter((pullRequest) => {
      const text = `${pullRequest.number} ${pullRequest.title} ${pullRequest.user.login}`.toLowerCase();
      return text.includes(normalized);
    });
  }, [pullRequests, query]);

  const selectedPullRequest = useMemo(
    () => pullRequests.find((pullRequest) => pullRequest.number === selectedPrNumber) ?? null,
    [pullRequests, selectedPrNumber]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, pullRequests.length]);

  return (
    <section className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">Repository</label>
        <div className="flex gap-2">
          <input
            className="w-full rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-3 py-2 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            value={repo}
            onChange={(event) => onRepoChange(event.target.value)}
            placeholder="owner/name"
            aria-invalid={Boolean(repoValidationMessage)}
          />
          <Button variant="secondary" onClick={onRefreshPullRequests} disabled={loadingPrs || Boolean(repoValidationMessage)}>
            {loadingPrs ? "Refreshing..." : "Refresh PRs"}
          </Button>
        </div>
        {repoValidationMessage ? (
          <p className="mt-1 text-xs text-red-700">{repoValidationMessage}</p>
        ) : (
          <p className="mt-1 text-xs text-[var(--text-muted)]">PRs auto-load when repository format is valid.</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">Open pull requests</label>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (!filteredPullRequests.length) {
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => Math.min(filteredPullRequests.length - 1, index + 1));
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(0, index - 1));
            }

            if (event.key === "Enter") {
              event.preventDefault();
              const selected = filteredPullRequests[activeIndex];
              if (selected) {
                onSelectPullRequest(selected.number);
              }
            }
          }}
          placeholder="Search PRs by number, title, or author"
          className="mb-2 w-full rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-3 py-2 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        />

        <div
          role="listbox"
          aria-label="Pull request options"
          className="max-h-[220px] overflow-auto rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-primary)]"
        >
          {filteredPullRequests.length ? (
            filteredPullRequests.map((pullRequest, index) => {
              const isActive = index === activeIndex;
              const isSelected = pullRequest.number === selectedPrNumber;

              return (
                <button
                  key={pullRequest.number}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => onSelectPullRequest(pullRequest.number)}
                  className={`w-full border-b border-[var(--border-subtle)] px-3 py-2 text-left transition last:border-b-0 ${
                    isSelected
                      ? "bg-[var(--accent-soft)]"
                      : isActive
                        ? "bg-[var(--surface-muted)]"
                        : "bg-[var(--surface-primary)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-strong)]">#{pullRequest.number} · {pullRequest.title}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <img
                          src={pullRequest.user.avatar_url}
                          alt={`${pullRequest.user.login} avatar`}
                          className="h-4 w-4 rounded-full"
                        />
                        {pullRequest.user.login} · updated {formatRelativeTime(pullRequest.updated_at)}
                      </p>
                    </div>

                    <p className="text-xs text-[var(--text-dim)]">
                      {pullRequest.changed_files} files · +{pullRequest.additions} / -{pullRequest.deletions}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="px-3 py-4 text-sm text-[var(--text-muted)]">{loadingPrs ? "Loading pull requests..." : "No pull requests found."}</p>
          )}
        </div>
      </div>

      {selectedPrTitle ? (
        <article className="rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">
          <p className="text-sm font-semibold text-[var(--text-strong)]">{selectedPrTitle}</p>
          {selectedPullRequest ? (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              #{selectedPullRequest.number} · {selectedPullRequest.changed_files} files · +
              {selectedPullRequest.additions} / -{selectedPullRequest.deletions}
            </p>
          ) : null}
          <a className="mt-1 inline-block text-sm text-[var(--accent)] underline" href={selectedPrUrl} target="_blank" rel="noreferrer">
            Open on GitHub
          </a>
          {loadingDiff ? <p className="mt-1 text-xs text-[var(--text-muted)]">Loading diff...</p> : null}
        </article>
      ) : null}
    </section>
  );
}
