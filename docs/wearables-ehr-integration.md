# Wearable health data (EHR later)

Status (Oct 18, 2026): the wearable side is built for real where a permitted
integration path exists, and honestly blocked where it doesn't. Nothing in
the app pretends a connection works. EHR / provider records are **not**
started; the schema leaves room for them.

Branch `wearable-ehr-integration`, PR #49. Not merged.

## Implementation matrix

Researched from official developer docs and terms in October 2026.

| Source | Real method | Data ayna uses | Where | Needs | Built now? | Terms that matter | Fallback |
|---|---|---|---|---|---|---|---|
| **Apple Health** | HealthKit via `@capgo/capacitor-health` 8.x + `capacitor-ayna-cycle` (period days) | sleep + stages, period days, basal + overnight wrist temp, resting HR, HRV (SDNN), avg HR, steps, active energy, workouts | iOS app only | HealthKit entitlement (added), first Xcode build, App Review | **Yes (code), not yet compiled** | App Review 5.1.3: no ads/marketing/data mining except health management; disclose data collected; no iCloud storage of health data. Read denials are invisible to apps. | Upload health data |
| **Oura** | OAuth 2.0 (server-side) | sleep + stages, resting HR + HRV (RMSSD) from sleep, temp deviation, readiness, steps, active calories, workouts | Web + app | `OURA_CLIENT_ID/SECRET`; 10 users until Oura approves | **Yes, behind credentials** | API Agreement (Jun 8, 2026): no "advertising, marketing, or commercial targeting"; no feeding to AI except Oura's MCP; minimum data; delete in 72h. **So Oura API data powers Insights only, not Health Match, until Oura confirms in writing.** Needs an active Oura membership. | Oura → Apple Health |
| **Upload health data** | On-device parse of CSV / JSON / TXT; review before save | anything in the model the file contains | Web + app | none | **Yes** | File never stored. Screenshots: optional AI reading, **off** (`HEALTH_IMAGE_EXTRACTION`) until processor terms are approved; type-it-in otherwise | Type it in |
| **Request a source** | Name + note saved | none | Web + app | none | **Yes** | | |
| **Health Connect** | `@capgo/capacitor-health` + `capacitor-ayna-cycle` | sleep + stages, period days, basal temp, resting HR, HRV (RMSSD), avg HR, steps, active calories, exercise | Android app only | Play Console Health apps declaration, privacy policy URL, first Android Studio build | **Yes (code), not yet compiled** | Play health policy: no ads, no transfer to ad platforms/brokers, explicit consent to share, per-permission justification, reproductive health gets "heightened scrutiny". 30-day read cap without `READ_HEALTH_DATA_HISTORY` (requested). | Upload |
| **Strava** | OAuth v3 exists | workouts | | | **No (on purpose)** | API Policy (Jun 1, 2026): 7-day storage max, no combining with other customer data, no AI use. ayna's model is storing trends and combining them, so it doesn't fit. | Strava → Apple Health / Health Connect |
| **Garmin** | Connect Developer Program (Health, Activity, Women's Health APIs; OAuth 2.0 PKCE) | sleep, stress, steps, Body Battery, workouts, cycle | | Business application + approval; some metrics need a license fee | **No: applications paused** | | Garmin Connect → Apple Health / Health Connect |
| **Flo** | No public or partner API | period dates | | none | **Import only (built)** | Flo does NOT send period logs to Apple Health. Export: Menu → Help → Contact us → request JSON/TXT. | Upload |
| WHOOP | OAuth 2.0, 10-member sandbox | sleep, recovery, workouts | | Tier approvals | Not built | No copies beyond cache headers; no AI training; no ads | Request a source |
| Fitbit | Fitbit Web API is turned off Oct 30, 2026; Google Health API needs restricted-scope verification + CASA ($500–4,500/yr) | sleep, activity (no cycle read scope) | | Google verification | Not built | | Fitbit → Health Connect |
| Samsung Health | Health Connect (no extra work); Samsung SDK needs partner approval | via Health Connect | Android | | via Health Connect | | |
| Natural Cycles / Clue | No API | period/temperature | | | Import only (CSV / JSON) | | Upload |

## How it works

```
Phone (HealthKit / Health Connect) ──daily rows──┐
Oura API (server pulls) ─────────────────────────┤──> api/health-data  ──> health_daily_metrics (RLS)
Upload (parsed on device, she confirms) ─────────┘          consent + validation         │
                                                                                         ▼
                                   src/health/dedupe.js  one value per metric per day
                                                                                         ▼
                                   src/health/insights.js  trends vs her own baseline
                                         │                                    │
                              Health Insights screen        src/health/matchContext.js
                                                            (only sources allowed by policy.js,
                                                             only needs she chose)
                                                                     │
                                                       Health Match: "corroborated" need
```

### One normalized model (`src/health/metrics.js`)
Every row: `user, source, origin, metric, day, value, unit, method (observed/derived/user_entered), synced_at, notice_version, import_id`.
`source` = the connection; `origin` = who measured it (an Oura night arriving through Apple Health has source `apple_health`, origin `oura`). Daily summaries only.

### Duplicates (`src/health/dedupe.js`)
Per metric per day:
1. Same origin = same measurement: keep one, prefer the direct source.
2. Different devices, level metrics (sleep, HR, temp): keep one by her preferred source, else precedence (ring/watch before phone). Never averaged or added.
3. Different devices, totals (steps, workouts): take the larger single source. May undercount, never double counts.
HRV SDNN (Apple) and RMSSD (Oura, Health Connect) are separate metrics and never compared.

### Insights (`src/health/insights.js`)
Sections: Sleep, Cycle, Recovery, Activity, Heart & stress. Last 7 days vs the 28 before; needs ~2 weeks of data ("Building your baseline" until then). Copy describes change ("shorter than your recent average"), never a condition. Each card names its sources and how it changes her ayna experience. Nothing derived is stored, so deleting rows deletes insights.

### Health Match (`src/health/matchContext.js`, `src/matching/*`)
Priority: what she told us > safety/life stage > health-data context > preferences.
- Never creates a need (the engine's rule: needs are only what she chose).
- Never weakens a need she chose.
- A trend that supports a chosen need marks it `corroborated`:
  - website (v2 engine): need weight +0.15, capped below her first need;
  - app (v1 engine): explanation only ("Your recent trends made this more relevant to you" on Why this match).
- A trend for a need she didn't choose is only a suggestion in Insights ("Update my goals").
- Only sources allowed by `src/health/policy.js` (not Oura API data yet).
- Off when "Personalize with my data" is off.
- Never passed to Browse ranking, partner placement, ads, analytics, reporting or any LLM.

## Database (`supabase/health_data.sql`)

| Table | Client can | Purpose |
|---|---|---|
| `health_connections` | read own | one row per source: status, categories consented, sync on/off, last sync, error code |
| `health_data_events` | read own | append-only consent/deletion log (categories, notice version, counts; no values) |
| `health_daily_metrics` | read + delete own | normalized daily rows |
| `health_imports` | read own | record of an upload (app name, kind, rows saved); never the file |
| `health_source_requests` | insert + read own | "Request another app or wearable" |
| `health_oauth_tokens` | nothing | AES-256-GCM encrypted tokens, server only |
| `health_oauth_states` | nothing | one-time 10-minute OAuth state nonces |

All writes go through the API (service role) so consent can't be skipped. Tested on Postgres in `supabase/_health_behaviour_test.sql` (isolation, no client writes, no token reads, own-row delete, cascade on account deletion). Apply after the existing files: `psql "$SUPABASE_DB_URL" -f supabase/health_data.sql`, then regenerate `expected-schema.json`. Schedule `purge_expired_health_oauth_states()`.

## API

- `GET/POST /api/health-data`: connections, rows, connect/update/pause/resume/disconnect (with or without deletion), device sync, upload import, delete all, source requests.
- `POST /api/health-oauth`: start (one-time state) / sync. `GET ?action=status`.
- `GET /api/health-oauth-callback`: provider redirect. Register exactly `https://www.aynahealth.co/api/health-oauth-callback` with Oura.
- `GET/POST /api/health-extract`: screenshot reading, off unless `HEALTH_IMAGE_EXTRACTION=anthropic`. PRISM trace redacted (`trace.redact`).
- Account deletion revokes Oura and deletes every health table; account export includes them (not tokens).

## Environment

| Variable | Needed for |
|---|---|
| `HEALTH_TOKEN_ENCRYPTION_KEY` | 32 bytes, hex or base64. OAuth token encryption. Without it Oura stays off. |
| `OURA_CLIENT_ID`, `OURA_CLIENT_SECRET` | Oura. Register at Oura's developer portal; 10-user cap until approved. |
| `HEALTH_OAUTH_REDIRECT_BASE` | optional, default `https://www.aynahealth.co` |
| `HEALTH_IMAGE_EXTRACTION=anthropic` | only after the screenshot processor review |

## Native (not yet compiled)

- iOS: `ios/App/App/App.entitlements` (HealthKit, no clinical records), `NSHealthShareUsageDescription`, SPM packages added by `npx cap update ios`. Open in Xcode, confirm the HealthKit capability shows on the App target, build, TestFlight.
- Android: read-only Health Connect permissions (the plugin's write and unused read permissions are stripped with `tools:node="remove"`), `READ_HEALTH_DATA_HISTORY`, privacy policy URL string. Build in Android Studio; fill in the Play Console Health apps declaration with exactly these permissions.
- `native/capacitor-ayna-cycle`: our small read-only plugin for period days (the maintained plugin has no menstrual type). Swift + Kotlin, needs its first build.

## Still to decide / do

- Written confirmation from Oura that personal product matching in a shop is allowed (then flip `SOURCE_POLICY.oura.matching`). Apply for Oura approval past 10 users.
- Counsel review: HealthKit 5.1.3 "marketing" line vs commerce personalization; Washington MHMDA + Nevada + Connecticut consent and policy; FTC HBNR applies (ayna combines user-entered + wearable data).
- Consumer Health Data Privacy Policy: draft in `docs/legal/consumer-health-data-policy-DRAFT.md`.
- App Store privacy "nutrition label" and Play Data Safety form updates (health & fitness data, linked to identity, app functionality only, not tracking).
- Garmin: apply when the program reopens.
- EHR (later): Apple Health Records / SMART on FHIR. Not started.
