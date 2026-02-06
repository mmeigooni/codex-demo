# Workflow Packs MVP

## Why This Exists
This project demonstrates a local-first, reliability-focused implementation of an AI review workflow for pull requests.
It is designed as a practical take-home artifact: clear architecture, strict contracts, deterministic behavior under API variance, and a reviewer-friendly product narrative.

## What This Demo Proves
- A PR diff can be ingested, filtered, and analyzed with strict schema validation.
- AI output can be made operationally reliable with timeout handling and deterministic fallback fixtures.
- Team memory can be versioned append-only, promoted, and reused in later runs.
- Governance outcomes (like merge recommendation) are computed server-side, not delegated to model output.
- The system can show measurable change by comparing two runs and flagging truly new findings.

## Demo Narrative (5-Minute Reviewer Flow)
1. Sign in with GitHub.
2. Load open PRs for the configured demo repository.
3. Select a PR and run analysis.
4. Review findings, memory suggestions, and server-computed merge recommendation.
5. Promote memory in one click.
6. Re-run analysis and open compare view.
7. Confirm which findings are NEW (`file + title`) after memory promotion.

## Architecture At a Glance
1. **UI (Next.js App Router)**: Collects repo/PR input and renders workflow states.
2. **API Routes (server boundary)**: Handle GitHub access, diff retrieval, run orchestration, and memory promotion.
3. **Run Engine**: Filters/truncates diff, assembles prompt, executes OpenAI response path, validates strict schema, and falls back deterministically on failure/timeout.
4. **Persistence (Supabase Postgres)**: Stores workflow packs, memory versions, runs, and audit events.
5. **Comparison + Governance**: Computes merge recommendation and NEW-finding semantics server-side.

## Reliability and Determinism Guarantees
- OpenAI run path enforces strict JSON schema validation.
- Invalid output and timeout paths fall back to deterministic fixtures.
- Run metadata persists `duration_ms`, `source` (`live|fallback`), and `error_details`.
- Prompt template version is persisted per run for traceability.

## Security and Least-Privilege Decisions
- Data access is server-only through API routes.
- Supabase secret key remains server-side.
- OAuth scope is constrained to `read:user public_repo` for demo needs.
- No RLS in MVP by design; deferred hardening is documented explicitly.

## Quick Start
1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Fill `.env.local` with required values.

4. In Supabase SQL Editor, run migrations in order:
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_seed_data.sql`

5. In Supabase Auth, enable GitHub provider and set GitHub OAuth app credentials.

6. In your GitHub OAuth app, set callback URL to:
- `http://localhost:3000/auth/callback`

7. Start the app:

```bash
npm run dev
```

8. Open:
- `http://localhost:3000`

## Environment Variables
Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `OPENAI_API_KEY`

Optional:
- `DEMO_REPO` (defaults to `mmeigooni/ecommerce-checkout-demo`)

## Validation Commands
```bash
npm run typecheck
npm run test:run
npm run build
```

## Known MVP Limits / Deferred Hardening
- Single-user demo context; no multi-tenant isolation.
- No RLS in MVP.
- Findings remain JSONB in `runs` (not normalized).
- GitHub App migration is deferred (adapter seam exists).
- Server-side idempotency keys are deferred.

## Repository Map
- `app/`: Next.js routes and API handlers.
- `components/`: UI panels and workflow components.
- `lib/`: Shared contracts, schemas, env/config, runtime services.
- `supabase/migrations/`: Database schema and seed SQL.
- `fixtures/`: Deterministic fallback payloads.
- `tests/`: Unit/integration coverage for core behavior.
