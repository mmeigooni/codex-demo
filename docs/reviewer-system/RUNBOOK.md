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

## Output Artifacts
- Baseline report: `docs/reviewer-system/reports/<date>-pass1.md`
- Verification report: `docs/reviewer-system/reports/<date>-pass2.md`

Use ISO dates in filenames (`YYYY-MM-DD`) so report history is sortable and auditable.
