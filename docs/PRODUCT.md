# PRODUCT.md

Official Eskişehirspor fan application.

This document is the product source of truth. It describes what to build, for whom, and in what order. It does not describe implementation details; those live in `ARCHITECTURE.md`, `DATABASE.md`, and related docs.

## Repository status (2026-09-15)

This repository was inspected before any product or architecture decisions.

Findings:

- Git repository exists on branch `main`.
- There are **no commits**.
- There is **no application source**.
- There is **no `package.json`**, Expo config, Next.js app, Supabase project, or design system.
- There are **no screens, tests, CI, or environment files**.
- A nearby empty git folder named `Bizim Tribun` exists on the same machine and is not part of this repository.

This product is therefore a **greenfield** build. Nothing below should be treated as already implemented.

---

## Product vision

**Eskişehirspor taraftarının her gün açacağı dijital tribün.**

This is not a generic football news app. News is one surface. The product is a daily club-native place for:

1. Knowing what is happening with Eskişehirspor.
2. Living the match, even from far away.
3. Being seen as a supporter, not just a consumer of content.
4. Earning status through real behaviour.
5. Eventually converting loyalty into membership, offers, and physical identity.

The product should feel like Eskişehirspor: red, black, white, direct, energetic, and serious about the club. It should not feel like a white-label sports aggregator.

### Core pillars

| Pillar | Job to be done |
| --- | --- |
| Match Center | Never miss the next match, the live match, or the result. |
| News | Official club information, not rumour recycling. |
| Fan Community | A moderated tribün: posts, match chat, belonging. |
| Gamification | ES ES XP, missions, predictions, quizzes, leaderboards. |
| Fan Loyalty | Levels, badges, attendance, future physical supporter card. |
| Match Presence | Prove you were at the stadium without turning the app into spyware. |
| Future Revenue | ES ES+, sponsors, pasaport, store, ticketing — designed now, built later. |

---

## Brand and tone

- Language: **Turkish-first**. English is not a launch requirement.
- Voice: club-official, warm, sharp. Not corporate. Not meme-only.
- Visual: red / black / white. Premium sports product, not a local news site.
- Navigation must use the five primary destinations below on mobile.

Primary bottom navigation:

1. **HOME**
2. **MAÇLAR**
3. **TRİBÜN**
4. **OYNA**
5. **PROFİL**

Every screen must have loading, empty, error, and offline/poor-connection states. Permission-dependent screens must also have a permission state.

---

## Personas

### 1. Maç günü tribüncüsü

- Age roughly 16–35.
- Goes to home matches when possible.
- Wants live score, match chat, presence XP, and the feeling of being in the stadium digitally.
- Low patience for broken live data or slow chat.

### 2. Uzaktan / gurbetçi taraftar

- Cannot attend regularly.
- Opens the app for news, fixtures, predictions, quizzes, and match-day atmosphere.
- Needs the product to feel legitimate even without stadium access.
- Presence features must never make this person feel second-class.

### 3. Sadık sezonluk

- Follows the club daily.
- Wants history, attendance record, leaderboard standing, and future physical card eligibility.
- Will notice if XP is unfair or farmable.

### 4. Aile / genç taraftar ortamı

- Reads news and watches videos.
- May use chat. Must be protected from harassment, threats, and adult/abusive content.
- Moderation is a product feature, not an afterthought.

### 5. Kulüp yayıncısı / moderatör / admin

- Publishes official news, announcements, and match-related content.
- Moderates tribün reports.
- Configures XP rules, geofences, missions, and later sponsor campaigns.
- Uses the **Next.js admin** app, never privileged tools inside the mobile client.

---

## User journeys

### Daily open (non-match day)

1. Open app → authenticated session restored.
2. HOME shows next match, latest official news, daily mission, XP snapshot, announcement if any.
3. User reads one article or completes a short mission.
4. Optional: check standings or tribün.
5. Leave. Session should feel useful in under two minutes.

### Match day — attending

1. Push: “Bugün maç var” / line-up / kickoff reminder, according to preferences.
2. HOME and MAÇLAR highlight the live/next match.
3. If inside activation window and user opts in, match presence can be detected/verified.
4. Match chat is available in TRİBÜN.
5. After full time: recap, XP for eligible actions, attendance recorded if verified.

### Match day — not attending

1. Same match-centric home.
2. Live score and timeline in MAÇLAR.
3. Prediction already locked before kickoff.
4. Match chat without presence XP.
5. Result notification if enabled.

### New supporter onboarding

1. Sign in (Apple / Google / email; phone is a later decision).
2. Create display name and supporter profile.
3. Explain XP and community rules in Turkish, briefly.
4. Request notification permission at a relevant moment, not on first paint.
5. Location permission is **not** requested until match-presence context exists.

### Report and moderation

1. User reports a post/comment/chat message.
2. Content is hidden from reporter immediately.
3. Item enters moderator queue with severity hint.
4. Moderator acts: dismiss, hide, strike, restrict, or ban.
5. Target user sees a clear restriction state. Appeal path exists.

### Future elite card (not in MVP)

1. User reaches configured XP threshold (example concept: 50,000 XP).
2. Profile shows eligibility, not an instant shipment.
3. Admin reviews identity/name for engraving.
4. Physical card is produced with unique serial (NFC optional later).
5. Digital profile links to the issued card record.

---

## Feature map

### HOME

- Personalized home feed.
- Next match.
- Previous match.
- Latest official news.
- Daily missions preview.
- Predictions preview.
- Fan XP snapshot.
- Leaderboard preview.
- Club announcements.

### NEWS

- Official news.
- Categories.
- Articles.
- Video.
- Photo galleries.
- Breaking news.
- Personalized notification preferences.

### MAÇLAR / Match Center

- Fixtures.
- Standings.
- Match details.
- Live score.
- Goals, cards, substitutions.
- Starting XI.
- Match statistics when provider data allows.
- Live match timeline.
- Goal notifications.
- Configurable match notifications.

### TRİBÜN / Fan community

- Forum.
- Match chat.
- Posts, comments, replies.
- Likes.
- Reports, blocking.
- Moderation and moderator actions.

### OYNA / Gamification

- ES ES XP ledger and levels.
- Badges.
- Missions.
- Predictions.
- Quizzes.
- Weekly / monthly / season leaderboards.
- Anti-farming controls.

### PROFİL / Fan identity

- Supporter profile.
- Level, XP, badges.
- Match attendance.
- Predictions history.
- Achievements.
- Supporter statistics.
- Settings, notifications, privacy, blocked users.

### Match presence

- Match-specific geofence.
- Configurable stadium coordinates and radius.
- Activation window.
- Entry detection and server-side verification.
- Duplicate reward prevention.
- Privacy-conscious location handling.
- No unnecessary continuous tracking.

### Admin (web)

- Role-protected publishing of news and announcements.
- Fixture/match operations (manual override + provider sync status).
- Moderation queue.
- XP rule configuration.
- Mission / quiz / prediction configuration.
- Venue and geofence configuration.
- User restriction tools.
- Audit logs.
- Later: memberships, campaigns, card issuance.

### Explicitly future (design now, do not implement unless already present)

- ES ES+ premium membership.
- Sponsor campaigns and sponsor missions.
- ES ES Pasaport and merchant offers.
- Store integration.
- Ticketing and season-ticket integration.
- Digital supporter membership.
- Physical personalized metal supporter card.

The current repository contains **none** of the above.

---

## MVP

MVP is the smallest product that a taraftar would open on a weekday and on a match day, and that the club can honestly call official.

### In MVP

- Expo iOS/Android app with the five-tab shell, design system, and Turkish UI.
- Auth and supporter profile basics.
- HOME: next/previous match, latest news, announcements.
- NEWS: official articles with categories; basic breaking flag.
- MAÇLAR: fixtures, standings, match detail, score; live updates if a provider is contracted in time, otherwise delayed/manual official score.
- PROFİL: identity, settings, notification preferences.
- Admin: news + announcements publishing, basic match data management.
- Push: official news / announcement / match start / goal (if live data exists).
- Legal baseline: KVKK privacy text, terms, community rules, account deletion.

### Out of MVP

- Forum, match chat, likes, reports beyond a stub.
- XP ledger, missions, predictions, quizzes, leaderboards.
- Match presence / geofence.
- Premium, store, ticketing, physical card.
- Personalization beyond “official + next match”.

TRİBÜN and OYNA tabs **exist in the IA** in MVP so the product identity is correct. They may show a polished “yakında” or a read-only teaser, not fake community/XP data.

---

## V1

V1 is the first complete digital tribün.

- Full TRİBÜN: forum, match chat, comments, likes, block, report.
- Layered Turkish-first moderation, strikes, restrictions, bans, appeals.
- OYNA: XP ledger, levels, badges, missions, predictions, quizzes.
- Weekly / monthly / season leaderboards derived from server data.
- Match presence for home matches.
- HOME personalization using XP, missions, and predictions.
- Notification preferences per match and content type.
- Admin tools for all of the above.

---

## Future roadmap

See `ROADMAP.md` for phases. Product sequence after V1:

1. Monetization: ES ES+, sponsor campaigns, pasaport.
2. Club commerce: store, ticketing, season ticket linking.
3. Advanced loyalty: elite thresholds, physical card issuance, NFC later.
4. Richer match data and media if rights allow.

---

## Analytics (product events)

Do not add an analytics vendor in MVP unless a later decision requires one. Define the event model first and write events to a first-party table and/or a thin client logger.

Required event names:

- `app_open`
- `screen_view`
- `article_view`
- `match_view`
- `prediction_started`
- `prediction_submitted`
- `quiz_started`
- `quiz_completed`
- `mission_completed`
- `XP_earned`
- `leaderboard_view`
- `forum_post_created`
- `report_submitted`
- `match_presence_detected`
- `match_presence_verified`
- `notification_opened`
- `supporter_level_up`

`XP_earned`, `mission_completed`, `match_presence_verified`, and `supporter_level_up` must be emitted **server-side** from trusted writes, not from the client claiming success.

---

## Success criteria

MVP is successful if:

- A supporter can learn the next match and read official news without confusion.
- Auth, profile, and admin publishing work reliably.
- The app feels like Eskişehirspor, not a template.

V1 is successful if:

- Supporters return on non-match days because of missions/community/news.
- XP cannot be credibly farmed from the client.
- Moderation can handle Turkish abuse without a simple word list.
- Match presence grants attendance only when the server agrees.

---

## Non-goals

- Building a generic multi-club sports app.
- Scraping unofficial news sites as a content strategy.
- Trusting the phone as the authority for XP, attendance, or prediction results.
- Shipping background location tracking as a default always-on behaviour.
- Implementing premium/store/ticketing/physical card in the first build.
