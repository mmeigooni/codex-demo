# PR Description Guidelines

This repo defaults to the same structure used in PR #7:
- `## Root cause`
- `## Changes`
- `## Validation`

The structure is a default, not a rigid rule. Keep the narrative clear and adapt section wording when needed.

## Workflow Default

1. Before opening a PR, draft/review the description with `$pr-flow-descriptions`.
2. Choose the correct lead section for PR type:
- defect/regression/security: `## Root cause`
- feature/docs/chore/refactor: `## Context` or `## Goal`
3. Remove all placeholders before submission; no empty bullets are allowed.
4. In sequential reviewer-system flows, include an explicit approval pause statement before moving to the next PR.

## Section formatting standard

1. Use real markdown line breaks and bullets.
2. Keep each section concise and evidence-based.
3. Prefer concrete statements over broad claims.
4. Include commands exactly as executed in `Validation`.
5. Use present/past tense consistently inside one PR body.

## Section intent and writing guidance

### Root cause
Use for defects, regressions, or security issues.

Include:
- what failed or could fail,
- why it failed (mechanism, not blame),
- user or system impact at a high level.

If there is no defect (feature/docs/chore/refactor), rename this section to `## Context` or `## Goal` and explain why the change is being made now.

### Changes
List what changed in reviewer-friendly bullets.

Good bullet characteristics:
- one meaningful change per bullet,
- clear scope boundaries,
- mention important paths/modules when helpful,
- call out behavior changes and non-goals.

### Validation
Show how confidence was established.

Possible validation content:
- automated checks (`npm run typecheck`, tests, build),
- targeted manual verification steps,
- screenshots/logs/notes when UI or behavior is hard to express via commands,
- explicit "not run" note when validation is deferred.

## Guidance by PR type (flexible defaults)

### Bug fix / regression
- Prefer `## Root cause`, `## Changes`, `## Validation`.
- In `Root cause`, state trigger + failing behavior + cause.
- In `Validation`, include repro-before/repro-after when practical.

### Feature
- Use `## Goal` or `## Context` instead of `## Root cause` if no defect exists.
- In `Changes`, separate user-facing behavior from internal plumbing.
- In `Validation`, include happy path and one edge path.

### Refactor
- Use `## Context` to explain why refactor is needed now.
- In `Changes`, state preserved behavior and moved boundaries.
- In `Validation`, include regression-focused tests/checks.

### Docs / process
- Use `## Context` for audience, scope, and motivation.
- In `Changes`, list added/updated docs and what decisions they codify.
- In `Validation`, include link/preview checks or consistency checks.

### Dependency / tooling / chore
- Use `## Context` for risk, compatibility, and motivation.
- In `Changes`, highlight version shifts, config changes, and expected impact.
- In `Validation`, include lockfile/build/test status and any migration checks.

## Style guardrails

- Avoid one-line wall-of-text summaries.
- Avoid literal escaped newline text (for example `\n`) in the PR body.
- Avoid overclaiming certainty ("fully fixed", "no risk") unless proven.
- Avoid dumping unrelated implementation detail that is better placed in code comments.

## Quick examples

### Defect-oriented
```md
## Root cause
Refresh called the loader, but client logic returned early when a token was absent, so clicks appeared to do nothing.

## Changes
- Removed client-side token hard dependency for PR fetch path.
- Kept server-side session-based token resolution.
- Added UI gating and helper text when auth state is incomplete.

## Validation
- npm run typecheck
- npm run test:run
- npm run build
```

### Non-defect (docs/process)
```md
## Context
We are formalizing reviewer workflow expectations before adding automation.

## Changes
- Added reviewer-system governance and scope documentation.
- Added skill-source policy and role ownership manifest.
- Documented installation and verification commands.

## Validation
- Reviewed markdown rendering in GitHub preview.
- npm run typecheck
```
