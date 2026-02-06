insert into workflow_packs (id, name, description, trigger_type, scope_globs, output_schema, status)
values (
  '11111111-1111-1111-1111-111111111111',
  'Checkout Safety Review',
  'Review checkout and payment pull requests against team safety memory.',
  'pr_review',
  array['src/checkout/**', 'src/payments/**'],
  '{"summary":"string","findings":[],"memory_suggestions":[]}'::jsonb,
  'active'
)
on conflict (id) do nothing;

insert into workflow_packs (id, name, description, trigger_type, scope_globs, output_schema, status)
values
  (
    '22222222-2222-2222-2222-222222222222',
    'Dependency Governance Pack',
    'Coming soon',
    'pr_review',
    array['**/*'],
    '{}'::jsonb,
    'coming_soon'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'CI Incident Triage Pack',
    'Coming soon',
    'pr_review',
    array['**/*'],
    '{}'::jsonb,
    'coming_soon'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Checkout Test Repair Pack',
    'Coming soon',
    'pr_review',
    array['**/*'],
    '{}'::jsonb,
    'coming_soon'
  )
on conflict (id) do nothing;

insert into memory_versions (
  id,
  workflow_pack_id,
  version,
  content,
  change_summary,
  change_details,
  approved_by
)
values (
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  1,
  '## Checkout Safety Review - Team Memory\n\n### Code Patterns\n- All payment handlers must include an idempotency key\n- Retry logic must use exponential backoff with jitter\n- Error messages must be actionable and include context\n\n### Review Focus Areas\n- Validate all user input before processing\n- Ensure proper error handling in async payment flows',
  'Seed memory version for demo',
  '[]'::jsonb,
  'seed'
)
on conflict (id) do nothing;
