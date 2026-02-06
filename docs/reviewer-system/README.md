# Reviewer System

## Purpose
This repository uses a dedicated multi-reviewer workflow to keep code easy to understand, safe to ship, and clean enough for open-source scrutiny.

The reviewer system is designed to:
- catch defects and security issues early,
- keep architecture and implementation intent explicit,
- improve readability and maintainability over time,
- provide consistent, auditable review outputs.

## Quality Standard
Reviews are balanced across four equal axes:
- maintainability,
- security,
- testing quality,
- architecture.

No axis is treated as secondary in final review decisions.

## Governance Model
The workflow uses specialist reviewers plus one orchestrator.

Decision rule:
- block when any `critical` or `high` finding has `high` confidence,
- otherwise pass with tracked follow-ups as needed.

Every review cycle runs in two passes:
1. initial findings,
2. verification pass after fixes.

## Scope Policy
Review scope follows this policy:
- first run on this repository is a full-repo baseline,
- all subsequent runs are changed-files-first,
- neighboring modules may be pulled in when a boundary risk is detected.

## Operating Mode
The system is manual-first:
- reviewers run via prompt pack and documented contracts,
- findings are captured in Markdown reports,
- CI integration is intentionally deferred until the manual flow is stable.

## Artifacts
The reviewer system is implemented through:
- reviewer manifest: `docs/reviewer-system/reviewer-manifest.md`,
- prompts: `docs/reviewer-system/prompts/`,
- contracts/templates: `docs/reviewer-system/templates/`,
- runbook: `docs/reviewer-system/RUNBOOK.md`,
- reports: `docs/reviewer-system/reports/`.

## Enforcement
Before each reviewer-system PR merge, run:
- `npm run typecheck`
- `npm run test:run`
- `npm run build`

These commands protect runtime functionality while the review process evolves.
