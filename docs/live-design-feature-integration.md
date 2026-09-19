# Live design with redesign features

The visual baseline is the current aynahealth.co design, using the repository's existing `index.css` and `finalAynaPolish.css`. `LiveSiteLanding.jsx` restores the production landing component from 937f853, with hover/focus pause and reduced-motion support for rotating searches. `AynaLanding.jsx` retains personalized product selection and refreshable care categories below the live shop.

`v6Features.js` loads feature-specific styles extracted from the previous V6 layers, followed by live-palette adaptations. Retired Canva, film, and whole-page V6 skins are no longer loaded. The original feature scripts still run: intake introduction and support search, referral/account handoff, account settings, catalog typeahead and product submissions, signed-out locks, Ask Ayna suggestions, and ecosystem controls. Authentication, storage, recommendations, analytics consent, and API implementations are unchanged.

The default appearance follows the live cream site with its purple/orange hero. Existing explicitly saved appearance preferences are respected, with contrast corrections for dark product pages and feature controls.

Validation:
- Production build passes; existing chunk-size and mixed-import warnings remain.
- The two landing components pass targeted ESLint checks.
- 29 existing ecosystem, ecosystem-storage, and natural-language-search tests pass.
- Browser checks cover live-style landing, category rotation, catalog suggestions, product navigation, intake introduction, optional-step navigation, support suggestions and full-category expansion, care-category refresh, and mobile layouts.
- Phone checks show no horizontal overflow; the signed-out personalization section remains compact. Dark product title and body controls render cream on navy.
- Signed-in remote persistence and server-backed recommendation generation were not exercised locally; the local preview has no backend credentials. Existing implementation is retained.

Scope: redesign branch only. Main, production, and PR merge status are unchanged.
