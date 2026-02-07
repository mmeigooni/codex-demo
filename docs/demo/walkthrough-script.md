# Workflow Packs Demo Walkthrough Script (5 Minutes)

## Setup
- Mode: Demo (`?mode=demo`)
- Repo: `mmeigooni/ecommerce-checkout-demo`
- Use scripted rounds from selector in order.

## Act 1: Baseline (A-1)
1. Select round `A-1`.
2. Run review.
3. Narrate: "Baseline PR should pass with no criticals."
4. Capture: verdict card + findings lane screenshot.

## Act 2: Teaching Moment (A-2 -> A-3)
1. Select `A-2` and run review.
2. Narrate: "Core issues are blocked, and the assistant proposes memory evolution."
3. Promote memory suggestion.
4. Select `A-3` (or remain if auto) and run review.
5. Narrate: "Now the model applies team memory and catches the subtle policy issue."
6. Capture: memory-attribution finding + memory version context.

## Act 3: Controlled Action (A-3)
1. In `A-3`, use Apply Fix once.
2. Narrate: "Demo mode intentionally allows one successful fix action per round."
3. Show that additional apply attempts are gated in this round.
4. Capture: fix feedback + guardrail message.

## Evidence Workflow
1. Open `Evidence draft`.
2. Add variance/recovery notes.
3. Copy markdown and paste into `docs/demo/rehearsal-evidence-log.md`.
4. Confirm run IDs/source manually before recording.

## Final Recording Checklist
- Demo Mode default verified.
- Advanced Mode fallback shown briefly.
- 3-act arc completed without navigation confusion.
- Evidence log entries updated for the recorded rounds.
