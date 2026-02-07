# Workflow Packs Demo Walkthrough Script (5 Minutes)

## Setup
- Mode: Workflow mode (`?mode=demo`)
- Repo: `mmeigooni/ecommerce-checkout-demo`
- Use scenario-tagged PRs in this order:
  - `[baseline]` -> `[catch]` -> `[learn]` -> `[transfer]`

## Act 1: Baseline Context (`[baseline]`)
1. Select PR `Smoke test: docs and retry tuning [baseline]`.
2. Confirm suggested pack and run review.
3. Narrate:
- "This is the control path: normal checkout context and expected stable recommendation."
4. Codex behind the scenes:
- "Codex is assembling PR diff + selected workflow pack scope + current memory version into a typed review prompt."
- "The app computes merge recommendation server-side from structured findings."

## Act 2: Catch and Recommendation (`[catch]`)
1. Select PR `Add express checkout endpoint [catch]`.
2. Run review and highlight high-signal findings.
3. Narrate:
- "This scenario demonstrates detection of risky implementation details in a realistic PR."
4. If memory suggestion appears, narrate:
- "Recommendation captures repeated review knowledge as reusable team memory."
5. Promote rule when appropriate.

## Act 3: Learning and Application (`[learn]` -> `[transfer]`)
1. Select PR `Use exponential backoff with jitter in retry helper [learn]`.
2. Run review and narrate memory-aware progression (`Review -> Recommend -> Apply`).
3. Select PR `Strengthen checkout input validation and error messaging [transfer]`.
4. Run review to show the same learned constraints transferring to another code area.
5. Use Apply Fix once when available and narrate guardrail behavior.

## Optional Variance PR
- `Normalize charge input handling in payment adapter [baseline]`
- Use as fallback baseline scenario if another run has variance.

## Evidence Workflow
1. Open `Details` and capture context as needed (Diff, Timeline, Memory, Run details).
2. Open `Evidence draft` and add operator notes.
3. Copy markdown into `docs/demo/rehearsal-evidence-log.md`.
4. Record run IDs, source (`live` or `fallback`), and observed runtime phase path.

## Final Recording Checklist
- PR-first selection is visible before run.
- Pack suggestion + lock behavior is visible at least once.
- Runtime phase bar updates across scenarios.
- Details drawer is used for deep context, not the default lane.
- At least one explicit "what Codex is doing behind the scenes" callout is delivered per act.
