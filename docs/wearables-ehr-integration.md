# Wearable and EHR integration

Status: **mockup** (`wearable-ehr-integration` branch). The You tab has a new
**Health data** row. Connecting only flips local state so the flow can be
reviewed. Nothing reads a device or calls an API yet.

## Files

| File | What it is |
| --- | --- |
| `src/mobile/data/healthConnections.js` | Sources, data types, where each can be connected, mock storage |
| `src/mobile/screens/profile/HealthConnectionsScreen.jsx` | List + per-source consent screen. `MOCKUP = true` |
| `src/mobile/screens/profile/health-connections.css` | Styles, same card system as Settings |
| `src/mobile/screens/profile/ProfileFlow.jsx` | Hub row + `healthData` / `healthData:<id>` screens |
| `src/mobile/data/healthConnections.test.js` | Data model + render tests |

Already in the repo and worth reusing: `src/components/HealthDataImport.jsx`
(Apple Health `export.xml` upload, FHIR bundle paste) and
`src/utils/healthDataProfile.js`.

Dev preview: `npm run dev`, then `/mobile-preview?overlay=profile&pscreen=healthData`,
or `pscreen=healthData:oura` for a detail screen. On a deploy preview: `/mobile-preview` → You → Health data.

## Rules (decide before real data flows)

1. Wearable and record data change **personal** matches only. Never Browse
   ranking, never anything partners see or pay for. Same rule as today's
   partnership policy.
2. Consent is per data type, off by default. Nothing syncs that isn't toggled on.
3. Disconnect deletes everything pulled from that source.
4. HealthKit data can't be used for advertising or sold (App Store rules).
5. Privacy policy and Consumer Health Data policy get a wearables + records
   section before launch. Have a lawyer review it.

ayna isn't a HIPAA covered entity, including when a person pulls their own
records into ayna. The FTC Health Breach Notification Rule and state laws like
Washington's My Health My Data Act still apply. HIPAA becomes relevant if ayna
ever handles records on behalf of a clinic or provider.

## Phase 1: wearables

- **Apple Health (iOS app).** HealthKit via a Capacitor plugin (evaluate a
  maintained community plugin vs a small custom Swift plugin). Read-only:
  menstrual flow, basal/wrist temperature, sleep analysis, HRV, steps and
  workouts. Needs the HealthKit entitlement and usage strings in `ios/`.
- **Health Connect (Android app).** Same data types via a Capacitor plugin.
  Google Fit APIs are being retired at the end of 2026, so don't build on them.
- **Oura (web + app).** OAuth 2.0 to the Oura API. Token exchange and refresh
  live in a new `api/` route; tokens stored server-side only, never in the client.
- **Storage.** Supabase table `health_connections` (user_id, source,
  data_types, connected_at, synced_at) plus `health_daily_summaries`
  (user_id, source, date, metric, value). Store daily summaries, not raw
  sample streams. RLS: owner only.
- **Matching.** Map summaries to existing needs in `src/matching/` (e.g.
  short sleep → sleep needs, irregular cycle length → cycle needs). Show the
  reason in Why this match ("From your Oura sleep data").

## Phase 2: more devices and health records

- Whoop, Garmin (Garmin needs its own API, it doesn't write to Health Connect),
  Fitbit through the Google Health API. Or switch to an aggregator (Terra,
  Junction) if users ask for many devices at once. Compare per-user cost
  then.
- **Health records.** Two routes:
  - Apple Health Records via HealthKit clinical records (iOS, no portal login).
  - Patient portal login through SMART on FHIR, directly or via a records
    aggregator. Pulls conditions, medications, allergies, labs.
  - Records feed safety checks (medications, allergies) and prefill the health
    profile. They never leave the person's account.

## Open questions for the founders

- Which 3–4 signals change matches first?
- Oura or Apple Health first, if only one ships in the first build?
- Do connected records prefill the intake quiz, or only show as suggestions?
