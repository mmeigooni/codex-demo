# Workflow Packs Demo Walkthrough Script (5 Minutes)

## Setup
- Mode: Demo (`?mode=demo`)
- Repo: `mmeigooni/ecommerce-checkout-demo`
- Use scripted rounds from selector in order.

## Act 1: Baseline (A-1)
1. Select round `A-1`.
2. Run review.
3. Narrate:
- "A1 is our baseline: same tool, no memory evolution yet, and this PR should pass."
4. Codex behind the scenes (say this explicitly):
- "Codex is assembling PR diff + current memory version into a structured review prompt."
- "Codex is returning typed findings and a merge recommendation, not free-form text."
5. Capture: verdict card + findings lane screenshot.

## Act 2: Teaching Moment (A-2 -> A-3)
1. Select `A-2` and run review.
2. Narrate:
- "A2 is the teaching moment: the model blocks this checkout change and surfaces core risk patterns."
- "You can get coding suggestions and approve or reject them, but that part is common in many tools."
3. Point to memory suggestion and narrate:
- "What’s interesting is memory suggestion. This is not native Codex behavior; it is app-level memory evolution."
- "This suggestion is generated from the run output and categorized into team-rule sections."
- "Promoting it creates the next immutable memory version, so the next run is evaluated against upgraded team context."
- "That’s the value: knowledge becomes reusable policy, not one-off reviewer advice."
4. Click `Promote rule`.
5. Select `A-3` (or remain if auto) and run review.
6. Codex behind the scenes (say this explicitly):
- "Codex is now evaluating the same risky pattern with memory v2, and attribution should show where memory influenced detection."
7. Capture: memory-attribution finding + memory version context.

## Act 3: Controlled Action (A-3)
1. In `A-3`, use Apply Fix once.
2. Narrate:
- "This is active remediation: Codex generates a full-file fix and the app commits directly to the PR branch."
- "Demo mode intentionally allows one successful fix per round so we can show control and guardrails."
3. Show that additional apply attempts are gated in this round.
4. Codex behind the scenes (say this explicitly):
- "The app validates file scope and PR-diff membership before write, then commits via GitHub API with conflict-safe semantics."
5. Capture: fix feedback + guardrail message.

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
- At least one explicit "what Codex is doing behind the scenes" callout delivered in each act.
