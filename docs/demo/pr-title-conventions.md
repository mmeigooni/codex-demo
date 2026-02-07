# PR Title Conventions for Scenario Signaling

## Purpose
Use lightweight PR title markers to drive storyline cues without in-app round controls.

## Supported Markers
1. `[baseline]`
2. `[catch]`
3. `[learn]`
4. `[transfer]`

Markers are case-insensitive and can appear at the beginning or end of the PR title.

## Recommended Pattern
Use realistic PR titles and keep markers subtle.

1. Prefix style:
- `[baseline] Harden checkout retry jitter in endpoint handler`

2. Suffix style:
- `Harden checkout retry jitter in endpoint handler [baseline]`

## Scenario Intent
1. `baseline`: known-good or control-case behavior.
2. `catch`: bug/risk capture behavior.
3. `learn`: memory-improvement or policy-learning moment.
4. `transfer`: same rule set applied to another engineer/context.

## Do / Don't

### Do
1. Keep product-relevant title text first-class.
2. Use only one primary scenario marker per PR when possible.
3. Keep marker spelling exactly as supported values.
4. Pair markers with realistic code changes in the demo repo.

### Don't
1. Don't use generic non-informative titles.
2. Don't use unsupported markers as primary scenario controls.
3. Don't depend on in-app round selectors for storyline progression.

## Migration Guidance for Existing Demo PRs
1. Retitle current demo PRs to include one supported marker.
2. Keep branch names and commits unchanged; retitle only at PR level.
3. Ensure at least one PR exists for each core scenario used in walkthrough.
4. Update walkthrough and evidence logs to reference marker-driven flow.

## Validation Checklist
1. Tagged PRs render scenario chips in PR context panel.
2. Untagged PRs still render normally without errors.
3. Marker parsing works with mixed-case titles and suffix placement.
