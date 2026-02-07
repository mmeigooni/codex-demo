# Workflow Packs V2 UX Audit

## Purpose
This audit captures the current UX friction in the dashboard and defines the target V2 experience we are implementing.

## Current State (Baseline)
Current default experience is a scripted demo lane with explicit round control and tutorial framing.

### Observed Friction
1. The flow starts with round selection rather than real PR context selection.
2. Default labels (`Review / Teach / Prove`) read as rehearsal language instead of product language.
3. Heavy context panels (diff and timeline) compete with the primary action lane.
4. Workflow pack selection is implicit (`activePack`) and does not expose recommendation logic.
5. Coming-soon packs are shown separately, disconnected from actual run eligibility.
6. Narrative controls dominate default view, making the product look like a guided script rather than an operational tool.

## Target State (V2)
V2 shifts to a product-first workflow:
1. User selects repository and PR first.
2. App recommends a workflow pack from PR context.
3. Primary progression labels are runtime-driven and use product language: `Review / Recommend / Apply`.
4. Default surface is minimal (verdict, key findings, primary actions).
5. Deep context is available through one details entry point.
6. Storyline control is signaled through PR title markers, not in-app round controls.

## UX Decisions Locked
1. PR-first ordering is mandatory before any run action.
2. Pack suggestion strip must always show the selected/suggested pack state.
3. Coming-soon packs are visible but locked with explicit reason and active fallback.
4. Runtime phases are dynamic (1-3 visible phases).
5. Diff/timeline/memory/run-details are not always visible in default mode.
6. A single details icon opens a unified drawer with tabbed context panels.

## Before-State Capture Checklist
These references document the baseline state before V2 UI refactor.

1. `docs/demo/screenshots/before/01-round-selector-default.png`:
- round selector and walkthrough header visible.
2. `docs/demo/screenshots/before/02-demo-findings-lane.png`:
- demo lane findings and evidence controls.
3. `docs/demo/screenshots/before/03-diff-always-visible.png`:
- diff preview occupying default layout.
4. `docs/demo/screenshots/before/04-more-packs-separate-drawer.png`:
- planned packs detached from run path.

## Target-State Acceptance Visuals
These references will be captured as implementation evidence.

1. `docs/demo/screenshots/after/01-pr-first-selector.png`
2. `docs/demo/screenshots/after/02-pack-suggestion-active.png`
3. `docs/demo/screenshots/after/03-pack-locked-fallback.png`
4. `docs/demo/screenshots/after/04-runtime-phase-review-recommend-apply.png`
5. `docs/demo/screenshots/after/05-single-details-entry.png`

## In Scope / Out of Scope

### In Scope
1. PR-first selection and pack recommendation surface.
2. Runtime phase progression updates.
3. Minimal default lane with details drawer.
4. PR-title marker scenario cues.

### Out of Scope
1. Backend model behavior redesign.
2. New auth provider integration.
3. Database schema redesign.
4. Multi-tenant/RBAC rollout.

## Acceptance Criteria
1. This audit reflects actual baseline behavior in the current `main` branch.
2. The V2 target behavior is specific enough to drive implementation decisions.
3. Screenshot references are defined for before and after capture.
