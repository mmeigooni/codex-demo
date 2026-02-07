import { PrContextPanel } from "@/components/workflow/pr-context-panel";
import type { GitHubPullRequest } from "@/lib/types";

interface PrFirstSelectorProps {
  repo: string;
  onRepoChange: (value: string) => void;
  repoValidationMessage: string | null;
  hasGithubAuth: boolean;
  pullRequests: GitHubPullRequest[];
  loadingPrs: boolean;
  loadingDiff: boolean;
  selectedPrNumber: number | null;
  selectedPrTitle: string;
  selectedPrUrl: string;
  onRefreshPullRequests: () => void;
  onSelectPullRequest: (pullNumber: number) => void;
}

export function PrFirstSelector({
  repo,
  onRepoChange,
  repoValidationMessage,
  hasGithubAuth,
  pullRequests,
  loadingPrs,
  loadingDiff,
  selectedPrNumber,
  selectedPrTitle,
  selectedPrUrl,
  onRefreshPullRequests,
  onSelectPullRequest
}: PrFirstSelectorProps) {
  return (
    <section className="space-y-3">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">Step 1</p>
        <h2 className="text-sm font-semibold text-[var(--text-strong)]">Select pull request</h2>
        <p className="text-xs text-[var(--text-muted)]">Pick repo and PR first, then confirm the suggested workflow pack.</p>
      </header>

      <PrContextPanel
        repo={repo}
        onRepoChange={onRepoChange}
        repoValidationMessage={repoValidationMessage}
        hasGithubAuth={hasGithubAuth}
        pullRequests={pullRequests}
        loadingPrs={loadingPrs}
        loadingDiff={loadingDiff}
        selectedPrNumber={selectedPrNumber}
        selectedPrTitle={selectedPrTitle}
        selectedPrUrl={selectedPrUrl}
        onRefreshPullRequests={onRefreshPullRequests}
        onSelectPullRequest={onSelectPullRequest}
      />
    </section>
  );
}
