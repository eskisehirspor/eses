# Tests

## Unit

Run with `pnpm test`. These cover shared contracts, admin access states, auth-guard helpers, and env rules. They do **not** prove Postgres RLS.

## Integration

Not implemented in Phase 0. Future integration tests should apply migrations to a local Supabase instance and assert:

- authenticated users cannot insert/update/delete `user_roles`
- users cannot update another profile
- users cannot select non-granted profile columns
- `anon` has no table grants

Use `supabase test` / pgTAP when the hosted or local project exists.

## E2E

Not implemented in Phase 0. Future Maestro/Detox/Playwright flows: tab shell, sign-in, admin unauthorized vs authorized.
