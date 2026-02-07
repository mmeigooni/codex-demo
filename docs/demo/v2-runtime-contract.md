# Workflow Packs V2 Runtime Contract

## Purpose
This contract defines runtime phase generation, phase transitions, and context exposure rules for the V2 UI.

## Primary Runtime Phases
Phase labels are fixed; visibility is dynamic.

1. `review`
2. `recommend`
3. `apply`

## Runtime Inputs
Phase generation is derived from the following runtime inputs:

1. Workflow status (`signed_out`, `repo_loading`, `pr_loading`, `ready`, `running`, `done`, `error`)
2. Current run result (findings count)
3. Memory suggestion availability (`memory_suggestions.length > 0`)
4. Apply-fix eligibility (selected pack active, PR context available, apply not consumed in current run context)

## Phase State Contract

```ts
export type RuntimePhase = "review" | "recommend" | "apply";

export interface RuntimePhaseState {
  phases: RuntimePhase[];
  current: RuntimePhase;
  completed: RuntimePhase[];
}
```

## Visibility Rules

### `review`
Always visible. This is the entry and analysis phase.

### `recommend`
Visible only when the latest result includes at least one memory suggestion.

### `apply`
Visible when findings exist and apply-fix capability is available in the current context.

## Transition Table

| Condition | Phases | Current Phase |
| --- | --- | --- |
| No run yet (`ready`, no `currentResult`) | `review` | `review` |
| Running analysis | `review` | `review` |
| Run done, no findings | `review` | `review` |
| Run done, findings, no memory suggestion, apply eligible | `review, apply` | `apply` |
| Run done, findings, memory suggestion present, apply not yet available | `review, recommend` | `recommend` |
| Run done, findings, memory suggestion present, apply eligible | `review, recommend, apply` | `recommend` |
| Recommendation accepted/promoted; apply eligible | `review, recommend, apply` | `apply` |
| Apply-fix consumed or unavailable | `review` or `review, recommend` | last available non-apply phase |

## Details Drawer Exposure Contract
Default lane must not show persistent heavy context.

The details drawer owns these views:
1. Diff
2. Timeline
3. Memory
4. Run details

Drawer visibility rules:
1. Drawer entry is always present once signed in.
2. Drawer content can render empty-state messaging when prerequisite data is missing.
3. Last opened tab is persisted to local storage per browser session.

## Error and Recovery Behavior
1. Error state must not corrupt runtime phase derivation.
2. `Recover` action returns to `ready` and recomputes runtime phase from available data.
3. Phase bar should degrade to `review` during loading and error transitions.

## Non-Goals
1. No API contract changes to `/api/runs` payload.
2. No backend orchestration changes for apply-fix semantics.
3. No server-side phase persistence in this iteration.

## Acceptance Criteria
1. Runtime phase rules produce deterministic output for the same input state.
2. Contract covers all default UX status states.
3. Drawer visibility and tab ownership are explicit and implementation-ready.
