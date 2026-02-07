# Hippocampus Story Mode Walkthrough (5 Minutes)

## Setup (00:00-00:30)
- App mode: `?mode=demo`
- Story Mode: `on`
- Repo: `mmeigooni/ecommerce-checkout-demo`
- Scenario order:
  1. `[baseline]`
  2. `[catch]`
  3. `[learn]`
  4. `[transfer]`

## Opening Frame (00:30-00:45)
Narration:
- "This system keeps utility first, but Story Mode makes memory mechanics legible."
- "We model hippocampal behavior: scan, detect, index, and consolidate."

## Act 1 - Signal (00:45-01:45)
Scenario: `[baseline]`

1. Select PR and confirm pack suggestion.
2. Run review and call out:
- Runtime lane still shows product flow (`Review/Recommend/Apply`).
- Story layer overlays phase semantics (`Scan/Detect/Index/Consolidate`) when relevant.

Behind-the-scenes callout:
- "Codex assembles PR diff, workflow pack scope, and active memory version before inference."

## Act 2 - Conflict (01:45-03:05)
Scenario: `[catch]`

1. Select PR with known risk signal.
2. Run review and highlight:
- High-salience narrative message in review lane.
- Context cues from title markers.
- Findings with severity and memory references.

Behind-the-scenes callout:
- "Findings are structured and validated; merge recommendation is computed server-side, not by prompt prose."

## Act 3 - Learning (03:05-04:25)
Scenarios: `[learn]` then `[transfer]`

1. Execute `[learn]` and capture recommendation/index behavior.
2. Promote memory when appropriate.
3. Execute `[transfer]` and narrate cross-context reuse.
4. Use Apply Fix once when eligible and narrate guardrail.

Behind-the-scenes callout:
- "The app preserves deterministic phase/state transitions while Story Mode explains why a memory should matter now."

## Details Drawer Moment (04:25-04:45)
1. Open details icon.
2. In Story Mode, narrate labels:
- `Evidence`
- `Episodes`
- `Index`
- `Cortex Record`

## Closing and Proof (04:45-05:00)
Narration:
- "The same runtime is now more legible: reviewers move faster, and memory learning is easier to trust and explain."

## Fallback Path (If Live API Variance Appears)
1. If token/session variance occurs, reconnect GitHub and refresh PRs.
2. If run quality varies, use a second PR in the same marker category.
3. If recommendation does not appear, continue with transfer narrative using available findings + details drawer evidence.
4. Always capture run IDs/source (`live` or `fallback`) in rehearsal log.

## Recording Checklist
- [ ] Story Mode toggle shown in top bar.
- [ ] Brain hero visible at least once during demo mode flow.
- [ ] Runtime bar demonstrates utility + story framing.
- [ ] At least one high-salience explanation delivered.
- [ ] Details drawer opened and narrated with Story Mode labels.
- [ ] One explicit Codex technical callout per act.
