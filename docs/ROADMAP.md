# ROADMAP.md

Phased delivery for the Eskişehirspor fan application.

Phase 0 is implemented in-repo as of 2026-09-15. Do not start Phase 1 until instructed. A hosted Supabase project still needs to be linked before real auth works.

---

## Phase 0 — Foundation

**Status:** complete in this repository (scaffold, tabs, design system, identity migration, email auth, admin access shell). EAS development builds and a linked Supabase project are still operator setup, not code.

**Goal:** a real repo that future agents can build on without inventing structure.

- pnpm monorepo: `apps/mobile`, `apps/admin`, `packages/shared`, `supabase/`.
- Expo SDK 57 TypeScript app, Expo Router, five-tab shell (HOME, MAÇLAR, TRİBÜN, OYNA, PROFİL).
- Design tokens + core primitives (button, card, skeleton, empty/error/offline).
- Next.js admin shell with login placeholder.
- Supabase CLI linked; first migrations: `profiles`, `user_roles`, RLS helpers.
- Auth (email + Apple + Google as accounts allow).
- Strict TypeScript, ESLint, basic CI (`tsc`, lint).
- EAS project + development builds (required later for location).
- No fake XP numbers. No dummy leaderboard pretending to be live.

**Exit:** installable app shows Turkish tabs, loading/empty/error patterns, signed-in profile stub.

---

## Phase 1 — Official information

**Goal:** the app is useful on a weekday.

- `news_categories`, `articles`, media storage.
- Admin publishing (draft/publish/breaking/announcement).
- HOME: next/previous match placeholders + latest news + announcements.
- NEWS list/detail (article, video URL, gallery).
- Fixtures/teams/competitions schema; admin entry **or** provider ingest if contracted.
- MAÇLAR: fixtures list, standings if data exists, match detail (score, lineup if present).
- Push tokens + preferences; send on publish/breaking (and match events if data exists).
- KVKK/terms screens; account deletion entry point.

**Exit:** a supporter can read official news and see the next match without community or XP.

---

## MVP

**Goal:** first public-quality cut of an official club app.

MVP = Phase 0 + Phase 1, polished:

- Reliable auth and profile (display name, avatar).
- HOME / NEWS / MAÇLAR / PROFİL fully designed.
- TRİBÜN and OYNA visible in navigation with honest empty or “yakında” states (no fake users).
- Live score **if** a provider or operational admin process exists; otherwise official delayed score with clear copy.
- Notifications for news and match start.
- Admin roles enforced.
- Crash/error logging interface; no swallowed errors.
- App Store / Play listing prep (legal, icons, privacy questionnaire).

**Out:** forum, chat, XP, predictions, quizzes, geofence, premium.

---

## V1 — Digital tribün

**Goal:** daily reason to open the app besides news.

1. **OYNA**
   - `xp_rules`, ledger, balances, levels.
   - Daily missions, predictions, quizzes.
   - Weekly/monthly/season leaderboards.
   - Badges and PROFİL stats.
2. **TRİBÜN**
   - Forum categories, posts, comments, replies, likes.
   - Match chat tied to fixtures.
   - Block + report.
   - Full moderation pipeline and admin queue.
3. **Match presence**
   - Venues + geofences.
   - Foreground verify; optional windowed geofence on a dev/prod build.
   - Duplicate-safe XP.
4. **HOME personalization**
   - Missions, XP, prediction, leaderboard preview — all from server data.
5. **Notifications**
   - Goals (if live ingest), lineup, mission reminders (non-spammy).

**Exit:** XP cannot be client-forged; tribün is moderated in Turkish; presence pays once per match.

---

## Monetization phase

**Goal:** revenue without breaking trust.

Only after V1 is stable and legally cleared:

- ES ES+ membership (entitlements server-side; Store/Play IAP or club billing).
- Sponsor campaigns and sponsor missions (ledger `source_type` already supports this).
- ES ES Pasaport / merchant offers.
- Store integration (deep link or catalog; payments via existing commerce if the club has one).
- Digital supporter membership.

Do not ship client-flippable `is_premium`.

---

## Advanced supporter ecosystem

**Goal:** loyalty becomes identity in the real world.

- Ticketing / season-ticket account linking (official club systems only).
- Attendance history as a first-class PROFİL surface.
- Elite threshold eligibility (example: 50,000 XP).
- Physical metal card issuance: name, serial, production statuses.
- NFC / wallet pass **after** the physical program exists.
- Richer match stats/media if rights exist.
- Possible custom ingest/API service if Edge Functions are no longer enough.

---

## Suggested calendar (indicative, not a contract)

Depends entirely on club access, data rights, and staffing. Engineering sequence is more important than dates.

| Order | Work |
| --- | --- |
| 1 | Phase 0 scaffold |
| 2 | News + admin CMS |
| 3 | Matches data path |
| 4 | Push + profile polish = MVP |
| 5 | XP ledger + missions |
| 6 | Predictions/quizzes/boards |
| 7 | Community + moderation |
| 8 | Presence |
| 9 | Monetization |
| 10 | Physical card |

Community before presence: presence without a trusted identity/XP core is just a map toy. XP before community is possible if staffing is short; product identity prefers both in V1.

---

## Explicit non-work until instructed

- Implementing the whole app after documentation.
- Rewriting this repo around a different stack without evidence.
- Adding analytics vendors, chat SDKs, or extra backends “for completeness”.
- Scraping unofficial sports sites.
- Shipping Always-on background location.

Next implementation step after this documentation phase: **Phase 0 only**, when instructed.
