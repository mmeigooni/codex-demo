# Rehearsal Evidence Log Template

Use one section per executed PR scenario. Keep this file as the source of truth for practice-run outcomes.

## Session Metadata

- Date:
- Operator:
- App commit/branch:
- Demo repo:
- Environment notes:

---

## Entry Template

### Scenario PR: `<title with marker>`

- PR URL:
- Scenario marker(s):
- Selected workflow pack:
- Inputs:
  - Memory version before run:
  - Runtime phases shown (`Review`, `Recommend`, `Apply`):
- Expected result:
- Actual result:
  - Run ID:
  - Merge recommendation:
  - Source (`live` or `fallback`):
- Key findings observed:
  - 1.
  - 2.
  - 3.
- Memory promotion performed:
  - `yes/no`
  - New memory version ID (if yes):
- Apply Fix performed:
  - `yes/no`
  - Commit URL (if yes):
- Screenshots captured:
  - Main review lane:
  - Details drawer (`Diff`, `Timeline`, `Memory`, or `Run details`):
- Variance notes:
- Recovery action taken (if any):

---

## Completion Checklist

- [ ] `[baseline]` scenario captured
- [ ] `[catch]` scenario captured
- [ ] `[learn]` scenario captured
- [ ] `[transfer]` scenario captured
- [ ] At least one run with memory recommendation captured
- [ ] At least one Apply Fix run recorded
- [ ] Final recording readiness confirmed
