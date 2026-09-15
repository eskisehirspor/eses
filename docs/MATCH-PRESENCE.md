# MATCH-PRESENCE.md

Match-day stadium presence for Eskişehirspor.

There is **no location or presence code in this repository**. This document is the V1 design. It privileges privacy, server authority, and realistic iOS/Android behaviour over “always tracking the taraftar”.

Presence is a loyalty signal: “this supporter was at this match.” It is not a surveillance product.

---

## Product intent

- Reward **verified** attendance at configured matches (typically home games).
- One verified presence per user per fixture.
- Works for people who open the app at the stadium.
- Does not punish remote supporters: they simply do not get this XP source.
- Does not require a map UI in V1.

Primary UX path: **match-window check-in**, not 24/7 background tracking.

Optional enhancement: short-lived geofence **only while the match activation window is open** and only if the user granted the required permission.

---

## Geofence model

Admin configures, per venue and optionally per fixture:

| Field | Meaning |
| --- | --- |
| `latitude` / `longitude` | Stadium point |
| `radius_meters` | Inclusive radius |
| `activates_at` | Window start (e.g. kickoff − 3 hours) |
| `deactivates_at` | Window end (e.g. full time + 2 hours, or scheduled close) |
| `is_enabled` | Kill switch |

`match_geofences` snapshots coordinates so a later venue edit does not rewrite history.

V1: one geofence per fixture. Multiple polygons are a later enhancement.

Source of truth is the **database**, not a hardcoded coordinate in the app. The app may cache the active fence for the next match.

Eskişehirspor’s home venue will be entered by admin (name + coordinates + radius). Do not treat any hardcoded map pin as production truth.

---

## Event lifecycle

```text
T-n days     Admin confirms fixture + geofence enabled
T-window     Fence becomes eligible (activates_at)
User opt-in  Foreground location permission (required)
             Background / Always — optional, asked in context
Enter        Client may observe a geofence ENTER or a manual/auto check-in
Submit       POST verify-match-presence (JWT + location sample + idempotency key)
Server       Validate window, distance, accuracy, duplicates, integrity
Result       verified | rejected | duplicate | ...
If verified  Insert presence_verifications + apply_xp once
T-end        Client unregisters geofence; server rejects new verifies
```

Client events:

- `match_presence_detected` — local enter/check-in observed (analytics, not reward).
- `match_presence_verified` — **server-emitted** after commit.

Detections without verification never grant XP.

---

## Eligibility rules (server)

All must pass:

1. Authenticated user, not `app`-banned, not `no_xp` restricted.
2. `fixture` exists; geofence `is_enabled`.
3. `now()` within `[activates_at, deactivates_at]`.
4. Reported point within `radius_meters` of fence center, using server haversine (or geography).
5. Horizontal accuracy present and ≤ configured max (e.g. 75–100 m). Reject `low_accuracy`.
6. No existing `presence_verifications` with `result = verified` for `(user_id, fixture_id)`.
7. Rate limit: e.g. 5 attempts / fixture / user.
8. Optional: Play Integrity / DeviceCheck not indicating a compromised/emulator device (fail-soft: flag, do not only-trust).

The client may send:

- latitude, longitude, accuracy, timestamp, mocked flag if the OS exposes it
- `fixture_id`
- `idempotency_key`

The client may **not** send `verified=true` or `xp`.

---

## Duplicate prevention

- Unique constraint on verified `(user_id, fixture_id)`.
- Idempotency key unique on detections/verifies.
- XP `idempotency_key = match_presence:{userId}:{fixtureId}`.
- Two devices, same account: first verified wins.
- Two accounts, same device: not fully solvable in MVP; add device attestation / install id heuristics in V1+ without blocking honest family sharing naively. Log for review; do not silently merge accounts.

---

## Anti-abuse and spoofing risks

| Risk | Reality | Mitigation |
| --- | --- | --- |
| Mock GPS | Easy on Android debug; possible on jailbroken iOS | `mocked` flag, Integrity/DeviceCheck, accuracy + movement sanity |
| VPN | Irrelevant to GPS | ignore IP as location proof |
| Photo of stadium | Not used | do not add selfie-as-proof in V1 |
| Wi-Fi SSID spoof | Weak | do not use as sole proof |
| Remote API call with stolen coords | Attacker can POST coordinates | JWT + rate limit + integrity + unlikely-accuracy heuristics; accept residual risk |
| Keep geofence always registered | Privacy + battery + store review | register only in window; unregister after |
| Continuous `watchPosition` | Against product rules | forbidden except brief verify sample |
| Replay old location | Timestamp too old vs server now | reject if sample older than N minutes |
| Large `accuracy` covering the city | Fake “inside radius” | reject low accuracy |

Honest limitation: a determined attacker with a compromised phone can often fake a point. The system should make casual farming hard and make rewards **revocable** via negative XP / voided verification by admin.

Do not claim cryptographic certainty of attendance in V1.

---

## Privacy (KVKK-conscious)

- Ask location **only** from Maçlar / presence CTA, with Turkish purpose text: maça gitmiş olmayı doğrulamak.
- Foreground first. Do not open the Always prompt on first launch.
- Do not store raw coordinates longer than needed. Prefer: result, distance_meters, accuracy_meters, timestamp.
- If raw points are stored for fraud review, retention period must be documented and purged (e.g. 14–30 days).
- Presence is opt-in. Denying location still allows the rest of the app.
- No live “fan map” of supporters in V1 (that is a different, higher-risk product).
- Privacy policy must describe match-day location use before the feature ships.

---

## iOS considerations

Source: Expo SDK 57 `expo-location` behaviour.

- Geofencing and background location require a **development/production build**, not Expo Go.
- Background geofencing needs `NSLocationWhenInUseUsageDescription`, Always usage string, and `UIBackgroundModes: location` (`isIosBackgroundLocationEnabled`).
- `requestBackgroundPermissionsAsync` maps to **Always**.
- If the user chose **Allow Once**, a subsequent Always request in the same session can **fail silently** (denied). UX must request When In Use first, explain why Always is optional, and handle denial without looping.
- iOS simultaneously monitors at most **20** regions. This app should register **one** (current match) plus none leftover.
- If the user **terminates** the app, iOS can restart it on a geofence event. Still: do not rely on this as the only path.
- iOS will report initial geofence state at startup; do not treat “already inside at register” as infinite XP — server duplicate rule holds.
- App Store review: purpose string must match actual use. Always-on tracking will fail review and fail our own rules.

Recommended iOS UX:

1. Default: foreground check-in button “Tribündeyim” during window.
2. Optional: “Maç boyunca otomatik algıla” → Always, geofence registered, removed when window ends or user turns it off.

---

## Android considerations

- Foreground location first (`ACCESS_FINE_LOCATION`).
- Background geofencing needs `ACCESS_BACKGROUND_LOCATION` (`isAndroidBackgroundLocationEnabled`) and, if using ongoing updates, foreground service location types. **We should not start a persistent location foreground service** for this product.
- Expo: up to **100** geofences; we still register one.
- If the user **swipes away / OEM kills** the app, Android **will not** reliably restart it on geofence events. This is a platform limitation (`dontkillmyapp` class issues). Therefore **foreground check-in is the reliable path** on many Android devices.
- Mock location is a developer option; treat `mocked` as reject or hold-for-review.
- Play policy: background location is sensitive. If we can ship V1 with foreground-only verify, we should. Add background geofence only with a clear in-app explanation and Play declaration.

---

## Client implementation rules

Allowed:

- `getCurrentPositionAsync` once (or a short burst) during verify.
- `startGeofencingAsync` for the active fixture region during the window, if permission exists.
- `stopGeofencingAsync` when the window ends, user logs out, or feature is disabled.

Forbidden:

- `startLocationUpdatesAsync` as a default match-day tracker.
- Sending XP amounts.
- Registering geofences for all season fixtures at once.
- Silently retrying permission prompts.

Task handlers must be defined at top-level with `TaskManager.defineTask` per Expo requirements.

---

## Failure UX

Every relevant state:

| State | UI |
| --- | --- |
| Loading | skeleton on match presence card |
| Window closed | “Bu maç için giriş penceresi kapalı” |
| Permission denied | explain + system settings CTA |
| Outside radius | “Stadyum yakınında görünmüyorsun” (no shame, no leak of exact meters to aid spoofing if product prefers coarse copy) |
| Low accuracy | “Konum hassasiyeti yetersiz, açık alanda dene” |
| Duplicate | “Bu maç için tribün puanın zaten işlendi” |
| Offline | cannot verify; say so |
| Error | generic retry + logged code |

Do not show raw coordinates to other users.

---

## Admin tools

- Edit venue coordinates and default radius.
- Override per fixture.
- Enable/disable fence.
- See verification counts (not a live person map).
- Void a verification (negative XP via ledger, audit log).

---

## Testing

- Inside radius / window → verified once.
- Second call → duplicate, no second XP.
- Outside radius → rejected.
- Before activate / after deactivate → `out_of_window`.
- Accuracy 5000 m → `low_accuracy`.
- Unregister after window (client unit + manual device tests on a dev build).

Simulator GPS is for development only and must never be the production integrity signal.
