# PR88 final landing and conversion audit

The approved rain hero and the native app visual system remain unchanged. This pass fixes the lower landing and verifies the requested PR88 behaviors.

## Research and decisions

- [NN/g homepage design principles](https://www.nngroup.com/articles/homepage-design-principles/): communicate purpose, show concrete examples, make the next action clear, and keep the page simple. The existing real product and editorial photos remain. The page ends with the founders, one free-start invitation, and a compact footer. The DOM order now matches the visual order; it is no longer rearranged with CSS order.
- [Apple subscription guidance](https://developer.apple.com/app-store/subscriptions/): contextual upgrade prompts and understandable subscription details. The Health Data doorway remains gated, the profile upgrade entry is explicit, and renewal prices are visible next to the landing offer. Existing connections remain manageable after Pro expires.
- [NN/g visual hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/): use relative scale and grouping to prioritize actions. The final invitation has a single action with a short free-start reassurance; the optional Pro offer precedes the founders rather than interrupting the final free-start sequence.
- [NN/g search and navigation](https://www.nngroup.com/articles/search-and-you-may-find/): support search alongside navigation. Existing Settings search and its keyword synonyms stay; results use ordinary keyboard-accessible buttons rather than an incomplete ARIA listbox pattern.
- [W3C contrast guidance](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html): inspect actual adjacent rendered colors. Removed the inherited espresso Band class that overrode the pink closing background. Closing text is espresso on pink; footer legal copy is brighter and larger. This is not a whole-site accessibility certification.

These are design hypotheses supported by usability guidance, not measured conversion lift. No invented testimonials, urgency or outcome statistics were added.

## Verification

- 337 test files pass: 3,351 tests passed, 4 skipped.
- Production build succeeds: 299 prerendered pages and 404.
- Changed component lint: zero errors, two existing dependency warnings in LandingV2.
- Browser: closing CTA opens the first free quiz question. Inspected desktop and 390px mobile; corrected the mobile method grid and clipped Community action. No document horizontal overflow at 390px.
- Reviewed existing playlist owner edit controls (title, description, visibility), contextual Ask suggestions and persistent toggle, Settings search, profile Pro entry and Health Data gate. Live signed-in account mutations and purchases were not performed.
- Updated stale tests to reflect persistent suggestion preferences, hidden WHOOP availability, and gated article/health surfaces. Article content tests explicitly isolate the access gate; separate gate tests retain access checks.

## Release dependency

Production public assets point to Supabase project `mvvwgyspcohqxxcqkfrv`. The connected Supabase account lists only `pnliaqytgahrcerjpwvo` and denies migration-history access to the production project. No migrations were applied to either project. Do not merge/release until production history and prerequisites are verified and required migrations are applied:

- 20261027160000_ecosystem_update_monthly.sql
- 20261027213000_suggestions_integration.sql
- 20261028005500_pro_quiz_monthly_retakes.sql

Vercel target: `ayna_mvp1`, project `prj_3WQoSNEf3azcW0knmbUEeXNSkZB5`, team `team_rNoCxByzY0shUM1iJEjC10Us`. Production domain: aynahealth.co. Preview branch: web-next.
