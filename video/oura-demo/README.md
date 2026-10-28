# ayna · Oura demo film

A 38-second product film for Oura, made from the real ayna app. It contains no generated UI and no redrawn screens.

The app shown is `main` after PR #88 merged (Oct 28, 2026), plus the two policy fixes on
`fix/oura-routine-matching-policy` (see "Production code" below). Neither fix changes anything visible in the film.

## What the film says

| Time | Shot | Real product state |
|---|---|---|
| 0–4s | Oura in the real Health data list; the row lifts out | Apps and wearables, Oura not yet connected |
| 4–9s | Oura's consent screen; Sleep and Temperature switched on; "What ayna reads / never reads" lifts out | Oura detail, before connecting |
| 9–10s | Oura connected | "Synced 4 min ago", "You share" |
| 10–18s | **Discovery from her stated context**: her two goals and her first matches, then a match that is fragrance-free "which you asked for" | The real results screen after the real quiz |
| 18–24s | **Oura → insight**: her Oura sleep card, against her own usual, ending "From Oura" | Your data › Sleep |
| 25–31s | Both lanes side by side, apart: "discovery · from what she shared" / "insights · from Oura". The app's own policy line comes forward | Oura detail, connected |
| 32–38s | ayna wordmark · "women's health, in context" · "connected today. more, with Oura's approval." | |

Editorial copy (outside the phone): "she chooses what to share", "matched to what she told ayna",
"her Oura nights, in her insights", "Oura powers insights today. discovery stays separate."

Nothing in the film shows Oura data changing products, resources, care, Ask ayna, or anything else Oura doesn't power. The persona
deliberately has no sleep goal, so her matches can't be mistaken for an Oura effect.

## Render it again

From the repo root:

```bash
npm ci --ignore-scripts
cd video/oura-demo && npm i && cd ../..                 # fonts (Fontsource copies of the app's Google Fonts)
npx vite --config video/oura-demo/vite.config.mjs &     # film-only dev server on :5199

cd video/oura-demo/capture
python3 make_persona.py        # runs the REAL quiz once with fictional answers -> persona_state.json
python3 capture.py             # captures every screen and component -> ../assets/

cd ../film
python3 render.py stills 2.6 12.6 21.5 28.8   # quick look (out/still_*.png)
python3 render.py frames --fps 60 --workers 2 # 4K/60 master, ~20 min on 2 cores
bash finish.sh                                # sound, 4K master, 4K + 1080p H.264, thumbnail
```

Needs Python 3 with `playwright`, `numpy`, `scipy`, `Pillow`, plus `ffmpeg` and Node 22. No environment variables are needed:
the film uses no API keys, no Supabase project and no Oura credentials.

## Where the data comes from

| Data | Source | Kind |
|---|---|---|
| Oura sleep, readiness, temperature, heart, activity, workouts | `fixture/ouraDemoFixture.js`: 90 days shaped like Oura API v2 responses (`daily_readiness`, `sleep`, `daily_activity`, `workout`), run through the **same code the server runs after a real Oura sync**: `ouraRows()` (`src/health/providers/oura.js`) then `cleanRows(…, { source: 'oura' })` (`src/health/metrics.js`). Every row is honestly tagged `source: 'oura'`. Only metrics ayna's Oura integration really reads can appear. | Fictional, mocked at the service boundary |
| Period days | Same fixture, as her own uploads (`source: 'manual_import'`, `user_entered`) | Fictional |
| Goals, life stage, flow, pain, fragrance sensitivity | The **real quiz**, answered by `capture/make_persona.py` from `persona_actions.json`: 34, regular periods, cramps + heavy periods, no known diagnoses, fragrance sensitivity, no medicines, first name "Maya" | Fictional, entered through the real UI |
| Matches, match %, "For your period cramps", "Fragrance-free, which you asked for" | ayna's real matching engine and catalog, from those answers | Real output |
| Sleep card, "6h 43m · usual 7h 39m", "From Oura" | ayna's real insights and dashboard code, from the fixture rows | Real output |
| Signed-in user | The app's own dev-only stand-in (`DEV_DEMO_USER`, `?healthdemo=1`, `import.meta.env.DEV` only) | Dev mechanism already in the app |
| Pro access | `GET /api/pro?action=features` answered `{"enabled": false}` in the capture browser, so the gate renders what a member with access sees. No Pro UI appears in the film. | Mocked at the service boundary |
| Fonts | DM Sans, DM Serif Display, Bricolage Grotesque, Poppins, DM Mono: the app's own Google Fonts families, served from Fontsource because the sandbox has no Google Fonts access | Same typefaces |
| Device frame, status bar (9:41), motion, editorial type, sound | `film/index.html`, `film/sound.py` | Editorial |

No real person's health data is used anywhere.

## How it is built

- **Capture** (`capture/capture.py`): Playwright drives the real app at 393×852 pt, 3× scale (iPhone 16 Pro). Screens are captured at
  1179×2292 px. Each component that lifts out is captured **from the live DOM** with everything else hidden, so it keeps its real
  pixels, radius and shadow. Taller cards are captured in a taller viewport, so they come out whole.
- **Film** (`film/index.html`): a deterministic timeline. `setTime(t)` places every layer. The lift is a shared-element move
  from the component's real slot (which dims), with scale 1.0–1.3, a growing soft shadow, and no rotation or springs. Copy stays flat.
- **Render** (`film/render.py`): headless Chromium at 2× (3840×2160), 60 fps, frames piped into ffmpeg as ProRes 422 HQ.
- **Sound** (`film/sound.py`): synthesized foley tied to timeline events (tap, two toggle ticks, quiet material shifts, landing tones,
  one tonal lift for the policy line). No music. The last ~3 s are silent. It works muted.

Remotion was not used. It doesn't render the Vite app's global CSS and providers as-is. Rendering the real app in Chromium
and moving real captured components gives the same fidelity with no new dependencies in the app.

## Production code

`video/oura-demo/` is self-contained and is not imported by the app or its build. The film dev server
(`vite.config.mjs`) swaps only `src/health/devDemo.js`, a dev-only module the production build never reads.

Separately from the film, two compliance fixes are on branch `fix/oura-routine-matching-policy` (patches in the delivery folder):

1. `src/health/plan.js`: the routine and shopping list read only insight sections whose sources are all allowed for matching by
   `SOURCE_POLICY`. Before, an Oura-derived "Your sleep has been shorter than your usual lately" note appeared on the night slot.
2. `src/health/weekPicks.js` + `HealthHome.jsx`: "What might help this week" picks read only matching-eligible rows
   (`weekPicksFromRows`). Before, Oura-measured short nights could add a sleep-product pick with an Oura-derived reason.

Both have regression tests that fail without the fix (`src/health/dashboard.test.js`, `src/health/weekPicks.policy.test.js`).
Apple Health, Health Connect and uploads behave exactly as before. Insights still show Oura data. Full suite: 338 files,
3,359 tests pass.
