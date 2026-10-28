# Navigation and landing review — October 27, 2026

This refines PR #88 (`web-next`), not production. It uses the supplied Nectar, Oh Laura, pastel stationery and Chaotic Consultant references for clear hierarchy, paper-like blocks, real photography and restrained playful details. It retains Ayna's espresso, butter and pink palette, typefaces, hero rain, brand strip, product-card artwork and Shop layout.

## Implemented

- Desktop top navigation: Home → Shop → Services → Library → Community. Home is distinct; other tabs use regular-weight text, and the current secondary page is underlined. Mobile keeps its centre Home tab. Signed-out Home links directly to `/`.
- Page sequence: hero → needs/products → method → Pro → Reads/Community → founders → closing action. No repeated stats or decorative feature tiles.
- Four common needs form a quiet text index. Existing catalog-backed ProductCards retain their artwork and proportions.
- The method is one photograph and three concise steps; native disclosure controls reveal explanations without a new page.
- Pro is visible after the method. Prices reuse `src/pro/plans.js`, with the amount due today, regular renewal, cancellation and January 2027 paid-term start visible. A disclosure explains what stays free.
- Sleep routine's “How and when” now gives a concrete wind-down sequence: quiet activity/relaxation, light control with an optional eye mask, and a consistent schedule. It preserves clinical eligibility and supplement safety checks.
- Wrapped's generic invitation is labeled “Invite a friend,” with a plain explanation that personal results are not shared. The existing link intentionally opens the public invitation/homepage.
- Corrected the homepage PCOS title typo.

## Meeting items already present in the design branch

- Playlist owners can open Edit, change public/friends/private visibility, save, and delete. See `CommunityScreen.jsx` and `PlaylistAudiencePicker.jsx`.
- Pro has a sign-in handoff and resumes the selected feature/plan. See `ProPaywallHost.jsx`, `SubscriptionPaywallModal.jsx`, and `public/pro-pay.js`.
- Free access includes one Read per week and one playlist; Pro unlocks additional access. Dashboard, wearable and app linking remain gated.
- The full-width Shop, product images and catalog entries (including the gummies discussed) are retained.

## Inputs or separate work still required

- The notes contain no actual product-addition list or catalog-sheet link. No products, prices, images or claims have been invented or changed.
- Missing service artwork needs the specific catalog records and approved assets; existing real artwork has been preserved.
- The notes do not provide a reproducible shared Community-post link for the Wrapped redirect observation. The generic Wrapped invitation is now accurately labeled; public sharing of a person's private health results has not been added.
- Investor preparation, outreach and Notion feedback uploads are outside this website PR. No external messages or document transfers were made.
- PR #88 already calls out two database migrations before its broader release; this refinement adds no migration and does not run those on production.

## Research applied

- [NN/G: Homepage Design](https://www.nngroup.com/articles/homepage-design-principles/): an explicit Home link, useful examples and clear primary tasks.
- [NN/G: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/): keep essential information visible and defer secondary explanations behind predictable labels.
- [NN/G: Aesthetic and Minimalist Design](https://www.nngroup.com/articles/aesthetic-minimalist-design/): preserve brand identity while removing competing information.
- [NHLBI: Healthy Sleep Habits](https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits) and [CDC: Sleep Environment](https://www.cdc.gov/niosh/work-hour-training-for-nurses/longhours/mod6/02.html): source the practical sleep steps. Existing MedlinePlus links remain available in the routine.

## Validation

Full suite: 3,347 passed, 4 skipped, 337 test files passed. Production build passes. Focused lint has zero errors and two existing memo-dependency warnings in LandingV2. Desktop and 390px browser reviews cover navigation, product layout, the method disclosure and membership transition. A Vite-only `/pro` miss reflects the existing Vercel rewrite to `/pro.html`; the hosted preview is checked separately. Paid checkout and private-account changes are not exercised against live accounts.
