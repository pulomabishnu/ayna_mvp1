# QA report · ayna Oura demo film

Checked Oct 28, 2026 against `main` @ `41994a92` ("Merge pull request #88"), plus `fix/oura-routine-matching-policy`.

## Pre-flight

| Check | Result |
|---|---|
| PR #88 shipped | **Yes.** Merged into `main` today at 12:36 ET (`41994a92`). Every screen in the film was recaptured from post-merge `main`. Per CLAUDE.md, Vercel deploys `main` automatically. I couldn't load the live site from this sandbox, so do one visual check on your phone. |
| Oura screens in the film exist in the shipping version | Yes. Home › Your data › Manage connected apps › Health data › Oura; the real quiz › "Your ayna is ready."; Your data › Sleep. |
| Oura production credentials configured | **Not verifiable from here.** Open `https://www.aynahealth.co/api/health-oauth?action=status`. It should show `"oura": true`. If it's `false`, `OURA_CLIENT_ID`, `OURA_CLIENT_SECRET` or `HEALTH_TOKEN_ENCRYPTION_KEY` is missing in Vercel. |
| Oura developer cap understood | Yes. New Oura apps are capped at 10 users until Oura approves them (`api/_healthProviders.js`). The email says so. |
| Oura-derived insight shows Oura as its source | Yes. The sleep card ends "From Oura", and the page header reads "From Oura and your uploads". |
| No Oura data shown powering Ask ayna | Yes. Ask ayna doesn't appear. The film shows the app's own line "Oura data is never given to an AI model." |
| No Oura data shown changing product matches | Yes. Matches are shown with their real reasons ("For your period cramps", "Fragrance-free, which you asked for"), all from quiz answers. The persona has no sleep goal. The two lanes are labelled and kept apart, and the app's line "It does not change your product matches until Oura confirms its terms allow it" closes the act. |
| No unsupported Oura metrics | Yes. On screen: sleep (minutes, 7/30/90 days, usual range), and the "What ayna reads" list, which matches `src/health/providers/oura.js` exactly. No SpO2, stress or minute-level heart rate. No streaming claim: the app shows "Synced 4 min ago". |
| No real user health information | Yes. All data is fictional (README › Where the data comes from). |
| No official-partnership implication | Yes. There is no "ayna × Oura", no Oura logo, and no "partner" or "official" language. The close reads "connected today. more, with Oura's approval." |
| Film matches the production product | Yes, every product pixel is a capture of the shipped app. Three things differ from what a real member would see. (1) Oura data is fictional and enters at the service boundary, not from a real ring. (2) The Pro check is answered as "has access", so no paywall is shown. (3) Fonts are served from Fontsource copies of the same Google Fonts families. |

## Product findings to fix or know about

1. **Fixed, separate branch:** Oura data reached two product surfaces despite `SOURCE_POLICY.oura.matching = false`:
   - the routine night-slot note (`plan.js`);
   - "What might help this week" picks on Your data › Routine (`weekPicks.js`).
   Both are now filtered through the matching policy, with regression tests. Merge the branch before sending, or confirm neither surface is live for Oura users.
2. **Copy to review (not changed):** the shared Sleep consent text says ayna will "tell you when that makes sleep products more relevant"
   (`src/health/metrics.js`, `CATEGORIES.sleep.why`). That's true for Apple Health and Health Connect, but on the Oura screen it sits
   just above "It does not change your product matches". It's visible in the film for about 5 s, small. Consider a per-source variant for Oura.
3. **"Use my health data in my matches"** is on by default on the Health data screen. It's correct for eligible sources, and Oura
   is still excluded by policy. Not shown in the film.

## Visual / motion

No generated UI, logos or charts. Every floating component is a live-DOM capture of the real one. Text stays flat. There are no rotations,
springs, beams or particles. There are three single-component extraction moments plus one two-lane composition. The phone stays the anchor.

## Sound

The film works muted. Foley is synthesized, with no music; integrated loudness is about -31 LUFS and peaks are around -5 dBFS. The last ~3 s are silent.

## CEO test

- ~2 s: Oura inside the real ayna app.
- ~12 s: discovery is real, and personalized from what she told ayna.
- ~20 s: Oura powers her insights, with attribution.
- ~28 s: the two are deliberately separate, and the app says so in its own words.
- Runtime is 38 s.
