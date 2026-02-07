# Reviewer Manifest

## Trusted Source Policy
Only install reviewer skills from trusted publishers:
- `wshobson/agents`
- `getsentry/skills`
- `openai/skills`
- `addyosmani/web-quality-skills`
- `supabase/agent-skills`

Untrusted or unvetted marketplace skills are out of scope for this workflow.

## Global Installation Scope
Skills are installed globally on the operator machine.

Required reviewer skills:
- `wshobson/agents@multi-reviewer-patterns`
- `wshobson/agents@code-review-excellence`
- `wshobson/agents@nextjs-app-router-patterns`
- `wshobson/agents@javascript-testing-patterns`
- `getsentry/skills@code-simplifier`
- `openai/skills@security-best-practices`
- `supabase/agent-skills@supabase-postgres-best-practices`

## Installation Commands
```bash
npx skills add wshobson/agents --skill multi-reviewer-patterns --skill code-review-excellence --skill nextjs-app-router-patterns --skill javascript-testing-patterns -g -y
npx skills add getsentry/skills --skill code-simplifier -g -y
npx skills add openai/skills --skill security-best-practices -g -y
npx skills add supabase/agent-skills --skill supabase-postgres-best-practices -g -y
```

## Installation Verification
Run:
```bash
npx skills list -g
```

Expected reviewer entries:
- `multi-reviewer-patterns`
- `code-review-excellence`
- `nextjs-app-router-patterns`
- `javascript-testing-patterns`
- `code-simplifier`
- `security-best-practices`
- `supabase-postgres-best-practices`

## Reviewer Roles
| Reviewer Skill | Primary Focus | Output Category |
| --- | --- | --- |
| `multi-reviewer-patterns` | Orchestration, dedupe, severity calibration | governance |
| `code-review-excellence` | Core code correctness and maintainability | maintainability |
| `code-simplifier` | Readability, simplification, clarity | maintainability |
| `security-best-practices` | App/API security and hardening gaps | security |
| `nextjs-app-router-patterns` | App Router conventions and boundary correctness | architecture |
| `javascript-testing-patterns` | Test quality and confidence gaps | testing |
| `supabase-postgres-best-practices` | SQL schema/query and migration quality | architecture |

## Agent Ownership Model
For parallel execution, use explicit ownership:
- `foundation`: reviewer philosophy, scope, pass/block criteria.
- `policy`: trusted-source policy and installation verification.
- `editor`: consistency pass, terminology normalization, and final wording.

No two agents should edit the same file at the same time.
