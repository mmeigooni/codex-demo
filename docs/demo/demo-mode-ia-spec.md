# Demo Mode IA Spec

## Goal
Make the default experience a narrative walkthrough while keeping the full dashboard available in Advanced Mode.

## User Journey
1. Review
- System auto-loads scripted PR context for selected round.
- Primary CTA: `Run Review`.
- Output: verdict card + top findings.

2. Teach
- If memory suggestion exists, show one memory card.
- Primary CTA: `Promote Rule`.
- On success: auto-rerun current round.

3. Prove
- Show before/after callout for memory-attributed findings.
- Primary CTA: `Apply Fix` (max one successful commit per round).
- Secondary CTA: `Mark Round Complete`.

## Navigation and Surface Rules
- Default route `/` opens Demo Mode.
- Advanced Mode is a toggle, not a separate app.
- Demo Mode shows one dominant lane and one primary CTA at a time.
- Timeline, full memory text, and run details are hidden behind a details drawer in Demo Mode.
- Advanced Mode keeps existing dashboard behavior unchanged.

## Apply Fix Rule
- Demo Mode allows one successful Apply Fix commit per round.
- Failed Apply Fix attempts do not consume the round allowance.
- Allowance resets when round changes.

## State Contract
- `viewMode`: `demo | advanced`
- `walkthroughStep`: `review | teach | prove`
- `roundKey`: scripted round identifier (e.g. `A-2`)
- `applyFixUsed`: true only after successful apply-fix commit in current round

## Round Script Contract
Each round defines:
- pass (`A` or `B`)
- round number
- objective
- PR number
- memory version before run
- expected recommendation
- whether Apply Fix is allowed

## Acceptance Screenshot List
- Demo Mode landing with round selector and stepper.
- Review step with verdict and top findings.
- Teach step with memory suggestion and promote CTA.
- Prove step with memory-attribution callout.
- Apply Fix success state and disabled second attempt.
- Details drawer showing hidden advanced controls.
- Advanced Mode toggle and full dashboard preserved.
