# How ayna's match engine decides, and what it rests on

Written 2026-10-21. Keep this current when the engine changes.

## Design, and the research behind it

The engine is a **knowledge-based** recommender: explicit rules and graded
evidence decide what is shown, not other users' behavior. The JMIR 2021
systematic review of 73 health recommender systems found knowledge-based
approaches dominate health (67%) because they work without usage history and
can be audited, while collaborative filtering is rare
(https://pmc.ncbi.nlm.nih.gov/articles/PMC8278303/). The same review found only
about 10% of systems explain their recommendations; ayna explains every one
("Why this matches"), in her own words where she typed them.

Order of operations for every product and every need she chose:

1. **Safety first** (`score.js evaluateSafety`). Allergies, medicines
   (interaction table, `medications.js`), pregnancy, breastfeeding, age
   limits and contraindicated life stages exclude or hold back a product
   before any score exists. Unknown safety is never treated as safe.
2. **Relevance** (`productProfile.js`). Pattern rules link products to needs;
   sourced research rows (`data/matching/needMap.research.*`) override them in
   both directions. Every research row cites a .gov, .edu, medical-society
   .org or PubMed/PMC source (`data/sourcePolicy.js`, enforced by tests).
3. **Evidence grade** (`v2.js evidenceGrade`, GRADE-style A/B/C). For
   products that make a health claim, need fit is scaled by the grade;
   products judged on fit (pads, cups, apps, tests) are not.
4. **Context** (life stage, conditions) can unlock or boost a product only
   when she stated it. Age never infers a stage, a symptom never infers a
   diagnosis (`ontology.js NEED_POLICY`).
5. **Confidence** is reported separately from the match and never changes the
   percent: missing or conflicting answers lower confidence and are named.

## What changed on 2026-10-21

- **Age x life stage rules** now cite their sources (OWH, NICHD, MedlinePlus,
  The Menopause Society, NHS, ASRM 2025). Premature (<40) and early (40-44)
  menopause are recognized situations, not "unusual". Conflicting stage pairs
  keep the context that fits either reading (menopause + regular periods =
  menopause transition) so matches no longer empty out.
- **Every product-to-need link was graded** (294 links, primary / secondary /
  none, each with a credible source). 74 wrong links were removed, including
  high-absorbency tampons for light periods (FDA: use the lowest absorbency
  needed, toxic shock risk) and a retinoid-containing product for prenatal.
- **Vocabulary** (`matching/lexicon.js`): about 300 symptom terms, 70
  diagnosis names and 50 allergy names feed every search bar and the quiz.
  One term can name several needs ("itchy discharge"), which makes matches
  more specific. Red-flag terms raise a care note.
- **Everything she types is read**: every "Something else / Other" box, the
  closing note and stop reasons feed needs (all of them, negation-aware),
  allergies, ingredients to avoid, values, first-person diagnoses and
  medicines. Guesses ("maybe PCOS?") and past use are ignored.
- **Sources**: no .com science or clinical source remains; journal papers are
  linked through PubMed/PMC (each id confirmed with NCBI E-utilities).

## Checks that guard it

- `src/data/sourcePolicy.test.js`: no non-credible science source anywhere.
- `src/matching/lexicon.test.js`: every vocabulary term maps to real ids and
  resolves to exactly its mapping; typed text is read everywhere.
- `src/matching/researchLinks.test.js`: sourced "none" rows remove links.
- `src/matching/ageStageSources.test.js`: every age/stage rule is sourced.
- `scripts/stress-engine.mjs`: 300 generated personas through both engines;
  checks for unsafe picks, irrelevant picks, crashes and missing shelves.
- `.github/workflows/site-link-audit.yml`: every link on the site and in the
  app, plus every page rendered in a real browser, weekly.

## Known gaps (for the team)

- Some needs have few or no catalog products (see the catalog gap review);
  when nothing safe fits, she sees care resources instead of a weak pick.
- Real-user evaluation: the review recommends testing with real users, not
  only offline. ayna's focus groups and `recommendation_viewed` analytics are
  the place to measure whether picks are used and kept.
- Research rows are an evidence review, not a clinician sign-off; a
  clinician review layer (`NEED_MAP_REVIEWED` in `v2.js`) is ready for it.
