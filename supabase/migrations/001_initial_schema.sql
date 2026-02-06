create extension if not exists pgcrypto;

create table if not exists workflow_packs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  trigger_type text not null,
  scope_globs text[] not null,
  output_schema jsonb not null default '{}'::jsonb,
  status text not null check (status in ('active', 'coming_soon')),
  created_at timestamptz not null default now()
);

create table if not exists memory_versions (
  id uuid primary key default gen_random_uuid(),
  workflow_pack_id uuid not null references workflow_packs(id) on delete cascade,
  version int not null,
  content text not null,
  change_summary text not null,
  change_details jsonb not null default '[]'::jsonb,
  approved_by text not null,
  created_at timestamptz not null default now(),
  unique (workflow_pack_id, version)
);

create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  workflow_pack_id uuid not null references workflow_packs(id) on delete cascade,
  memory_version_id uuid not null references memory_versions(id) on delete restrict,
  pr_url text not null,
  pr_title text not null,
  pr_diff text not null,
  assembled_prompt text not null,
  parsed_findings jsonb not null default '[]'::jsonb,
  memory_suggestions jsonb not null default '[]'::jsonb,
  merge_recommendation text not null check (merge_recommendation in ('pass', 'warnings', 'block')),
  prompt_template_version text not null,
  duration_ms integer not null,
  source text not null check (source in ('live', 'fallback')),
  error_details text,
  created_at timestamptz not null default now()
);

create index if not exists idx_runs_pr_url on runs(pr_url);
create index if not exists idx_runs_created_at on runs(created_at desc);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
