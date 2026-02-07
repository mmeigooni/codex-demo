# Practice Run Checklist (Strategy Shift)

This checklist defines the manual rehearsal process that replaces synthetic timeline seeding.

## Preconditions

- App is running locally at `http://localhost:3000`
- GitHub OAuth sign-in is working after refresh
- Demo repository is set to `mmeigooni/ecommerce-checkout-demo`
- PR inventory is available in the dropdown:
  - `#1` docs + retry tuning
  - `#2` express checkout endpoint
  - `#3` webhook payment handler
  - `#4` subscription billing service
  - `#5` inventory reservation service
- `OPENAI_API_KEY` is configured
- Browser devtools/network tab is clean (no persistent 4xx/5xx for app routes)

## Rehearsal Pass A (Early Data Bootstrap)

### Round 1 - Baseline

- Input: `PR #1` + latest memory (expected `v1`)
- Expected: `PASS` and no critical findings
- Action: none
- Evidence:
  - Capture run ID
  - Capture merge recommendation

### Round 2 - The Catch

- Input: `PR #2` + `v1`
- Expected: `BLOCK` and core safety findings
- Action: promote first memory suggestion to create `v2`
- Evidence:
  - Capture run ID
  - Capture memory version ID before/after promotion

### Round 3 - Learning Proof

- Input: `PR #2` + `v2`
- Expected: `BLOCK` with stronger findings than Round 2
- Action: none
- Evidence:
  - Capture run ID
  - Capture new/extra findings compared to Round 2

## Gate After Pass A

- [ ] Rounds 1-3 executed and logged
- [ ] Memory `v2` exists
- [ ] Timeline data has real run + memory progression to build against

## Rehearsal Pass B (Final Demo Lock)

### Round 1 - Baseline

- Repeat with `PR #1` and record final evidence

### Round 2 - The Catch

- Repeat with `PR #2` and promote if needed

### Round 3 - Learning Proof

- Repeat with `PR #2` using upgraded memory

### Round 4 - Knowledge Transfer

- Input: `PR #3` + latest memory (`v2`+)
- Expected: `BLOCK` and cross-context catches from prior promoted rules
- Action: promote additional suggestion if available (`v3`)

### Round 5 - Accumulated Intelligence

- Input: `PR #5` + latest memory (`v3` expected)
- Expected: `PASS` with no critical findings
- Action: none

## Gate Before Recording

- [ ] All 5 rounds completed in Pass B
- [ ] Timeline shows authentic multi-run progression
- [ ] Memory timeline includes promoted versions from real flows
- [ ] Apply Fix flow validated on at least one finding
- [ ] Rehearsal evidence log is complete

## Recovery Rules

If a round result is unexpected:

1. Re-run once.
2. Check run source (`live` vs `fallback`) in Run Details.
3. Record discrepancy notes in evidence log.
4. Continue if narrative still holds, otherwise escalate and block recording.
