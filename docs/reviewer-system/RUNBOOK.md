# Reviewer Runbook

## Purpose
Define the operating steps for running the reviewer system in two passes and producing auditable report artifacts.

## Inputs
- Prompt pack: `docs/reviewer-system/prompts/`
- Finding contract: `docs/reviewer-system/templates/finding-schema.md`
- Report contract: `docs/reviewer-system/templates/report-template.md`
- Reviewer skill policy: `docs/reviewer-system/reviewer-manifest.md`

## Pass 1: Baseline Review
1. Confirm required skills are installed (`npx skills list -g`) and match `reviewer-manifest.md`.
2. Run specialist reviewers against the agreed scope:
- full-repo baseline on first run,
- changed-files-first for follow-up runs.
3. Normalize each finding to the schema contract.
4. Run orchestrator dedupe and severity calibration.
5. Produce a baseline report using the report template.

## Pass 2: Verification Review
1. Apply fixes for accepted findings from pass 1.
2. Re-run relevant specialists for changed areas and impacted boundaries.
3. Mark resolved, unresolved, and deferred items.
4. Produce a verification report using the same template with pass metadata set to pass 2.

## Decision Policy
- Block when any `critical` or `high` finding has `high` confidence.
- Otherwise pass with follow-ups and explicit ownership/due window.
- Keep unresolved high-confidence risk visible in the final packet.

## Local Pre-Commit Gate
Use the local hook as the first enforcement point before code enters history.

### Setup
1. Run `npm run setup:hooks`.
2. Confirm `core.hooksPath=.githooks` and both hook files are executable with `npm run verify:hooks`.

### Runtime
1. `.githooks/pre-commit` gathers staged files.
2. `scripts/reviewer/neighbor-resolver.mjs` expands to one-hop neighbors and test counterparts.
3. `scripts/reviewer/reviewer-selection.json` picks specialists by path/risk plus orchestrator defaults.
4. `scripts/reviewer/precommit-review.mjs` runs the review pass and writes artifacts to `.git/codex/precommit/`.
5. `docs/reviewer-system/local-precommit-gate-policy.md` defines selection and blocking semantics.

### Exit contract
- `0`: allow commit (no blocking policy findings),
- `2`: block commit (unresolved `high|critical` + `high` confidence),
- `1`: tooling/runtime warning only (commit allowed).

### Operational notes
- One-off bypass: `SKIP_AI_REVIEW=1 git commit ...`
- Oversized scopes are truncated by configured file/byte caps and marked in the report.
- Reviewer execution has a bounded timeout; timeout is treated as warning, not block.
- Partially staged files are treated as warning-only to avoid evaluating unstaged content.
- Missing `codex` CLI or auth failures do not block commits; warnings are logged in artifacts.

## Output Artifacts
- Baseline report: `docs/reviewer-system/reports/<date>-pass1.md`
- Verification report: `docs/reviewer-system/reports/<date>-pass2.md`

Use ISO dates in filenames (`YYYY-MM-DD`) so report history is sortable and auditable.
