# SECURITY.md

Security model for the official Eskişehirspor fan application.

Phase 0 landed identity RLS, email auth, and admin access states. There is still **no linked hosted project** and **no service-role usage in apps**. Do not add the service-role key to mobile or `NEXT_PUBLIC_*`.

---

## Threat model

### Assets

- User accounts and profile PII (name, email, later address for cards).
- Location samples around match days.
- UGC (posts, chat) and moderation evidence.
- XP ledger, badges, attendance (status / future physical card eligibility).
- Admin publishing (official news).
- Service-role key (full database).
- Push tokens.
- Future payments / tickets.

### Adversaries

- Anonymous internet (scan, inject, scrape).
- Authenticated supporter (farm XP, cheat predictions, harass).
- Compromised/rooted device (mock GPS, patched APK).
- Malicious or careless moderator.
- Stolen admin session.
- Third-party provider compromise (match ingest webhook).

### In-scope abuse

- Client-forged XP, attendance, prediction results.
- Direct table writes around RLS mistakes.
- Service-role leak into the mobile binary or admin JS bundle.
- SQL injection via Edge Functions / RPC.
- UGC malware links, spam, doxxing.
- Notification spam.
- Privilege escalation (`user_roles` self-grant).
- Mass scraping of user profiles.

### Out of scope for V1 (still design-aware)

- Nation-state.
- Physical card NFC cloning (future).
- Payment PCI (future; use a PSP, never store cards ourselves).

---

## Attack surface

| Surface | Risk | Control |
| --- | --- | --- |
| Expo app + bundled `EXPO_PUBLIC_SUPABASE_ANON_KEY` | expected public | RLS; no privileged keys |
| PostgREST | wide if RLS weak | default deny; views; column grants |
| Realtime | data leak | same RLS as tables |
| Storage | public buckets | private + signed URLs; mime/size limits |
| Edge Functions | auth bypass | verify JWT; never trust body for role/XP |
| Admin Next.js | XSS, session | httpOnly cookies / SSR client; CSP; role middleware |
| Match ingest webhook | forged events | shared secret, IP allow, idempotent ids |
| Push | spam / phishing | only server senders; deep link allowlist |
| Reports | brigading | rate limits |

---

## Secrets handling

| Secret | Where it may live | Where it must not |
| --- | --- | --- |
| Supabase **anon** key | mobile env `EXPO_PUBLIC_*`, admin public env | treated as privileged |
| Supabase **service role** | Edge Function secrets, CI for migrations | app binary, git, admin browser, `EXPO_PUBLIC_*` |
| Database URL | CI / hosted dashboard | client |
| Provider API keys | Edge secrets | client |
| Apple/Google OAuth secrets | Supabase Auth dashboard / server | client (client ids only) |
| Webhook secrets | Edge secrets | |

Rules:

- `.env` files are gitignored. No real keys in docs or seeds.
- Rotate service role immediately if it ever appears in a client build or chat log.
- EAS / Vercel env for public keys only on the client projects.

---

## RLS and roles

See `DATABASE.md` for table-level policy intent.

Application roles in `user_roles`: `user`, `editor`, `moderator`, `admin`, `super_admin`. Default on signup: `user`.

| Role | Can |
| --- | --- |
| supporter | read public content; own profile (safe columns); call user Edge Functions |
| editor | publish news/articles; not necessarily ban |
| moderator | queue, hide UGC, strikes, community restrictions |
| admin | roles, XP rules, venues, voids, app bans, card issuance later |

`auth.users` metadata must not be the only ACL. Role checks use `user_roles` on the server.

Never:

- `profiles.is_admin` writable by the owner.
- Policies like `using (true)` on write.
- Grant `authenticated` INSERT on `xp_transactions`, `xp_balances`, `presence_verifications`, `match_events`, `leaderboard_snapshots`, `user_roles`.

Column privileges: hide `quiz_questions.correct_option_id`, `profiles.is_shadow_banned`, moderation internals from supporters.

---

## Server-authoritative rewards

Mandatory rules (also in Cursor rules):

1. Never trust the mobile client for XP.
2. Never trust the mobile client for rewards.
3. Never trust the mobile client for match attendance.
4. Never trust the mobile client for prediction results.
5. Never expose service-role credentials to the client.
6. All exposed tables have RLS.
7. Reward-affecting actions are server-authoritative.
8. Reward transactions are auditable.
9. Important mutations are idempotent.
10. Users cannot directly modify XP totals.
11. Leaderboards derive from trusted server data.
12. Admin functionality is role-protected.
13. UGC passes moderation controls.
14. Rate limiting on abuse-prone actions.
15. Never silently ignore errors.

Implementation pattern: Edge Function verifies JWT → business rules → single DB transaction → return authoritative state.

---

## Abuse prevention

- Rate limits per user and per IP on login, post, report, verify-presence, quiz, prediction.
- New-account tighter limits.
- Idempotency keys on reward and presence endpoints.
- Moderation pipeline (`MODERATION.md`).
- Presence anti-spoof (`MATCH-PRESENCE.md`).
- Admin `admin_adjust` XP always writes audit + ledger.
- Lock predictions at `locks_at` using server time (`now()`), not device clock.
- Ingest match events only with provider secret; unique provider event ids.

---

## Session and auth security

- Enable Apple and Google as first-class (store requirements for iOS alternative login).
- Email magic link / password: decide in implementation; if password, require recovery and brute-force protections from Supabase.
- Revoke sessions on `app` ban.
- Admin: shorter session, optional 2FA when available; separate staff accounts, not personal supporter accounts reused without role.
- CORS on Edge Functions limited to app and admin origins.

---

## Logging and auditability

Must log (structured):

- Auth failures (no secrets).
- Edge Function errors (code, user id, request id).
- All moderator/admin mutations (`audit_logs`).
- All XP transactions (the ledger **is** the log).
- Presence verification decisions.
- Ingest failures.

Must not log:

- Access tokens, service role, raw passwords.
- Full precise GPS in long-lived log drains (align with KVKK retention).
- Message bodies in third-party error tools unless necessary; prefer ids.

Silent `catch (e) {}` is a security bug: failures hide attacks and hide outages.

---

## Admin application

- Middleware: no console route without role.
- Server components fetch with user-scoped Supabase client.
- Service role only in Route Handlers that re-check role, or prefer Edge Functions.
- CSRF: Next.js defaults + same-site cookies.
- File uploads via Storage with type/size checks; no SVG-as-script in avatars if served inline.

---

## Mobile application

- Certificate pinning is optional later; TLS via system CAs in V1.
- Debug menus disabled in production.
- Deep links: restrict to known hosts/paths.
- Screenshot of XP is not a claim; only server balance is.
- Do not ship `IGNORE_SSL` or similar.

---

## KVKK / privacy

This is a Turkish-user product. Before storing PII or location:

- Privacy notice and purpose limitation.
- Consent for optional location and later marketing.
- Access/deletion: `profiles.deleted_at` + anonymize ledger foreign keys per legal advice.
- Data processing agreement with Supabase as processor.
- DPO / club legal ownership is an organizational decision (blocking for public launch, not for local scaffold).

Engineering does not invent legal copy; we implement the hooks (deletion, export, consent flags).

---

## Security review trigger

A dedicated review is required when changing:

- RLS policies
- Edge Functions that write ledgers, presence, roles, or settlement
- Auth providers
- Storage publicness
- Admin role grants
- Location collection

Do not ship those changes “while we’re here” without tests.

---

## Incident basics

- Suspected service-role leak: rotate, revoke, audit `xp_transactions` and `user_roles`.
- Mass XP inflation: freeze `apply_xp`, snapshot ledger, reverse with negative transactions, do not delete history.
- UGC illegal content: remove, preserve audit, follow legal process.

There is no production environment yet. When it exists, this section becomes a runbook with named owners.
