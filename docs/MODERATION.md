# MODERATION.md

Turkish-first moderation architecture for TRİBÜN (forum, posts, comments, match chat).

There is **no community feature in the repository today**. This document is the system to implement in V1. It is intentionally **not** a static word blacklist.

Moderation is a product feature: the tribün must feel like Eskişehirspor, not an unmoderated comment section.

---

## Goals

- Catch obvious abuse quickly, including Turkish obfuscation.
- Keep false positives reviewable.
- Make harassment, threats, hate, and spam expensive.
- Give moderators a queue, not a spreadsheet.
- Record every punitive action for audit and appeal.
- Never let the client decide that content is “clean”.

---

## Pipeline

Every create/edit of user-generated content goes through an Edge Function. The mobile app does not insert into `posts` / `comments` directly.

```text
1. AuthN + authZ + restriction check
2. Rate / spam detection
3. Unicode / Turkish normalization
4. Deterministic pattern rules
5. Severity classification
6. Decision: publish | hold | reject
7. Persist content + moderation fields
8. If reported later → case in moderator queue
9. Strike / restrict / ban
10. Audit log
11. Appeal
```

Hold means: stored, not visible to others (except moderators). The author sees a “incelemede” state.

---

## 1. Authentication and restriction gate

Before text is analyzed:

- User must be authenticated and not `app`-banned.
- `user_restrictions` may block posting, chat, or fast posting (slow mode).
- Shadow-ban: accept the post, show it to the author, do not fan out on Realtime.

If this gate fails, return an explicit error. Do not fail open.

---

## 2. Rate and spam detection

Signals (server-side, sliding windows):

| Signal | Example threshold (configurable) |
| --- | --- |
| Posts per minute | 4 |
| Identical/near-duplicate body hash | 2 in 10 minutes |
| New account burst | tighter limits for first 24h |
| Excessive mentions | `@` count |
| Link density | >1 link in chat; allowlist later |
| Copy-paste across threads | normalized similarity |
| Report ratio | many unique reporters |
| Bot-like interval | near-constant posting cadence |

Actions: delay (slow mode), hold, reject `spam`, temporary `no_post`.

Do not implement thresholds in the client.

---

## 3. Turkish normalization

Purpose: collapse evasion so rules see one string.

Apply in order on a copy (`body_normalized`). Keep original `body` for display and audit.

1. Unicode NFKC.
2. Strip zero-width and bidi override characters (`U+200B–U+200F`, `U+202A–U+202E`, `U+2060`, `U+FEFF`).
3. Map homoglyphs / confusables to ASCII/Latin letters (Cyrillic `а` → `a`, etc.).
4. Turkish case fold: `I`/`ı`/`İ`/`i` handled with a Turkish-aware mapping, not naive `toLowerCase()`.
5. Map leetspeak: `0→o`, `1→i`, `3→e`, `4→a`, `5→s`, `7→t`, `@→a`, `$→s`.
6. Replace punctuation and separators between letters with empty (`s.i.k`, `s-i-k`, `s i k`).
7. Collapse repeated characters beyond 2 (`siikkkee` → `siikke`) but keep a repetition score as a spam signal.
8. Convert common keyboard / ASCII workarounds used in Turkish insult evasion.
9. Produce both:
   - `normalized_compact` (no spaces)
   - `normalized_tokens` (whitespace-split)

Store `body_normalized` (compact) for duplicate detection. Do not show it in the UI.

Unit-test this module heavily. It is the core of Turkish-first moderation.

---

## 4. Deterministic pattern rules

Rules are data + code, versioned, tested. Categories:

- **Profanity / sexual insults** (Turkish and common English).
- **Slurs and hate** (ethnicity, nationality, sect, sexual orientation, disability).
- **Threats** (“seni bulacağım”, death/violence wishes).
- **Harassment targeting** (repeated directed insults, dogpiling patterns).
- **Scam / malicious links** (URL shorteners, executable bait, phishing shapes).
- **Spam templates** (crypto, betting ads, ticket scalping spam — policy decision).
- **Club-hostile impersonation** of official accounts (separate from criticism).

Implementation:

- AHO-Corasick / compiled regex over `normalized_compact` and tokens.
- Word-boundary aware where needed so substrings do not over-match.
- Allowlist for terms that appear inside normal football talk after review.
- **Criticism of the club, board, or players is not automatically abuse.**

A simple array of raw swear words is not sufficient and must not be the only layer.

---

## 5. Severity classification

| Severity | Meaning | Default decision |
| --- | --- | --- |
| `none` | clean / football trash talk within policy | publish |
| `low` | mild profanity | publish + log |
| `medium` | strong insults, spammy | hold or publish+flag |
| `high` | harassment, slurs, scam links | hold |
| `critical` | threats, hate, CSAM, doxxing | reject + restrict + urgent queue |

CSAM, sexual content involving minors, and credible threats are **critical**. Critical paths must not wait for a daily moderator session.

Classifier in V1: deterministic rules + scores. A later ML model may **assist**, never silently replace the queue for high/critical.

---

## 6. Report system

Users can report posts, comments, chat messages, and profiles.

Reasons (Turkish UI):

- Küfür / hakaret
- Taciz
- Tehdit
- Nefret söylemi
- Spam / dolandırıcılık
- Kişisel veri / ifşa
- Diğer

Flow:

1. Reporter submits via Edge Function (`submit-report`).
2. Rate-limit reports to reduce brigading.
3. Target is hidden **for the reporter** immediately.
4. Open or attach a `moderation_cases` row.
5. Duplicate reports on the same target increment a counter, not duplicate cases.

False-report abuse can itself produce a strike after review.

---

## 7. Moderator queue and workflow

Admin web: `/moderation`.

Queue filters: severity, source (`auto`/`report`), content type, assigned, age.

Each case shows:

- Original text
- Normalized text (moderator only)
- Author history (strikes, prior cases)
- Reporter list
- Matched rule ids
- Quick actions

Actions:

| Action | Effect |
| --- | --- |
| Dismiss | close case, keep published |
| Hide/remove | `moderation_status = removed` |
| Restore | publish again |
| Warn | notify user, no strike |
| Strike | add strike, maybe auto-restrict |
| Restrict | mute / no_post / slow_mode |
| Ban | community or app, duration or permanent |
| Escalate | critical / legal |

Every action writes `moderation_actions` + `audit_logs`. Moderators cannot edit the audit trail.

Editors/admins who publish official news are not the same as tribün authors; official content is not UGC and uses a different workflow.

---

## 8. Strike system

Configurable, not hardcoded forever. Starting proposal:

| Open strikes (rolling 90 days) | Consequence |
| --- | --- |
| 1 | warning |
| 2 | 24h `no_post` or slow mode |
| 3 | 7 day community restriction |
| 4 | 30 day ban |
| 5 | permanent community ban, admin review for app ban |

Critical severity may skip to restriction/ban immediately.

Strikes expire for **threshold counting** but remain in the audit history.

`no_xp` restriction can attach to severe abuse so farming via harassment is useless.

---

## 9. Temporary restrictions and bans

- Restrictions are time-bounded rows.
- Bans: `community` (can still read news/matches) vs `app` (auth blocked / session revoked).
- Permanent bans require `admin` role, not only `moderator`, unless policy later relaxes this.
- Enforcement on every write path and, for app bans, at Auth gateway / profile fetch.

---

## 10. Audit logs

Must capture: actor, role, action, target, previous visibility, reason, timestamp.

Used for:

- Internal review
- KVKK access/deletion requests (separate from punitive logs)
- Appeal evidence

---

## 11. Appeals

Banned or restricted users get an in-app form (V1 profile) and/or email process.

- One open appeal per ban/restriction.
- Moderator/admin must not review their own action if a second person exists.
- Decision is logged. Reversal writes compensating restriction/ban rows, does not delete history.

---

## Abuse scenarios and expected handling

| Scenario | Handling |
| --- | --- |
| `s i k d i r` / `s.i.k` | normalization + profanity rule → low/medium |
| Homoglyph insults | NFKC + confusable map |
| Repeated “selam” spam | rate + duplicate hash |
| Betting/crypto links in chat | link policy → hold/reject |
| Targeted harassment across posts | reports + author history → restrict |
| Threat of violence | critical → reject + urgent + possible app ban |
| Hate slurs | high/critical → hold/remove + strike |
| Brigading reports | report rate limits; moderator sees reporter graph |
| Moderator gone rogue | audit; only admin can grant moderator; admin can revoke |
| Client sends `moderation_status=published` | ignored; column not writable |
| Encoded payloads / Zalgo / RTL tricks | strip bidi + reject if unreadable spam |

---

## Match chat specifics

- High volume: prefer slower mode during live matches if abuse spikes.
- Short messages, more slang: tune false positives with allowlists from real logs after launch.
- Presence in stadium does **not** waive moderation.
- Chat retention policy: define before launch (e.g. keep messages, delete personal data on account erasure).

---

## What V1 will not do

- Outsource all decisions to a third-party “AI moderator” without a queue.
- Shadow-delete without a status the author can understand for non-shadow-ban cases.
- Put a denylist JSON in the app bundle as the real filter (clients can be used for preview only).
