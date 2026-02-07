# Rehearsal Evidence Log Template (Story Mode)

Use one section per executed scenario PR. This file is the source of truth for demo readiness and judging proof.

## Session Metadata
- Date:
- Operator:
- App commit/branch:
- Demo repo:
- Story Mode used (`yes/no`):
- Reduced motion setting (`default/reduced`):
- Environment notes:

---

## Entry Template

### Scenario PR: `<title with marker>`

- PR URL:
- Scenario marker(s):
- Selected workflow pack:
- Story phase observed (`scan/detect/index/consolidate`):
- Utility phase observed (`review/recommend/apply`):
- Salience tier observed (`low/medium/high`):

- Inputs:
  - Memory version before run:
  - Context cue chips shown:
  - Runtime phase path:

- Expected result:
- Actual result:
  - Run ID:
  - Merge recommendation:
  - Source (`live` or `fallback`):

- Key findings observed:
  - 1.
  - 2.
  - 3.

- Cue-to-episode explanation:
  - Cue detected:
  - Related memory/episode evidence:
  - Why this mattered now:

- Memory promotion performed:
  - `yes/no`
  - New memory version ID (if yes):

- Apply Fix performed:
  - `yes/no`
  - Commit URL (if yes):

- Story Mode UI evidence:
  - Top bar toggle visible:
  - Brain hero state captured:
  - Details drawer labels captured (`Evidence/Episodes/Index/Cortex Record`):

- Accessibility and motion checks:
  - Keyboard path verified (`yes/no`):
  - Reduced-motion behavior verified (`yes/no`):

- Variance notes:
- Recovery action taken (if any):

---

## Completion Checklist

- [ ] `[baseline]` scenario captured
- [ ] `[catch]` scenario captured
- [ ] `[learn]` scenario captured
- [ ] `[transfer]` scenario captured
- [ ] At least one high-salience scenario documented with rationale
- [ ] At least one run with memory recommendation captured
- [ ] At least one Apply Fix run recorded
- [ ] Reduced-motion check recorded
- [ ] Final recording readiness confirmed
