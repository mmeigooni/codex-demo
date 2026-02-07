# Specialist Prompt: Testing Quality

## Objective
Evaluate whether tests provide credible confidence for changed behavior.

## Review Scope
1. Changed runtime files and nearby test suites.
2. Test strategy alignment with risk level and failure impact.

## What to Detect
1. Missing coverage for high-risk paths and edge cases.
2. Flaky or weak assertions that mask regressions.
3. Mocking patterns that invalidate test realism.
4. Gaps between business logic changes and test intent.

## Output Contract
Return findings using `docs/reviewer-system/templates/finding-schema.md`.
Each finding must include:
1. specific missing/weak scenario,
2. expected assertion or behavior to cover,
3. practical test update recommendation.

## Severity Guidance
1. `high`: critical behavior changed without meaningful test protection.
2. `medium`: notable confidence gap likely to miss regressions.
3. `low` or `info`: improvement opportunities with limited risk.

## Constraints
1. Do not recommend excessive test breadth when focused tests suffice.
2. Prioritize deterministic tests over implementation-coupled assertions.
