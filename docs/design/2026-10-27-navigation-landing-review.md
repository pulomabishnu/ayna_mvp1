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

- Catalog additions are deferred at the user’s explicit request. No products, prices, images or claims have been invented or changed.
- Missing service artwork is also deferred at the user’s explicit request; existing real artwork has been preserved.
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

## Second pass: header personality and clearer conversion path

The header now borrows the stationery references more directly: pink paper, a scalloped lower edge, an outlined Home tab with a small house mark, and a tilted beta stamp. Secondary links remain quiet, labeled and keyboard accessible. The edge disappears with the header during scrolling and is omitted in focused quiz flows.

The hero now explains the actual offering before asking for action: products and care matched to the visitor's needs, with visible evidence and safety notes. The primary action says “Get my free matches”; the note underneath says a short quiz and no payment details. Existing search and browsing paths remain available. These are usability-informed changes, not a measured claim of conversion lift.

Research: [Baymard's homepage findings](https://baymard.com/research-articles/ecommerce-homepage-ux) support clear category, search and curated discovery paths. [NN/G's descriptive CTA research](https://www.nngroup.com/articles/get-started/) supports making the next step explicit rather than using a vague “Get started” button. No fabricated testimonials, conversion metrics, urgency or trust badges were added.

### Home and dashboard flow correction

Founder clarified that Home contains My ecosystem and Dashboard; the logo opens the public landing. Home now opens `/you/ecosystem` for guests and members. Guests without results see a short locked “Create your ecosystem” entry, with a free quiz action and returning-member sign in. Guest results remain previewable; the quiz finish opens the ecosystem rather than an empty guest dashboard. The reveal offers Pro after the results, with a separate free continuation.

Restored the accessible My ecosystem / Dashboard switch. Dashboard uses the existing server-checked Pro gate, including its expiry timer and focus refresh. The branded lock explains (1) download the iPhone beta through the existing TestFlight link, (2) get Pro and use the same account to connect wearables/apps. Cancellation keeps access through paid expiry; the existing gate test verifies relocking while the page stays open. No billing policies or live subscriptions were changed.

Added a contextual Create your ecosystem action after the method explanation, alongside existing hero, product-match, Pro and closing actions. Retained category browsing and search. Research: https://www.nngroup.com/articles/better-link-labels/ and https://baymard.com/research-articles/ecommerce-homepage-ux . No conversion lift is claimed before measurement.

Final validation: 41 targeted flow/paywall/navigation tests passed, including paid expiry; production build generated 299 pages. App.jsx lint still reports five pre-existing unused declarations and existing hook warnings; modified component lint adds no new errors. Full-suite follow-up is recorded in the PR once complete. Local preview cannot execute Vercel API routes; its Pro check therefore fails closed with a readable retry message. Hosted production billing was not exercised or changed.
