# Review Report Template Contract

## Purpose
Provide a consistent markdown report structure for orchestrator output and approval packets.

## Template
```md
# Review Report

## Metadata
- Repository: <owner/repo>
- Branch/PR: <branch-or-pr>
- Scope Mode: <full-repo-baseline|changed-files-first>
- Pass: <pass1|pass2>
- Generated At: <ISO-8601 timestamp>

## Decision
- Result: <block|pass_with_followups>
- Rationale: <1-3 concise bullets>

## Findings Summary
- Total Findings: <number>
- Critical: <number>
- High: <number>
- Medium: <number>
- Low: <number>
- Info: <number>

## Deduped Findings
| ID | Severity | Confidence | Category | File | Title | Status |
| --- | --- | --- | --- | --- | --- | --- |
| F-001 | high | high | security | app/api/runs/route.ts | Missing auth guard | open |

## Findings Detail
### F-001 - Missing auth guard
- Source Reviewer: security
- Evidence: app/api/runs/route.ts:42
- Risk: Unauthorized caller could access run data.
- Recommendation: Require authenticated session before handler logic.
- Dedupe Key: auth-guard:app/api/runs/route.ts
- Status: open

## Duplicate Merge Register
| Canonical ID | Merged IDs | Merge Reason |
| --- | --- | --- |
| F-001 | S-002, C-005 | Same risk mechanism and impacted path. |

## Deferred and Follow-up Items
| Item | Priority | Suggested Owner | Due Window |
| --- | --- | --- | --- |
| Add regression test for auth guard | high | backend | next PR |

## Verification Notes (Pass 2)
- Verification Status: <not_run|partial|complete>
- Resolved Findings: <list>
- Unresolved Findings: <list>
- New Findings Introduced: <list>
```

## Usage Rules
1. Use this template for baseline reports and verification reports.
2. Every detailed finding entry must conform to `finding-schema.md`.
3. Keep rationale and evidence concise, concrete, and reviewable.
4. Do not omit unresolved high-confidence high/critical findings from summary.
