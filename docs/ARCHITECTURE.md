# ARCHITECTURE.md

Recommended architecture for the official Eskişehirspor fan application.

This is a **proposed** architecture. The repository currently contains no application code, no packages, and no backend. Recommendations below are constrained by the product vision, Expo SDK 57, Supabase, and the security rules in `SECURITY.md`.

---

## Current repository architecture

Phase 0 identity plus Phase 1A content/match tables are implemented. Later pillars are not.

| Area | State |
| --- | --- |
| Framework | pnpm workspaces: Expo SDK 57 mobile, Next.js 16 admin, `packages/shared` |
| Screens | Five-tab shell, Home with live queries, news list/detail, match list/detail/standings, email auth, profile |
| Backend | Identity + news + fixtures/standings migrations; no hosted project linked |
| Auth | Email/password. Apple/Google remain disabled flags until provider setup |
| Database | profiles, user_roles, news_*, competitions, teams, venues, fixtures, match_events, standings |
| Design system | `apps/mobile/src/design` |
| Remote | None |

Tabs are usable without login. Published news and match data are publicly readable via RLS. Profile/admin require a session.

---

## Recommended application architecture

Monorepo. One repository, two deployable apps, one Supabase project.

```text
/
  apps/
    mobile/                 # Expo SDK 57, React Native, Expo Router
    admin/                  # Next.js App Router, TypeScript
  packages/
    shared/                 # types, enums, XP action IDs, analytics names, zod schemas
  supabase/
    migrations/             # SQL source of truth
    functions/              # Edge Functions (Deno)
    seed/                   # non-production seed only
  docs/
  .cursor/rules/
```

Why a monorepo:

- XP action IDs, analytics event names, and role enums must not drift between mobile, admin, and Edge Functions.
- One PR can change a migration, an Edge Function, and the client contract together.
- The repo is empty; this is cheaper than splitting later.

Why not a backend separate from Supabase in MVP:

- Auth, Postgres, Storage, Realtime, and Edge Functions cover the required server-authoritative work.
- A custom Node API can be added later if match-provider ingestion or ticketing outgrows Edge Functions. Do not invent that now.

### Target runtime versions

| Piece | Target |
| --- | --- |
| Expo | SDK 57 |
| React Native | 0.86 (SDK 57) |
| React | 19.2.x |
| Node | 22.13+ (Expo 57 requirement) |
| TypeScript | strict, in all packages |
| Expo Router | file-based routing, typed routes |
| Next.js | current App Router LTS at implementation time |
| Supabase | hosted project + CLI migrations in-repo |

Use a development build for anything involving background location, geofencing, or custom native config. Expo Go is acceptable only for early UI work.

Package manager: **pnpm workspaces**. Lockfile committed. Do not mix npm/yarn in the same repo.

---

## Frontend architecture (mobile)

### Routing

Expo Router, typed routes enabled.

Phase 0 routes plus Phase 1A content routes:

```text
apps/mobile/app/
  _layout.tsx
  (auth)/sign-in.tsx
  (auth)/sign-up.tsx
  (tabs)/_layout.tsx
  (tabs)/index.tsx            # HOME
  (tabs)/maclar/index.tsx
  (tabs)/maclar/[id].tsx
  (tabs)/tribun.tsx
  (tabs)/oyna.tsx
  (tabs)/profil.tsx
  haber/index.tsx
  haber/[slug].tsx
  +not-found.tsx
```

Deep links use HTTPS app links / universal links once domains exist. Scheme placeholder: `eskisehirspor://`.

### Layers

```text
app/            routes only
src/features/   feature modules (news, matches, community, play, presence, profile)
src/design/     tokens + reusable UI primitives
src/lib/        supabase client, query client, i18n, logging
src/hooks/      shared hooks
```

Features may import `design` and `lib`. Features must not import other features’ private files. Shared contracts live in `packages/shared`.

### State management

Do not add Redux.

| State | Tool |
| --- | --- |
| Server/cache state | TanStack Query |
| Auth session | Supabase Auth listener + small AuthProvider |
| Ephemeral UI (sheets, toasts) | Zustand or React context; one, not both |
| Forms | React Hook Form + zod |
| Realtime | Supabase Realtime subscriptions, invalidated into Query cache |

Rules:

- The database is the source of truth for XP, attendance, predictions, and moderation state.
- Query cache is a cache, not a ledger.
- Optimistic UI is allowed for likes/comments **display**, never for XP or rewards.
- Persistence: news, fixtures, and profile may be persisted for offline read. Reward actions are never queued as if they succeeded.

### Design system

Create `apps/mobile/src/design` first, before feature screens.

Tokens: color (red/black/white/neutral), type, space, radius, elevation, z-index.

Required primitives:

- Button
- Card
- Chip
- Tabs
- Badge
- Avatar
- Bottom sheet
- Dialog
- Skeleton
- Toast / inline feedback
- Error / empty / offline / permission states

Screens compose primitives. They do not invent one-off colors or button styles.

Accessibility: readable contrast on red/black, dynamic type, minimum hit targets, screen-reader labels in Turkish.

### Error handling (client)

- Never swallow errors.
- Map unknown errors to a Turkish user message **and** a loggable `code`.
- Every query/mutation surfaces `isLoading`, empty, `isError`, and offline.
- Network distinction: offline vs failed vs unauthorized vs forbidden vs gone.
- Crash reporting vendor is **not** required in Phase 0. Use a structured logger interface so Sentry (or similar) can be attached later without rewriting screens.

### Offline / poor connection

- Show an explicit connection banner when the net info reports offline or constrained.
- Read cached HOME/news/fixtures if present.
- Mutations that affect XP, predictions, presence, or moderation require connectivity. Fail visibly.
- Match chat does not pretend to send while offline.

---

## Frontend architecture (admin)

Next.js App Router, TypeScript, deployed separately (Vercel or equivalent).

```text
apps/admin/app/
  (auth)/login
  (console)/
    news/
    matches/
    moderation/
    users/
    gamification/
    venues/
    audit/
```

Auth: Supabase Auth with **server-side** session. Middleware must reject users without `admin` or `moderator` role. Moderators see moderation + read-only user tools. Admins see configuration and publishing.

The admin app uses the **anon/authenticated key** plus RLS, or a user-scoped server client. It must **not** embed the service-role key in the browser. If a privileged admin operation cannot be expressed in RLS, it goes through an Edge Function that checks role server-side.

---

## Backend architecture

Supabase project:

- Postgres: all durable state.
- Auth: users and sessions.
- Storage: article images, avatars, gallery assets. Private buckets + signed URLs unless the object is truly public.
- Realtime: match live events, match chat, moderation badges for admin. RLS still applies.
- Edge Functions: all reward-affecting and abuse-prone mutations.

### Edge Functions (initial set)

| Function | Authority |
| --- | --- |
| `submit-prediction` | lock, eligibility, idempotency |
| `settle-predictions` | admin/cron only |
| `complete-mission` | validates rule, writes XP ledger |
| `submit-quiz` | scores server-side |
| `verify-match-presence` | geofence + window + anti-abuse |
| `apply-xp` | internal helper, not a public “give me XP” API |
| `create-post` / `create-comment` | moderation pipeline then insert |
| `submit-report` | report + rate limit |
| `moderator-action` | role check + audit |
| `ingest-match-events` | provider webhook/cron, service role |

Public mobile clients call Edge Functions with the user JWT. Functions use the service role **only inside the function environment** to write ledgers after validation.

Postgres triggers may maintain `xp_balances` from `xp_transactions`. Triggers must not accept client-supplied totals.

### Cron / scheduled work

Use `pg_cron` + Edge Function or Supabase scheduled functions for:

- Prediction settlement after match status = finished (only if official result exists).
- Leaderboard snapshot materialization.
- Geofence deactivation after match window.
- Strike expiry / restriction expiry.
- Provider fixture sync.

---

## Data flow

### Read path (news, fixtures)

```text
Mobile → Supabase PostgREST (JWT) → RLS → tables
Admin writes → RLS (admin role) or Edge Function → tables
Mobile Query cache ← Realtime invalidation (optional)
```

### Reward path (XP, presence, predictions)

```text
Mobile intent
  → Edge Function (JWT)
  → validate input, rate limit, idempotency key
  → read trusted tables
  → insert xp_transactions / presence_verifications
  → trigger updates xp_balances
  → return authoritative result
Mobile never PATCHes xp columns
```

### Live match path

```text
Provider or admin ingest
  → Edge Function (secret)
  → match_events / fixtures
  → Realtime
  → clients
  → push worker for goal events (respects notification_preferences)
```

### Community path

```text
Mobile compose
  → Edge Function
  → normalize + rules + spam
  → insert post (published | held | rejected)
  → Realtime to subscribers
  → reports → moderator queue → actions → audit_logs
```

---

## Integrations

| Integration | Status | Notes |
| --- | --- | --- |
| Supabase | required | Auth, DB, Storage, Realtime, Functions |
| Match data provider | **undecided** | Blocks live score quality. Design fixtures as provider-agnostic. |
| Club CMS / news source | **undecided** | Admin publishing is the default source. |
| Expo Push Notifications | MVP | First-party; no OneSignal unless later required. |
| Apple / Google Sign-In | MVP | Via Supabase Auth. |
| Analytics vendor | not in MVP | First-party `analytics_events` + typed logger. |
| Maps SDK | not required for users | Presence uses coordinates, not a map UI, in V1. |
| Ticketing / store | future | Interfaces only. See database `integrations` notes. |
| Play Integrity / DeviceCheck | V1 presence | Anti-spoof signal, never the only signal. |

Do not scrape third-party sports sites. If no provider is contracted, admin-entered scores are the honest MVP.

## PROVIDER-DEPENDENT

Phase 1A does **not** integrate a live-score or fixture provider.

Core tables are provider-neutral (`competitions`, `teams`, `fixtures`, `match_events`, `standings`). Optional `provider_code` + `provider_*_id` columns exist only for later idempotent ingest.

Until a provider is chosen:

- Kickoff, status, and scores may be entered by an ops admin (`admin` / `super_admin`) directly in the database.
- `live` / `halftime` are manual statuses, not a scoring engine.
- `match_events` is a foundation table; the mobile app does not render a live timeline yet.

A custom HTTP API was not invented. Ingest should be an Edge Function when a provider is contracted.

---

## Authentication state (planned)

- Supabase Auth.
- Session in secure storage via official supabase-js / supabase-rn pattern.
- Profile row created by trigger on `auth.users` insert (`profiles`).
- Roles in `user_roles`, never a client-editable `is_admin` boolean on `profiles`.
- Unauthenticated users may read public news/fixtures if product later wants a store preview; **default for this club app is auth-required after splash**, because community, XP, and presence are identity-bound. Final product call: see blocking questions.

---

## Error handling (server)

- Edge Functions return `{ error: { code, message } }` with HTTP 4xx/5xx. No empty 200 on failure.
- Idempotent retries: client sends `Idempotency-Key`; unique constraint enforces it.
- Ingest functions log provider payload ids to prevent duplicate match events.
- Failed XP writes must not leave a “mission complete” side effect. Use a single transaction.

---

## Security architecture (summary)

Full model in `SECURITY.md`.

Non-negotiable:

1. Service-role key only in Edge Function / CI secrets.
2. RLS on every exposed table. Default deny.
3. Clients cannot insert/update XP, balances, leaderboards, presence verifications, or match results.
4. Admin UI is role-gated.
5. UGC passes moderation before or immediately after insert, with hold on high severity.

---

## Analytics architecture

Event taxonomy is listed in `PRODUCT.md`.

Implementation:

- `packages/shared` exports a union of event names.
- Client may log `app_open`, `screen_view`, `article_view`, `match_view`, `notification_opened`, and similar observational events.
- Server emits reward and integrity events when the ledger/presence/moderation write commits.
- Table: `analytics_events` (append-only). No PII in event properties beyond `user_id`.
- Do not block UX on analytics insert failure, but **log** the failure. That is not silent ignore: the logger must receive it.

---

## Testing strategy

| Layer | Requirement |
| --- | --- |
| `packages/shared` | unit tests for XP rule types, event names |
| Moderation normalizer | extensive unit tests (Turkish obfuscation cases) |
| Edge Functions | tests for idempotency, RLS-unrelated validation, duplicate presence |
| SQL | RLS tests via `supabase test` or pgTAP |
| Mobile | component tests for design-system states; e2e later for auth + tab shell |

Business-critical logic (XP, presence, prediction settlement, moderation severity) must have tests **before** feature complete.

---

## What not to add yet

- Extra state libraries (Redux, MobX, Recoil).
- Custom Node API “just in case”.
- Analytics SaaS.
- Chat SDK (Stream, etc.) while Supabase Realtime can serve match chat.
- Background location as a permanent tracking service.
- Placeholder microservices that cannot be staffed.

Build the smallest architecture that can enforce server-authoritative loyalty. Expand when a real integration forces it.
