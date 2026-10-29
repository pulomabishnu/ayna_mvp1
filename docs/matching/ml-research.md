# Learning from outcomes: ML research and plan (P3, Oct 29 2026)

Today ayna's ranking is hand-built and explainable: relevance from reviewed
need maps, evidence grades, product facts, her preferences and her own
history. That is the right start: there is no outcome data yet to learn from.
This note says what to learn, when, and the lines that never move.

## Lines that never move

1. **The safety gate stays deterministic.** `recommendationEligibilityForUser`
   (src/matching/gate.js) runs first and nothing learned can re-admit what it
   removes or lift a hold. A model only orders products the gate cleared.
2. **No commercial signal** in any feature: no partner, price-paid,
   commission or margin field.
3. **No private health data in analytics or training exports.** Calibration
   uses the anonymous `match_outcome_samples` table (band, bucket, outcome,
   engine). Anything per person stays on her device or in her own rows.
4. **Every reason shown still comes from the decision trace.** A learned
   score may reorder; it may not invent a reason.

## Stage 1: measure (now)

- Outcomes: routine tries record Helpful / No change / Worse / Side effect
  (src/health/outcomes.js); each also writes one anonymous sample.
- Calibration: `npm run calibration:report` (src/matching/calibration.js):
  helped rate per band with Wilson intervals; no claim under 30 answers a band.
- Research gaps: `npm run research:plan`.

Start Stage 2 only when every band has at least 200 answers and the report
says `ok` or `inverted` (inverted means the hand-built bands need fixing first).

## Stage 2: recalibrate the bands (simple, explainable)

Isotonic or one-parameter (temperature-style) recalibration of the band
thresholds against helped rate (Guo et al., ICML 2017: one parameter fixes
most over-confidence). Output is still three words (Strong / Good / Partial);
the percent stays "fit to what you told us", never "chance it works".

## Stage 3: learn the order inside the gate

- **Two stages, like YouTube** (Covington et al., RecSys 2016): the gate plus
  the hand-built score produce candidates; a small ranker reorders the top
  ~30 per need.
- **Features:** the same factors the trace already records (need relationship,
  evidence grade, product facts, her preference matches, history), so every
  change in order can still be explained by trace entries.
- **Exploration, carefully** (Spotify homepage, 2025: neural contextual bandit,
  1.5% epsilon-greedy, sampling near the person's history): only among
  products the gate cleared, only for non-sensitive stages (never pregnant,
  trying, breastfeeding, or anyone with listed medicines), only within the
  same band, and never moving a product above a higher band.
- **List mix:** keep Steck's calibrated-recommendations idea (KL between her
  need weights and the shelf mix) as a re-ranking term so one need never
  crowds out the others.
- **Offline evaluation first:** log the shown order with propensities, use
  inverse-propensity estimates on outcomes, and ship only with a holdout that
  shows no rise in Worse / Side effect reports.

## Stage 4: abstain better

Treat "not enough known" as a first-class answer (reject option; Hendrickx et
al., survey 2021): a learned model that is unsure (ambiguity or novelty) says
so the same way the gate does: no percent, a reason, a next step.

## Regulation

ayna is consumer-facing; the Jan 2026 FDA CDS guidance covers HCP-facing tools
and gives no new consumer policy. Staying in product discovery (no diagnosis,
no treatment decisions, no threshold alerts from wearables) and keeping the
basis of every recommendation visible is the conservative path. Have counsel
review before any learned model ships.

Sources: docs/matching/research-2026-10-29.md.
