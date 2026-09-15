# DATABASE.md

Proposed PostgreSQL schema for the Eskişehirspor fan application.

### Phase 0 implemented

Migration `supabase/migrations/20260915120000_phase0_identity.sql` creates only:

- `profiles` (`id`, `display_name`, `avatar_path`, `preferred_locale`, `theme_preference`, timestamps, `deleted_at`)
- `user_roles` (`user_id`, `role`, `granted_by`, `granted_at`)
- enum `app_role`: `user`, `moderator`, `editor`, `admin`, `super_admin`
- trigger `handle_new_user` → profile + default role `user`
- RLS default-deny; own-profile update of allowed columns; own-role select; no client writes to roles

A hosted Supabase project is **not** linked yet. Remaining tables below are still proposed.

Conventions:

- UUID primary keys (`gen_random_uuid()`).
- `created_at timestamptz not null default now()`.
- Soft-delete only where necessary (`deleted_at`); ledgers are **not** soft-deleted.
- Enums as Postgres enums or check constraints; app copies live in `packages/shared`.
- All tables enable RLS. Default deny. See RLS strategy at the end.
- Clients never write reward or attendance facts.

---

## ER overview

```text
auth.users
  └── profiles 1—1
        ├── user_roles
        ├── xp_balances 1—1
        ├── xp_transactions 1—n
        ├── user_badges
        ├── user_missions
        ├── prediction_entries
        ├── quiz_attempts
        ├── presence_verifications
        ├── posts / comments / likes / reports
        ├── blocks
        ├── strikes / restrictions / bans / appeals
        └── supporter_cards (future)

competitions ─ fixtures ─ match_events
     │              ├── match_lineups
     │              ├── match_geofences
     │              └── predictions
venues ─────────────┘

news_categories ─ articles ─ article_media
xp_rules ─ missions / badges / levels
```

---

## Identity and roles

### `profiles`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | = `auth.users.id` |
| `display_name` | text not null | unique `lower(display_name)` where not deleted. **Phase 0 implemented.** |
| `full_name` | text | optional; later used for card engraving. **Not in Phase 0.** |
| `avatar_path` | text | storage path, not a free URL. **Phase 0 column exists; upload is later.** |
| `bio` | text | short. **Not in Phase 0.** |
| `city` | text | **Not in Phase 0.** |
| `preferred_locale` | text not null default `'tr'` | **Phase 0 implemented.** |
| `theme_preference` | text not null default `'system'` | **Phase 0 implemented** (placeholder UX). |
| `onboarding_completed_at` | timestamptz | **Not in Phase 0.** |
| `is_shadow_banned` | boolean not null default false | server-only. **Not in Phase 0.** |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `deleted_at` | timestamptz | account deletion |

**Do not store `xp` on this table as a client-writable field.** Display XP joins `xp_balances`.

Constraints: `display_name` length 3–24, allowed charset defined in app + check constraint.

Indexes: unique `lower(display_name)` where `deleted_at is null`.

### `user_roles`

| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | uuid fk profiles | |
| `role` | `app_role` not null | `user` \| `moderator` \| `editor` \| `admin` \| `super_admin` |
| `granted_by` | uuid | |
| `granted_at` | timestamptz | |

PK `(user_id, role)`. No user can self-insert admin.

### `push_tokens`

`user_id`, `token`, `platform` (`ios`/`android`), `last_seen_at`, unique `(user_id, token)`.

### `notification_preferences`

Per user JSON or typed columns: `news`, `breaking`, `match_start`, `goals`, `lineup`, `community`, `missions`. Default conservative except official news.

---

## Content: news

### `news_categories`

`id`, `slug` unique, `title`, `sort_order`, `is_active`.

### `articles`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | |
| `slug` | text unique | |
| `title` | text not null | |
| `excerpt` | text | |
| `body` | jsonb or markdown text | |
| `category_id` | uuid fk | |
| `cover_path` | text | |
| `content_type` | text | `article` \| `video` \| `gallery` |
| `video_url` | text | only if type=video; allowlist hosts |
| `is_breaking` | boolean default false | |
| `is_announcement` | boolean default false | HOME pin |
| `status` | text | `draft` \| `scheduled` \| `published` \| `archived` |
| `published_at` | timestamptz | |
| `author_id` | uuid | admin user |
| `source` | text default `'admin'` | future CMS |

Indexes: `(status, published_at desc)`, `is_breaking` where published, GIN on title if search needed later.

### `article_media`

`article_id`, `storage_path`, `media_type`, `sort_order`, `alt_text`.

### `article_reads`

Optional: `user_id`, `article_id`, `read_at`, unique `(user_id, article_id)`. Used for missions. Inserts only via Edge Function if they grant XP.

---

## Match center

Provider-agnostic. Provider ids are metadata, not primary keys.

### `competitions`

`id`, `name`, `season_label`, `external_id`, `provider`, `is_active`.

### `teams`

`id`, `name`, `short_name`, `slug`, `crest_path`, `is_eskisehirspor` boolean, `external_id`, `provider`.

Exactly one row should have `is_eskisehirspor = true` (unique partial index).

### `venues`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | |
| `name` | text | e.g. home stadium display name |
| `latitude` | numeric(9,6) not null | |
| `longitude` | numeric(9,6) not null | |
| `radius_meters` | integer not null | default geofence radius |
| `timezone` | text not null default `'Europe/Istanbul'` | |
| `is_home_stadium` | boolean | |

Coordinates are **admin-configurable**. Never hardcode as the only source of truth.

### `players`

`id`, `team_id`, `name`, `squad_number`, `position`, `external_id`, `is_active`.

### `fixtures`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | |
| `competition_id` | uuid | |
| `venue_id` | uuid | |
| `home_team_id` | uuid | |
| `away_team_id` | uuid | |
| `kickoff_at` | timestamptz not null | |
| `status` | text | `scheduled` \| `live` \| `ht` \| `ft` \| `postponed` \| `cancelled` |
| `home_score` | integer | null until known |
| `away_score` | integer | |
| `minute` | integer | |
| `provider` | text | |
| `external_id` | text | unique per provider |
| `is_home_for_es` | boolean generated or maintained | |

Indexes: `kickoff_at`, `status`, unique `(provider, external_id)` where provider is not null.

### `match_events`

`id`, `fixture_id`, `sort_key`, `minute`, `extra_minute`, `type` (`goal`,`own_goal`,`yellow`,`red`,`sub_in`,`sub_out`,`var`,…), `player_id`, `assist_player_id`, `payload jsonb`, `provider_event_id`, `created_at`.

Unique `(provider, provider_event_id)` for idempotent ingest.

### `match_lineups`

`fixture_id`, `team_id`, `player_id`, `is_starter`, `shirt_number`, `position`, `sort_order`.

### `match_stats`

`fixture_id`, `team_id`, `stat_key`, `stat_value numeric`. Sparse; only when provider supplies.

### `standings`

`competition_id`, `team_id`, `played`, `won`, `drawn`, `lost`, `gf`, `ga`, `gd`, `points`, `rank`, `updated_at`. PK `(competition_id, team_id)`.

---

## Community

### `forum_categories`

`id`, `slug`, `title`, `description`, `sort_order`, `is_match_chat` boolean default false, `is_locked`.

### `posts`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | |
| `category_id` | uuid | |
| `author_id` | uuid | |
| `fixture_id` | uuid null | match chat / match thread |
| `title` | text | null for chat messages |
| `body` | text not null | |
| `body_normalized` | text | server-only, for spam/similarity |
| `moderation_status` | text | `published` \| `held` \| `rejected` \| `removed` |
| `toxicity_severity` | text | `none` \| `low` \| `medium` \| `high` \| `critical` |
| `like_count` | integer not null default 0 | maintained by trigger |
| `comment_count` | integer not null default 0 | |
| `created_at` | timestamptz | |
| `edited_at` | timestamptz | |
| `deleted_at` | timestamptz | |

Indexes: `(category_id, created_at desc)` where published; `(fixture_id, created_at)` for match chat; `(author_id, created_at)`.

### `comments`

Same moderation columns. `post_id`, `parent_id` nullable (replies), `author_id`, `body`, `body_normalized`.

### `likes`

`user_id`, `target_type` (`post`\|`comment`), `target_id`, `created_at`. Unique `(user_id, target_type, target_id)`.

### `blocks`

`blocker_id`, `blocked_id`, unique pair, check `blocker_id <> blocked_id`.

---

## Moderation

### `reports`

`id`, `reporter_id`, `target_type`, `target_id`, `reason`, `details`, `status` (`open`\|`in_review`\|`resolved`\|`dismissed`), `created_at`. Unique open report per reporter/target.

### `moderation_cases`

Queue item: `id`, `target_type`, `target_id`, `opened_at`, `source` (`auto`\|`report`\|`admin`), `severity`, `status`, `assigned_to`.

### `moderation_actions`

Append-only: `id`, `case_id`, `actor_id`, `action` (`dismiss`,`hide`,`restore`,`warn`,`strike`,`restrict`,`ban`,`unban`), `reason`, `metadata jsonb`, `created_at`.

### `strikes`

`id`, `user_id`, `severity`, `reason`, `case_id`, `expires_at`, `created_at`.

### `user_restrictions`

`user_id`, `type` (`mute_chat`\|`slow_mode`\|`no_post`\|`no_xp`), `starts_at`, `ends_at`, `reason`.

### `bans`

`user_id`, `scope` (`community`\|`app`), `reason`, `banned_at`, `expires_at` null = permanent, `banned_by`.

### `appeals`

`id`, `user_id`, `ban_id` or `restriction_id`, `body`, `status`, `reviewed_by`, `reviewed_at`.

### `moderation_audit_logs`

Generic append-only log for queue decisions. May overlap `audit_logs`; prefer one global `audit_logs` plus typed action tables.

---

## Gamification

### `xp_rules`

Configurable rules. Not hardcoded in the client.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | |
| `action_key` | text unique | e.g. `daily_login`, `article_read`, `prediction_correct`, `match_presence_verified` |
| `delta` | integer not null | may be negative for admin adjustments |
| `max_per_day` | integer | null = unlimited |
| `max_per_match` | integer | |
| `cooldown_seconds` | integer | |
| `is_active` | boolean | |
| `starts_at` / `ends_at` | timestamptz | |

`delta` is a default; missions can override via their own reward column but still write through the ledger with a rule/action key.

### `xp_transactions` (ledger)

**Append-only.** No updates. No deletes except legal erasure of the user (then anonymize).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | |
| `user_id` | uuid not null | |
| `delta` | integer not null | |
| `balance_after` | integer not null | denormalized snapshot |
| `action_key` | text not null | |
| `source_type` | text | `mission`,`prediction`,`quiz`,`presence`,`admin`,`referral`,`read`,… |
| `source_id` | uuid | |
| `idempotency_key` | text not null | unique |
| `metadata` | jsonb | no precise GPS |
| `created_by` | text | `system` \| admin user id |
| `created_at` | timestamptz | |

Unique `idempotency_key`.  
Index `(user_id, created_at desc)`, `(action_key, created_at)`.

### `xp_balances`

| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | uuid pk | |
| `lifetime_xp` | integer not null default 0 | |
| `season_xp` | integer not null default 0 | |
| `level` | integer not null default 1 | derived from thresholds |
| `updated_at` | timestamptz | |

Maintained **only** by trigger/function on `xp_transactions` insert. Revoke GRANT insert/update/delete from `authenticated`.

### `levels`

`level` int pk, `min_xp` int unique, `title` text (e.g. `Taraftar`, `Kırmızı-Siyah`, `Elite`).

### `badges`

`id`, `slug`, `title`, `description`, `icon_path`, `rule jsonb` or `action_key`, `is_active`.

### `user_badges`

`user_id`, `badge_id`, `earned_at`, unique pair. Inserted server-side.

### `missions`

`id`, `slug`, `title`, `description`, `cadence` (`daily`\|`weekly`\|`match`\|`once`), `action_key`, `target_count`, `xp_delta`, `starts_at`, `ends_at`, `is_active`.

### `user_missions`

`user_id`, `mission_id`, `period_key` (e.g. `2026-09-15`), `progress`, `completed_at`, unique `(user_id, mission_id, period_key)`.

### `predictions`

`id`, `fixture_id`, `title`, `status` (`open`\|`locked`\|`settled`\|`void`), `opens_at`, `locks_at`, `settled_at`, `correct_option_id`.

### `prediction_options`

`id`, `prediction_id`, `label`, `sort_order`.

### `prediction_entries`

`id`, `prediction_id`, `option_id`, `user_id`, `created_at`. Unique `(prediction_id, user_id)`. No client updates after insert; lock enforced in function.

### `quizzes`

`id`, `title`, `status`, `xp_reward`, `starts_at`, `ends_at`.

### `quiz_questions`

`id`, `quiz_id`, `prompt`, `sort_order`, `correct_option_id` **not selectable by clients** (column-level / view).

### `quiz_options`

`id`, `question_id`, `label`.

### `quiz_attempts`

`id`, `quiz_id`, `user_id`, `score`, `max_score`, `completed_at`, unique `(quiz_id, user_id)` unless retakes allowed.

### `leaderboard_snapshots`

`id`, `period_type` (`weekly`\|`monthly`\|`season`), `period_key`, `user_id`, `xp`, `rank`, `computed_at`. Unique `(period_type, period_key, user_id)`.

Live leaderboard reads can use a SQL view over `xp_transactions` or `xp_balances.season_xp` with filters. Snapshots freeze history.

---

## Match presence

### `match_geofences`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | |
| `fixture_id` | uuid unique | one primary fence per match in V1 |
| `venue_id` | uuid | |
| `latitude` | numeric(9,6) | snapshot; may copy venue then override |
| `longitude` | numeric(9,6) | |
| `radius_meters` | integer not null | |
| `activates_at` | timestamptz not null | e.g. kickoff − 3h |
| `deactivates_at` | timestamptz not null | e.g. full time + 2h |
| `is_enabled` | boolean | |

### `presence_detections`

Client-observed enter events. **Not sufficient for XP.**

`id`, `user_id`, `fixture_id`, `detected_at`, `client_accuracy_m`, `client_mocked` boolean null, `idempotency_key`. Store rounded/coarse location if needed; prefer not storing raw WGS84 long-term.

### `presence_verifications`

Server decision.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | |
| `user_id` | uuid | |
| `fixture_id` | uuid | |
| `detection_id` | uuid | |
| `result` | text | `verified` \| `rejected` \| `duplicate` \| `out_of_window` \| `out_of_range` \| `low_accuracy` \| `integrity_fail` |
| `distance_meters` | integer | |
| `accuracy_meters` | integer | |
| `integrity_signal` | text | Play Integrity / DeviceCheck summary |
| `verified_at` | timestamptz | |
| `xp_transaction_id` | uuid null | |

Unique `(user_id, fixture_id)` where `result = 'verified'` — **duplicate reward prevention**.

Retention: precise coordinates (if stored at all) purged after a defined KVKK window; keep result + distance bucket.

---

## Future physical card and revenue (stub tables)

Create the tables in a later migration when needed, but **shape identity so they attach cleanly**. Do not implement product flows now.

### `supporter_cards` (future)

`id`, `user_id`, `serial_number` unique, `tier` (`elite`, …), `xp_threshold_snapshot`, `engraved_name`, `nfc_uid` null, `status` (`eligible`\|`approved`\|`production`\|`shipped`\|`active`\|`revoked`), `issued_at`.

Eligibility is a query: `xp_balances.lifetime_xp >= threshold` AND not banned AND profile name present. Do not let the client set `status`.

### Revenue placeholders (future migrations)

- `memberships` (ES ES+)
- `campaigns` / `campaign_participations` (sponsors)
- `passports` / `merchant_offers` (ES ES Pasaport)
- `orders` / `order_items` (store)
- `external_tickets` (ticketing / season ticket link)

Use `source_type` on `xp_transactions` so sponsor missions and membership bonuses do not need a new ledger later.

---

## Analytics and audit

### `analytics_events`

`id`, `user_id` null, `name` text, `properties jsonb`, `occurred_at`, `app_version`, `platform`. Index `(name, occurred_at)`.

### `audit_logs`

`id`, `actor_id`, `actor_role`, `action`, `target_type`, `target_id`, `ip` null, `user_agent` null, `metadata jsonb`, `created_at`. Append-only. Service role insert only.

### `idempotency_keys`

Optional dedicated table if not using per-ledger unique keys: `key`, `user_id`, `endpoint`, `response_hash`, `created_at`.

---

## Relationships (summary)

- `profiles.id` → `auth.users.id` on delete cascade (or restrict + anonymize job).
- Fixtures belong to competitions, two teams, optional venue.
- Geofence belongs to fixture and venue snapshot.
- Posts belong to category and optional fixture.
- Comments belong to posts, optional parent comment.
- All XP comes from `xp_transactions`; balances and leaderboards are derived.
- Presence XP only if a `presence_verifications` row is `verified` and linked to a transaction.

---

## Indexes (critical)

- `xp_transactions (user_id, created_at desc)`
- `xp_transactions (idempotency_key) unique`
- `presence_verifications (user_id, fixture_id)` unique where verified
- `fixtures (kickoff_at)`
- `articles (status, published_at desc)`
- `posts (category_id, created_at desc)` filtered published
- `reports (status, created_at)`
- `match_events (fixture_id, sort_key)`
- `leaderboard_snapshots (period_type, period_key, rank)`

---

## RLS strategy

**Default:** `enable row level security` + no policy = deny.

| Table | `anon` | `authenticated` | service role |
| --- | --- | --- | --- |
| `profiles` | none | select public fields; update own non-privileged columns | all |
| `user_roles` | none | select own | all |
| `articles` | optional published-only | published-only select | all |
| `fixtures` and match data | optional | select | ingest writes |
| `posts`/`comments` | none | select published + own; **no direct insert** | function writes |
| `likes` | none | insert/delete own; select counts | |
| `reports` | none | insert own; select own | |
| `blocks` | none | own rows | |
| `xp_rules` | none | select active | admin write |
| `xp_transactions` | none | **select own only** | insert via function |
| `xp_balances` | none | select own; leaderboard via view | trigger |
| `leaderboard_snapshots` | none | select | cron |
| `presence_*` | none | select own; **no insert** | function |
| `quiz_questions.correct_option_id` | none | hidden via view | |
| `moderation_*` | none | none for supporters | moderator/admin policies |
| `audit_logs` | none | none | insert |
| `supporter_cards` | none | select own | admin |

Helper functions (SQL):

- `is_admin()` / `is_moderator()` reading `user_roles`.
- `current_profile_id()`.

Never use `security definer` functions that bypass RLS without a strict `search_path` and role check.

Grants:

- Revoke `all` on ledger, verification, settlement, and role tables from `anon` and `authenticated` except the selects above.
- Admin writes to news/fixtures: either `editor`/`admin` policies or Edge Functions.

---

## Views

- `leaderboard_season` — `xp_balances` ranked, excluding banned.
- `published_articles` — status/published_at filter.
- `quiz_questions_public` — questions without correct answers.

---

## Migrations practice

- One concern per migration.
- Never edit applied migrations; add a new one.
- Seed only non-production: categories, sample venue, level table, default XP rules.
- Production venue coordinates entered by admin, not by seed, unless explicitly approved.
