# Demo Mode Wave Plan (Execution Contracts)

## Execution Model
- One issue = one commit with `WP-<id>` prefix.
- Worktree/branch naming follows `codex/wp-<id>-<slug>`.
- No overlapping files within a wave.
- Every issue must pass `npm run typecheck`.

## Waves

### Wave 01 - Spec Freeze
Objective: lock implementation docs before code changes.
- WP-001: create IA spec (`docs/demo/demo-mode-ia-spec.md`)
- WP-002: create this wave contract doc (`docs/demo/wave-plan-demo-mode.md`)

Exit gate:
- Spec files exist and are decision-complete.
- `npm run typecheck` passes.

### Wave 02 - Demo Contracts
Objective: add typed walkthrough contracts and scripted rounds.
- WP-003: extend `lib/types.ts`
- WP-004: extend `lib/workflow-ui-state.ts`
- WP-005: add `lib/demo-script.ts`

Exit gate:
- Demo state contracts compile.
- Scripted rounds exported with full metadata.

### Wave 03 - Entry UX
Objective: make Demo Mode default with an Advanced toggle.
- WP-006: add `components/workflow/demo-mode-shell.tsx`
- WP-007: add `components/workflow/walkthrough-stepper.tsx`
- WP-008: integrate mode toggle and default route behavior in `components/workflow-dashboard.tsx`

Exit gate:
- Demo Mode renders by default.
- Advanced Mode preserves current functionality.

### Wave 04 - Findings Simplification
Objective: streamline findings in Demo Mode and hide depth behind drawer.
- WP-009: add `components/workflow/demo-findings-list.tsx`
- WP-010: add `components/workflow/details-drawer.tsx`
- WP-011: branch rendering in `components/workflow/results-panel.tsx`

Exit gate:
- Demo shows one primary action lane.
- Advanced tabs remain intact.

### Wave 05 - Rehearsal Automation
Objective: auto-populate rehearsal evidence drafts with manual notes.
- WP-012: add `lib/rehearsal-log.ts`
- WP-013: add `components/workflow/rehearsal-log-drawer.tsx`
- WP-014: integrate in `components/workflow/demo-mode-shell.tsx`

Exit gate:
- Round run produces draft evidence markdown.

### Wave 06 - Guided Stability and Apply Fix Gate
Objective: enforce once-per-round fix and prevent context drift.
- WP-015: add `lib/round-guards.ts`
- WP-016: gate Apply Fix in `components/workflow/results-panel.tsx`
- WP-017: context lock/suggestion fix in `components/workflow-dashboard.tsx`

Exit gate:
- Apply Fix is consumed once per round in Demo Mode.
- Suggestion appears without timeline workaround.

### Wave 07 - Readiness Pack
Objective: validate logic and recording readiness.
- WP-018: add `tests/demo-script.test.ts`
- WP-019: add `tests/demo-mode-flow.test.tsx`
- WP-020: add `docs/demo/walkthrough-script.md`

Exit gate:
- Unit/integration tests pass.
- Walkthrough script complete.

## File Ownership Matrix
| File | Wave | Issue |
|------|------|-------|
| docs/demo/demo-mode-ia-spec.md | 01 | WP-001 |
| docs/demo/wave-plan-demo-mode.md | 01 | WP-002 |
| lib/types.ts | 02 | WP-003 |
| lib/workflow-ui-state.ts | 02 | WP-004 |
| lib/demo-script.ts | 02 | WP-005 |
| components/workflow/demo-mode-shell.tsx | 03, 05 | WP-006, WP-014 |
| components/workflow/walkthrough-stepper.tsx | 03 | WP-007 |
| components/workflow-dashboard.tsx | 03, 06 | WP-008, WP-017 |
| components/workflow/demo-findings-list.tsx | 04 | WP-009 |
| components/workflow/details-drawer.tsx | 04 | WP-010 |
| components/workflow/results-panel.tsx | 04, 06 | WP-011, WP-016 |
| lib/rehearsal-log.ts | 05 | WP-012 |
| components/workflow/rehearsal-log-drawer.tsx | 05 | WP-013 |
| lib/round-guards.ts | 06 | WP-015 |
| tests/demo-script.test.ts | 07 | WP-018 |
| tests/demo-mode-flow.test.tsx | 07 | WP-019 |
| docs/demo/walkthrough-script.md | 07 | WP-020 |

## Parallelism Notes
- Wave 02: WP-004 and WP-005 after WP-003.
- Wave 03: WP-006 and WP-007 in parallel before WP-008.
- Wave 04: WP-009 and WP-010 in parallel before WP-011.
- Wave 06: WP-016 and WP-017 after WP-015.
- Wave 07: WP-018 and WP-019 before WP-020.

## Verification Checklist (Per Wave)
1. `npm run typecheck`
2. Targeted tests for touched modules
3. Localhost validation for changed UX flow
4. End of wave: `npm run test:run && npm run build`
