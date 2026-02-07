# Hippocampus Story Mode v1 Contract

## Objective
Story Mode adds a cinematic hippocampus narrative layer to Workflow Packs without changing review correctness, API contracts, or operator control flow.

## UX Contract
1. Story Mode is optional and toggleable. Default state is `off`.
2. Story visuals and labels are additive. They must not block Run, Apply Fix, PR selection, or Details access.
3. Utility-first labels remain the source of truth; Story labels provide narrative framing.
4. Story Mode must degrade gracefully for untagged PR titles and empty run history.

## Runtime State Inputs
Story derivation uses existing client runtime state:
1. Workflow status (`signed_out`, `ready`, `running`, `done`, `error`).
2. Finding volume and severity from run result.
3. Presence of memory suggestions.
4. Apply eligibility and apply-consumed state.

No server-side persistence is introduced in v1.

## Story Acts
1. `signal`: context setup and steady scan.
2. `conflict`: active risk detection and issue surfacing.
3. `learning`: memory recommendation and corrective action.

## Phase Mapping
| Runtime Conditions | Runtime Phase | Story Phase | Story Act |
| --- | --- | --- | --- |
| No run yet, or waiting in ready state | `review` | `scan` | `signal` |
| Run in progress (`running`) | `review` | `detect` | `conflict` |
| Findings + recommendation path visible | `recommend` | `index` | `learning` |
| Apply path visible or recently used | `apply` | `consolidate` | `learning` |

## Salience Rubric
`salience` is a presentational tier used for emphasis and narration.

1. `high`
- Any critical finding.
- Block recommendation with actionable fix path.
- Apply-fix path active on non-trivial findings.

2. `medium`
- Warning-level findings.
- Recommendation exists but no apply path.
- Multiple info findings that indicate repeated pattern drift.

3. `low`
- No findings.
- Passive browsing states.
- Signed-out or no PR selected.

## Story Mode Label Policy
1. Default mode label set: `Review`, `Recommend`, `Apply`.
2. Story mode label set:
- `Review` -> `Scan` (or `Detect` while running)
- `Recommend` -> `Index`
- `Apply` -> `Consolidate`
3. Story mode keeps utility subtitle text to preserve clarity.

## Copy and Narrative Rules
1. Use causal language: what was detected, why it matters, what memory context applies.
2. Avoid anthropomorphic claims of certainty; preserve engineering precision.
3. Keep narrative copy short and skimmable to maintain operator flow.

## Reduced Motion Contract
1. Respect `prefers-reduced-motion: reduce`.
2. Disable non-essential pulses, looping glows, and decorative transitions.
3. Keep essential state transitions (tab/phase changes) with minimal opacity/position shifts only.

## Acceptance Criteria
1. Story state derivation is deterministic for identical input state.
2. Story mode can be toggled at runtime without resetting selected PR/run context.
3. Default mode remains fully usable with no narrative dependency.
4. Story mode remains informational and non-blocking across all workflow statuses.
