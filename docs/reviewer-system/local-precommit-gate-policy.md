# Local Pre-Commit Multi-Agent Gate Policy

## Purpose
Define the local gate policy for staged changes enforced by `.githooks/pre-commit` and `scripts/reviewer/precommit-review.mjs`.

## Scope
1. Start from staged files:
- `git diff --cached --name-only --diff-filter=ACMR`
2. Keep only relevant paths:
- extensions: `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.sql`, `.md`, `.json`, `.yaml`, `.yml`
- or files under `app/`, `components/`, `lib/`, `tests/`, `docs/`, `supabase/`, `.github/`
3. Expand to impacted neighbors with `scripts/reviewer/neighbor-resolver.mjs`:
- one-hop relative imports from staged code files,
- counterpart source/test files (`*.test.*`, `*.spec.*`, and mirrored files under `tests/`).
4. Apply caps from `scripts/reviewer/reviewer-selection.json`:
- `maxFiles: 40`
- `maxBytes: 400000`
- caps apply to non-staged neighbor additions; staged files stay included.
5. If neighbor selection is truncated, truncation is recorded in review artifacts.

## Specialist Selection
Selection is deterministic and driven by `scripts/reviewer/reviewer-selection.json`.

Always included:
- `00-orchestrator`
- `01-code-review-excellence`

Conditional specialists (triggered when any selected file matches):
- `03-security`
  - `app/api/**`
  - `lib/auth*`
  - `lib/**/auth*`
  - `lib/env*`
  - `.env*`
  - `next.config.*`
  - `middleware.*`
- `04-nextjs`
  - `app/**`
  - `components/**`
  - `next.config.*`
  - `postcss.config.*`
  - `tailwind.config.*`
- `06-supabase`
  - `supabase/**`
  - `lib/supabase*`
  - `lib/**/supabase*`
  - `**/*.sql`

Testing specialist:
- reviewer: `05-testing`
- triggers when either is true:
  - selected files include `tests/**`, or
  - staged non-test code exists and at least one staged source file has no staged counterpart test update.
- counterpart test checks include:
  - sibling `foo.test.<ext>` / `foo.spec.<ext>`
  - mirrored `tests/<source>.test.<ext>` / `tests/<source>.spec.<ext>`

Simplifier specialist:
- reviewer: `02-code-simplifier`
- triggers when either is true:
  - staged file count `>= 3`, or
  - total staged changed lines from `git diff --cached --numstat` `>= 120`

## Block Criteria
A commit is blocked only when there is at least one unresolved finding where:
- `severity` is `high` or `critical`, and
- `confidence` is `high`, and
- `status` is not `resolved`

Hook/result semantics:
- reviewer script returns `2` for blocked
- `.githooks/pre-commit` maps that to hook exit `1` (commit stops)

## Warning Behavior
Warnings never block a commit.

Warning conditions include:
- `codex` CLI unavailable,
- `codex` execution failure,
- `codex` execution timeout,
- partially staged files (staged + unstaged edits in same file),
- non-JSON reviewer output,
- other reviewer tooling/runtime failures represented as reviewer exit `1`,
- unexpected reviewer exit codes (`.githooks/pre-commit` treats as allow).

Hook/runtime behavior:
- reviewer exit `1` -> hook prints warning and exits `0` (commit allowed)
- reviewer unexpected exit -> hook prints warning and exits `0` (commit allowed)
- missing `node` -> hook prints message and exits `0` (commit allowed)
- explicit bypass: `SKIP_AI_REVIEW=1 git commit ...` skips the gate

## Artifacts
Every review run writes audit artifacts under:
- `.git/codex/precommit/review-<timestamp>.md`
- `.git/codex/precommit/findings-<timestamp>.json`
- `.git/codex/precommit/summary-<timestamp>.txt`
