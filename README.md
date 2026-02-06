# Workflow Packs MVP

A local-first Next.js demo that shows governance-style Codex code reviews with:

- GitHub OAuth login
- PR list + diff ingestion
- Programmatic OpenAI review runs with strict JSON schema
- Team memory versioning (append-only)
- Run comparison showing new findings after memory promotion
- Deterministic fallback fixtures for demo reliability

## Tech Stack

- Next.js (App Router) + TypeScript
- Tailwind + lightweight shadcn-style UI primitives
- Supabase (Auth + Postgres)
- OpenAI Responses API + Zod validation
- Vitest tests

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Fill `.env.local` with your Supabase and OpenAI keys.

4. Run SQL migrations in Supabase SQL editor in order:

- `/Users/frequency/Desktop/dev/codex-demo/supabase/migrations/001_initial_schema.sql`
- `/Users/frequency/Desktop/dev/codex-demo/supabase/migrations/002_seed_data.sql`

5. Start app:

```bash
npm run dev
```

6. Open `http://localhost:3000`.

## Commands

```bash
npm run typecheck
npm run test:run
npm run build
```

## Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `OPENAI_API_KEY`
- `DEMO_REPO` (optional, defaults to `mo-demo/ecommerce-checkout`)

## Notes

- All database reads/writes happen through server API routes.
- Merge recommendation is computed server-side from finding severities.
- Fallback fixtures live in `/Users/frequency/Desktop/dev/codex-demo/fixtures`.
- Prompt template version is persisted on each run as `1.0`.
