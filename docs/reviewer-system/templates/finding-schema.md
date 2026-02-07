# Finding Schema Contract

## Purpose
Define a normalized finding format used by all specialist reviewers and the orchestrator.

## Canonical Shape
```json
{
  "finding_id": "string",
  "source_reviewer": "orchestrator|code-review-excellence|code-simplifier|security|nextjs|testing|supabase",
  "category": "maintainability|security|testing|architecture|governance",
  "severity": "critical|high|medium|low|info",
  "confidence": "high|medium|low",
  "title": "string",
  "summary": "string",
  "evidence": {
    "file_path": "string",
    "line_start": 1,
    "line_end": 1,
    "snippet": "string"
  },
  "risk": "string",
  "recommendation": "string",
  "dedupe_key": "string",
  "tags": ["string"],
  "status": "open|resolved|deferred"
}
```

## Required Fields
1. `source_reviewer`
2. `category`
3. `severity`
4. `confidence`
5. `title`
6. `summary`
7. `evidence.file_path`
8. `risk`
9. `recommendation`
10. `dedupe_key`
11. `status`

## Validation Rules
1. `title` should be specific and under 120 characters.
2. `summary`, `risk`, and `recommendation` must be actionable and non-empty.
3. `dedupe_key` should be stable across reviewers for equivalent findings.
4. `line_start` and `line_end` must be positive integers when provided.
5. `line_end` must be greater than or equal to `line_start`.
6. `status` defaults to `open` on first pass.

## Dedupe Guidance
1. Build `dedupe_key` from normalized risk mechanism + target location.
2. Prefer one canonical finding for duplicate reviewer observations.
3. Preserve strongest severity and best evidence in canonical record.

## Severity and Confidence Semantics
1. Severity captures impact if true.
2. Confidence captures certainty of evidence.
3. Escalate to merge block only when severity and confidence thresholds are met by policy.
