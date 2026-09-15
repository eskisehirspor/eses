# GAMIFICATION.md

ES ES XP and loyalty architecture.

There is **no gamification code in the repository**. This document defines a server-authoritative, auditable system that can later support an elite physical supporter card without rewriting the ledger.

---

## Principles

1. The mobile client never says what XP a user has earned.
2. XP is an **append-only ledger** (`xp_transactions`), not `profiles.xp = n`.
3. Balances, levels, and leaderboards are **derived** from trusted rows.
4. Rules are **configurable** in `xp_rules` / missions. Clients may display them, not enforce them.
5. Duplicate rewards are prevented with `idempotency_key` unique constraints.
6. Negative adjustments exist for admin corrections and abuse.
7. If a write is not auditable, it is not a reward.

Forbidden:

```text
PATCH /profiles { xp: 50000 }     // never
client: user.xp += 10             // never persisted as truth
```

Required:

```text
insert xp_transactions (user_id, delta, action_key, source_type, source_id, idempotency_key)
  → trigger updates xp_balances
  → optional badge/level side effects in the same transaction
```

---

## XP architecture

### Ledger

Each transaction stores:

- `delta` (positive or negative)
- `balance_after` snapshot
- `action_key` (stable string)
- `source_type` + `source_id`
- `idempotency_key`
- `created_at`, `created_by`

Idempotency examples:

- `daily_login:{user}:{yyyy-mm-dd}`
- `article_read:{user}:{articleId}`
- `prediction_correct:{user}:{predictionId}`
- `match_presence:{user}:{fixtureId}`
- `quiz_complete:{user}:{quizId}`
- `admin_adjust:{admin}:{uuid}`

Retries from flaky networks cannot double-pay.

### Balance

`xp_balances.lifetime_xp` is the sum of all deltas (or of non-voided rows if a void type is introduced).

`season_xp` resets by season key; implemented either as:

- a column maintained at season boundary, or
- a view/sum of transactions where `created_at` in season.

Prefer summing/snapshotting server-side, not client filters.

Users may `SELECT` their own balance and public leaderboard views. They cannot `INSERT`/`UPDATE`/`DELETE` ledger or balance rows.

### Internal apply path

Single Edge Function or SQL function used by all features:

`apply_xp(user_id, action_key, source, idempotency_key, metadata)`

Steps:

1. Load active `xp_rules` for `action_key` (or mission override).
2. Enforce `max_per_day` / `max_per_match` / cooldown using existing transactions.
3. Insert ledger row.
4. Recalculate level; if level up, emit `supporter_level_up` analytics **on the server**.
5. Grant badges whose rules are now satisfied.
6. Return `{ delta, lifetime_xp, level, new_badges }`.

Public functions (`complete-mission`, `verify-match-presence`, etc.) call `apply_xp` after **their own** eligibility checks. There is no public HTTP route “apply_xp with arbitrary action_key” callable from the client.

---

## Configurable rules

`xp_rules` holds defaults. Values below are **illustrative starting points**, not final economy. Tune after seeing real usage. Do not ship them hardcoded only in JS.

| action_key | Suggested delta | Caps |
| --- | --- | --- |
| `daily_login` | +5 | 1 / day |
| `article_read` | +2 | 3 / day, unique article |
| `prediction_submitted` | +5 | per prediction |
| `prediction_correct` | +20 | per settled prediction |
| `quiz_completed` | +10 | per quiz |
| `mission_completed` | mission.xp_delta | per period |
| `match_presence_verified` | +50 | 1 / fixture |
| `referral_verified` | +15 | cap / season |
| `sponsor_mission` | campaign | future |
| `admin_adjust` | variable | admin only |

Reading content that grants XP must prove a dwell/open via server-side `article_reads` with anti-skip rules (minimum seconds, once per article). The client timestamp is not proof.

---

## Levels

`levels` table: `min_xp` thresholds and Turkish titles.

Example ladder (illustrative):

| Level | Min lifetime XP | Title |
| --- | --- | --- |
| 1 | 0 | Taraftar |
| 2 | 100 | Tribün |
| 5 | 1_000 | Kırmızı-Siyah |
| 10 | 5_000 | Sadık |
| 15 | 15_000 | Efsane |
| 20 | 50_000 | Elite Supporter |

Level is computed from `lifetime_xp`, never chosen by the user.

Elite (example 50,000) **does not automatically mint a metal card**. It sets `eligibility` for a future `supporter_cards` workflow (admin approval, engraving name, serial). See “Future physical reward”.

---

## Missions

Missions are rows, not app releases.

- `cadence`: daily / weekly / match / once
- `period_key`: `2026-09-15`, `2026-W38`, `fixture:{id}`
- Progress in `user_missions`
- Completion calls `apply_xp` with `source_type=mission`

HOME shows daily missions from this table. If the table is empty, HOME shows a proper empty state, not fake missions.

---

## Badges

Granted server-side when a rule matches (first presence, first correct prediction, streak, season rank, etc.).

`user_badges` unique `(user_id, badge_id)`.

Display on PROFİL. Badge images in Storage.

---

## Predictions

1. Admin/system creates `predictions` bound to a `fixture`.
2. `locks_at` ≤ kickoff. After lock, function rejects new entries.
3. User submits option via `submit-prediction` (idempotent per user/prediction).
4. After official `fixtures` result (or explicit correct option), cron/`settle-predictions` runs **once**.
5. Correct entries receive `prediction_correct` XP.
6. Client cannot post the correct option or self-settle.

Void if match postponed/cancelled.

---

## Quizzes

Questions’ correct answers are **not** in the mobile select policy.

`submit-quiz` receives option ids, scores on the server, writes `quiz_attempts`, applies XP once.

---

## Leaderboards

Period types: weekly, monthly, season.

- Live: rank query over trusted `xp_balances` or period-sum of ledger.
- Frozen: `leaderboard_snapshots` computed by cron at period end.

Exclude `app`-banned users. Community bans may still appear on season XP unless policy says otherwise; default: hide banned from public boards.

Client cannot upload a rank.

HOME preview reads top N from the same source as OYNA → sıralama.

---

## Anti-cheat / anti-farming

| Vector | Control |
| --- | --- |
| Client spoofs XP | no write policy; only functions |
| Replay requests | idempotency keys |
| Scripted article opens | dwell rules, daily caps, device rate limit |
| Prediction after kickoff | server lock using `locks_at` and match status |
| Quiz answer dump | answers not exposed; rate limit |
| Multiple accounts | device/install signals later; referral caps; payment later |
| Presence fake GPS | see `MATCH-PRESENCE.md`; one verified row per fixture |
| Moderator collusion | audit on admin_adjust |
| Leaderboard bots | same as account farming; snapshot diffs |

Rate limits on all of the above functions.

Never “fix” cheating by subtracting on the client. Use negative ledger rows with reason.

---

## Future physical reward

Concept (not implemented now):

- Threshold example: 50,000 lifetime XP → Elite Supporter.
- Physical personalized metal Eskişehirspor card: engraved name, unique serial, optional NFC later.

Data already planned:

- `xp_balances.lifetime_xp` is durable.
- `profiles.full_name` for engraving (collected with consent later).
- `supporter_cards` table (future migration) references `user_id`, stores serial, tier, status, `nfc_uid`, `xp_threshold_snapshot`.

Workflow later:

1. Eligibility view: XP + not banned + name present.
2. User requests issuance (or admin invites).
3. Admin approves → production → shipped → active.
4. Serial is unique and printable; NFC binds in a later phase.

Do not put shipping addresses in XP metadata. Use a dedicated PII table when the program exists, with KVKK minimization.

---

## Future revenue hooks

`xp_transactions.source_type` already can be `sponsor_mission`, `membership_bonus`, `passport_checkin`.

Do not implement ES ES+, store, or ticketing in this phase. Do not create fake premium flags on `profiles` that the client can flip.

---

## Product surfaces

- HOME: XP snapshot, daily mission, leaderboard preview, prediction teaser.
- OYNA: missions, predictions, quizzes, boards, badges.
- PROFİL: level, XP, badges, attendance count, prediction stats.

All four surfaces read the same balances. No per-screen invented totals.

---

## Testing (required)

- Idempotent double submit does not double XP.
- Inactive rule pays 0.
- Capped action rejects or no-ops with explicit code.
- Settlement pays only correct unique entries.
- Presence path cannot call `apply_xp` without a verified row.
- Admin negative adjustment is logged.
