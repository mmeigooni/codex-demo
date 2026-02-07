import { Button } from "@/components/ui/button";
import { StoryModeToggle } from "@/components/workflow/story-mode-toggle";
import type { StoryMode } from "@/lib/brain-story-state";

interface SessionLike {
  user: {
    email?: string;
    user_metadata?: {
      avatar_url?: string;
      user_name?: string;
      full_name?: string;
    };
  };
}

interface TopBarProps {
  packName: string;
  repo: string;
  selectedPrLabel: string;
  runLabel: string;
  runHelper: string;
  runDisabled: boolean;
  session: SessionLike | null;
  userName: string;
  onRun: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  storyMode?: StoryMode;
  onStoryModeChange?: (mode: StoryMode) => void;
}

export function TopBar({
  packName,
  repo,
  selectedPrLabel,
  runLabel,
  runHelper,
  runDisabled,
  session,
  userName,
  onRun,
  onSignIn,
  onSignOut,
  storyMode,
  onStoryModeChange
}: TopBarProps) {
  return (
    <header className="sticky top-4 z-40 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-5 py-4 shadow-[var(--shadow-soft)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">
              Workflow Pack
            </span>
            <h1 className="text-lg font-semibold text-[var(--text-strong)]">{packName}</h1>
          </div>
          <p className="text-sm text-[var(--text-dim)]">
            <span className="font-medium text-[var(--text-strong)]">Repo:</span> {repo || "Not set"}
            <span className="mx-2 text-[var(--border-strong)]">•</span>
            <span className="font-medium text-[var(--text-strong)]">PR:</span> {selectedPrLabel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {storyMode && onStoryModeChange ? <StoryModeToggle mode={storyMode} onChange={onStoryModeChange} /> : null}
          {session ? (
            <>
              {session.user.user_metadata?.avatar_url ? (
                <img
                  src={session.user.user_metadata.avatar_url}
                  alt="User avatar"
                  className="h-8 w-8 rounded-full border border-[var(--border-subtle)]"
                />
              ) : null}
              <span className="hidden text-sm text-[var(--text-muted)] md:inline">{userName}</span>
              <Button variant="secondary" onClick={onSignOut}>
                Sign out
              </Button>
              <div className="ml-2 flex flex-col items-end gap-1">
                <Button variant="default" onClick={onRun} disabled={runDisabled}>
                  {runLabel}
                </Button>
                <p className="text-xs text-[var(--text-muted)]">{runHelper}</p>
              </div>
            </>
          ) : (
            <>
              <Button variant="default" onClick={onSignIn}>
                Connect GitHub
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
