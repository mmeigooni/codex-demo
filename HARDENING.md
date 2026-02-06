# Production Hardening (Deferred)

| Shortcut | Current MVP | Production Target | Rationale for Deferral |
| --- | --- | --- | --- |
| Auth security | No RLS, server-only access | RLS by tenant/user role | Single-user take-home demo |
| Run idempotency | Client-side run button disable | Server-side idempotency keys | Low run volume in scripted flow |
| PR identity | PR URL only | PR URL + head SHA snapshot | Demo compares repeated runs on same PR |
| Token persistence | Session-only provider token | Encrypted token store or App auth | No background jobs in MVP |
| Diff limits | Scope filter + byte cap | Chunked multi-call review | Current demo diff is small |
| Memory dedup | Duplicate rules allowed | Rule dedup + semantic merge | Only one promotion in core flow |
| Promotion UX | One-click approve | Editable suggestion with review controls | Faster scripted demonstration |
