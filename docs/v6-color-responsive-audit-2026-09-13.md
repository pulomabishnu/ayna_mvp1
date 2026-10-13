# Ayna V6 color, theme, outline, and responsive audit

Date: 2026-09-13
Branch audited: `ameera/v6-real-site-current`
PR: #18, still draft / not merged to `main`

## Scope and method

This is a source-level audit of every routed surface registered by `src/v6WholeSite.js`: Home, Quiz, Ecosystem, Browse/Discovery, Profile, Privacy Policy, Terms, How We Make Money, How It Works, About, Contact, Health Library, Screenings, Appointment Prep, Tracked, Comparison, Recalls, Omitted Products, Startups, Text Ayna, Confirmed/Auth, and Product Detail. `/ecosystem` is auth-gated in the public preview, so its signed-in UI was audited from `src/components/MyEcosystem.jsx`, `src/components/EcosystemBubbles.jsx`, and the V6 CSS layers rather than relying on an anonymous browser session.

The app is React + Vite in this repository, not Next.js. The Vercel preview build runs `vite build`.

Contrast was calculated using WCAG relative luminance. Thresholds used: 4.5:1 for normal text, 3:1 for large text and visible UI component boundaries. For translucent colors, the audit uses the effective composited color against the visible parent surface where it can be determined from source.

The fixes are implemented in `src/v6SeptemberAudit.css`, `src/v6SeptemberAudit.js`, `src/v6ContrastPatch.css`, and `src/v6ContrastPatch.js`. These files are loaded after the older V6 layers so the fixes resolve the cascade at one source instead of creating one-off page patches.

---

## A. Light-mode contrast issues

### A1. Global muted-text token failed AA
- Location: `src/v6FilmAesthetic.css`, `--v6-film-muted`; also inline components that use `--color-text-muted`.
- Before: `#756d72` on matte paper `#dad4d2`.
- Contrast: **3.42:1**, FAIL for normal text.
- Root cause: the film pass desaturated the muted token without rechecking its luminance against the darker matte paper.
- Fix: `--color-text-muted`, `--v6-ws-muted`, and `--v6-film-muted` now resolve to `#50484e` in light mode.
- New contrast: `#50484e` on `#dad4d2` = **6.03:1**, PASS.

### A2. Whole-site muted token failed AA on lavender backgrounds
- Location: `src/v6WholeSite.css`, `--v6-ws-muted: #776c75`; affects secondary copy across Home, Browse, Profile, company/help pages, footer, and utility pages.
- Before: `#776c75` on `#e6dce7`.
- Contrast: **3.76:1**, FAIL.
- Fix: `#50484e`; typical current surface `#d3c9cf`.
- New contrast: **5.48:1**, PASS.

### A3. Browse metadata was just below AA
- Location: `src/v6WholeSite.css`, `.ayna-browse__heading span`, `.ayna-browse__subheading`, `.ayna-browse__meta`.
- Before: `#6d626a` on `#e6dce7`.
- Contrast: **4.37:1**, FAIL by a small margin.
- Fix: `#50484e`.
- New contrast on `#d3c9cf`: **5.48:1**, PASS.

### A4. Light input placeholder text was substantially too faint
- Location: `src/v6WholeSite.css` global `input::placeholder`, plus intake/search inputs.
- Before: `#7c7078` over the composited input surface, approximately `#cdc3c9`.
- Contrast: **2.75:1**, FAIL.
- Fix: placeholder `#50484e`; input surface `#cfc5cb`.
- New contrast: **5.26:1**, PASS.

### A5. Quiz section label failed AA
- Location: `src/v6Enhancements.css`, `.ayna-intake-section-label`.
- Before: `#9d624f` on the matte question/card surface near `#c5bbc1`.
- Contrast: **2.62:1**, FAIL.
- Fix: `#50484e` in light mode.
- New contrast: **4.73:1**, PASS.

### A6. Quiz required/hint label failed AA
- Location: `src/v6Enhancements.css`, `.ayna-intake-hint`.
- Before: `#995f4e` on `#c5bbc1`.
- Contrast: **2.74:1**, FAIL.
- Fix: `#50484e`.
- New contrast: **4.73:1**, PASS.

### A7. Quiz “Skip this step” was too faint
- Location: `src/v6Enhancements.css`, `.ayna-skip`.
- Before: `#786d74` on `#c5bbc1`.
- Contrast: **2.65:1**, FAIL.
- Fix: `#50484e`.
- New contrast: **4.73:1**, PASS.

### A8. Quiz timeline option labels failed AA
- Location: `src/v6Enhancements.css`, `.ayna-timeline button`.
- Before: `#6d626a` on `#c5bbc1`.
- Contrast: **3.12:1**, FAIL for normal-size labels.
- Fix: `#50484e`.
- New contrast: **4.73:1**, PASS.

### A9. Typeahead eyebrow/section label failed AA
- Location: `src/v6InteractionFixes.css`, `.v6-typeahead-label`.
- Before: `#966051` on the search dropdown surface around `#cfc6cc`.
- Contrast: **3.08:1**, FAIL.
- Fix: `#50484e`.
- New contrast: **5.30:1**, PASS.

### A10. Typeahead trailing metadata failed AA
- Location: `src/v6InteractionFixes.css`, `.v6-typeahead-row > em` and earlier secondary search text.
- Before: approximately `#776b73` on `#cfc6cc`.
- Contrast: **3.05:1**, FAIL.
- Fix: `#50484e` for normal metadata, while action text that is decorative is not relied on alone.
- New contrast: **5.30:1**, PASS.

### A11. Unselected circular/control outlines were below the 3:1 UI threshold
- Location: `src/v6Enhancements.css`, intake choice indicators, age buttons, pills, support categories; `src/v6WholeSite.css`, nav circles.
- Before: common border `rgba(78,60,82,.13)` over `#c5bbc1`, effective border around `#b6aab3`.
- Contrast against adjacent surface: **1.20:1**, FAIL for a visible control boundary.
- Fix: explicit `#635a60` for functional outlines.
- New contrast against `#c5bbc1`: **3.56:1**, PASS.

### A12. Disabled Continue became illegible because the entire button used opacity
- Location: `src/v6Enhancements.css`, `.ayna-continue.v6-unanswered, .ayna-continue:disabled { opacity:.34 }`.
- Before: the original `#fff` / `#554561` pair is strong, but after compositing the whole control at 34% over the card the effective pair is approximately `#d9d2d6` over `#9f93a0`.
- Effective contrast: **1.98:1**, FAIL.
- Root cause: lowering component opacity lowers text contrast too.
- Fix: no opacity reduction. Disabled light state now uses text `#373238` on `#b7adb3`.
- New contrast: **5.75:1**, PASS while still visually deprioritized.

### A13. Header looked pale because the cascade had multiple competing nav treatments
- Location: base nav styles in `src/index.css`, V6 overrides in `src/v6WholeSite.css`, then later film/theme layers.
- Source-level current text pair was not itself failing, but light and gradient variants inherited through multiple layers, making the visual state inconsistent during theme hydration and route changes.
- Fix: one final explicit light header pair loaded last: text/icons/logo `#373238`, bar `#cfc7cb`, border `#8b8086`.
- Text contrast: **7.57:1**, PASS.
- The logo, `beta`, My Ecosystem, Browse, wishlist/account icons, and mobile menu now use this explicit current color instead of depending on an earlier route variant.

---

## B. Dark-mode contrast issues

### B1. Dark input placeholder text failed AA
- Location: `src/v6WholeSite.css`, dark `input::placeholder` set to `rgba(255,248,242,.45)`.
- Effective placeholder: about `#9d979b` on effective input background `#4c4754`.
- Contrast: **3.14:1**, FAIL.
- Fix: placeholder `#c7bbc3` on `#3e3947`.
- New contrast: **6.02:1**, PASS.

### B2. Dark quiz Skip link inherited a light-mode muted color
- Location: `src/v6Enhancements.css`, `.v6-quiz-dark .ayna-skip { color:#6f626b }`.
- Against `#3e3947` dark control/card surface: **1.93:1**, FAIL.
- Fix: `#c7bbc3`.
- New contrast: **6.02:1**, PASS.

### B3. Dark quiz timeline labels retained light-mode `#6d626a`
- Location: `src/v6Enhancements.css`, `.ayna-timeline button`; not comprehensively flipped by the first dark film pass.
- Contrast on `#3e3947`: **1.92:1**, FAIL.
- Fix: `#c7bbc3` / selected `#e8e0d7`.
- New normal-label contrast: **6.02:1**, PASS.

### B4. Matte amber used as small dark-mode text was not AA-safe everywhere
- Location: film/UI accent token `#b78d61` when used for normal-size labels on `#3e3947`.
- Contrast: **3.72:1**, FAIL for normal text.
- Fix for text-bearing labels: `#d2c8c4`.
- New contrast: **6.80:1**, PASS. Amber remains available for decorative/non-text accents.

### B5. Muted copy failed at the terracotta end of the dark gradient
- Location: `src/v6FilmAesthetic.css` / whole-page dark gradients ending near `#785c53`.
- Before: muted `#c7bbc3` on `#785c53` = **3.28:1**, FAIL.
- Root cause: checking the midpoint navy/plum was not enough; the visible right/bottom gradient end was substantially lighter.
- Fix: dark matte base now ends at `#5f4844`, while a separate orange radial glow is made more prominent so the aesthetic stays warm without sacrificing text contrast.
- New contrast: `#c7bbc3` on `#5f4844` = **4.54:1**, PASS.

### B6. Dark-mode functional borders were too translucent to perceive
- Location: film/intake controls using `rgba(255,248,242,.105)` on `#3e3947`.
- Effective border around `#524d59`.
- Contrast against surface: **1.36:1**, FAIL the 3:1 component-boundary target.
- Fix: explicit `#9d9297` for interactive borders.
- New contrast on `#3e3947`: **3.72:1**, PASS.

### B7. Dark auth card was still visually a light card in the first film pass
- Location: `src/v6FilmAesthetic.css`, `.v6-auth-card` had a light `rgba(202,193,198,...)` gradient with no equally strong dark counterpart.
- This was primarily a light/dark consistency problem, but it also caused inherited dark-mode secondary text to become unpredictable.
- Fix: explicit dark auth card `#3e3947` → `#47404a`, border `#9d9297`, primary text `#e8e0d7`, muted text token `#c7bbc3`.
- Main text contrast on `#3e3947`: **8.55:1**, PASS.

### B8. Dark disabled controls had the same opacity problem as light mode
- Fix: no whole-button opacity. Dark disabled state is `#e8e0d7` on `#685f68`.
- Contrast: **4.69:1**, PASS.

---

## C. Light/dark consistency issues

### C1. Header/nav now has explicit per-theme surfaces
- Light: `#373238` on `#cfc7cb`, 7.57:1.
- Dark: `#e8e0d7` on `#2f3042`, 9.91:1.
- Root cause fixed: route-specific `.app-nav--landing` / `.app-nav--cream` styles no longer determine legibility.

### C2. Theme controls are now visibly different in both modes
- Location: `.v6-quiz-theme-toggle`, `.v6-settings-theme button`.
- Light: `#373238` on `#d1c7cc` = **7.61:1**.
- Dark: `#e8e0d7` on `#3e3947` = **8.55:1**.
- Active dark-setting button: `#2f3042` on `#baa17f` = **5.23:1**.
- Sun/moon glyph remains a real visible state indicator rather than relying on a subtle fill change alone.

### C3. Dark quiz previously mixed a dark page with light lavender control surfaces
- Location: `src/v6Enhancements.css` and early `src/v6FilmAesthetic.css` overrides.
- Affected: age card, scale, spectrum, product-history rows, smart-search line, skip/timeline labels.
- Fix: dark quiz controls consistently use the `#3e3947` / `#47404a` matte family, `#e8e0d7` main text, and `#c7bbc3` secondary text.

### C4. Search/typeahead now has matching theme variants
- Light uses matte gray-lilac surfaces with dark copy and explicit borders.
- Dark uses `#3e3947`-family surfaces with cream copy and `#9d9297` functional boundaries.
- `+ add` rows use the same intake/ecosystem row language in both modes rather than a bright pill in one theme and a different structure in the other.

### C5. Product imagery keeps the same film grade in both themes without darkening the actual package
- Location: `src/v6FilmAesthetic.css` image filter.
- Uses reduced saturation/contrast/very light sepia but no multiply blend that would destroy product photography.

### C6. Ask Ayna now has one consistent gradient-blob identity
- The launcher uses the V6 navy/plum/terracotta gradient in both modes rather than switching to a generic button.
- Signed-out state adds an explicit lock and “sign in” sublabel. Clicking it routes to the real sign-in flow instead of letting the user type a message that will fail later.

### C7. Auth/sign-in now has a real dark counterpart
- See B7. This closes the most obvious modal-level inconsistency.

### C8. Global matte/camcorder treatment is now theme-independent
- Animated grain, vignette, low-fi 1px borders, Jost/DM Mono UI typography, subtle chromatic hover edge, REC/battery/timestamp HUD all remain visible in both modes with theme-specific foreground opacity.
- The overlays are `pointer-events:none` and `aria-hidden`, so they do not block interaction or create screen-reader noise.

---

## D. Circle / badge / outline visibility issues

### D1. Quiz support bullseye badge edge was too weak
- Location: `HealthIntakeForm.jsx` `SectionIcon` + V6 CSS `.ayna-intake-icon`.
- Previous border effectively blended into its card.
- Fix light: circle fill `#c5bbc1`, 2px border `#635a60`, icon stroke `#4d454b`.
- Border-to-fill contrast: **3.56:1**, PASS.
- Fix dark: fill `#47404a`, 2px border `#aaa0a4`, icon `#e8e0d7`.
- Border-to-fill contrast: **3.94:1**, PASS.

### D2. Choice indicators / checkbox-style circles were too low-contrast when unselected
- Location: `.ayna-choice-indicator`, `.ayna-row-indicator`, `.ayna-timeline-dot`.
- Fix: explicit 1.5px `#635a60` light / `#aaa0a4` dark rather than low-opacity borders.
- Selected states use filled plum/cream contrast rather than border-only signaling.

### D3. Nav wishlist/account circles depended on faint inherited borders
- Fix: the same explicit outline tokens now apply to `.app-nav__circle`.

### D4. Ecosystem orbit/care bubbles needed an edge independent of the gradient behind them
- Location: V6 ecosystem bubble/orbit classes under `.v6-page-ecosystem`.
- Fix: functional bubble/circle boundaries use `#635a60` light and `#aaa0a4` dark. This avoids disappearing where the orbit crosses a similarly valued lavender/plum region.

### D5. Search `+` circles now match the same outline system
- Location: `.v6-typeahead-plus`, `.v6-support-custom-plus`, support suggestion star.
- Fix: no opacity-only edge; explicit 1.5px theme border.

---

## E. Responsive / spacing issues

### E1. Header had competing max-width/padding behavior around tablet widths
- Location: `src/v6WholeSite.css`, `.app-nav`.
- Previous: `max-width:1420px`, fixed `38px` padding, route variants, and separate mobile rules caused visible snapping around tablet/desktop transitions.
- Fix: full-width header with clamped padding; 20px at <=1100px, 16px at <=900px. Logo/tab sizes step down before the mobile drawer takes over.

### E2. Quiz card used fixed/min heights that created dead space or internal scrolling
- Location: `src/v6Enhancements.css`, `src/v6InteractionFixes.css`.
- Previous examples: `height:min(700px,calc(...))`, `min-height:500px`, later `height:min(590px,...)`.
- Fix: width `min(835px,100%)`, height `auto`, viewport-bounded `max-height`, no forced 500px+ dead zone. Mobile uses the same viewport-bound approach.

### E3. Support question was the largest avoidable scrolling problem
- Previous: two-column category list plus collapsible rows inside an already viewport-constrained quiz card.
- Fix: the category list is removed from the visible layout for this question. The user now gets one search field, personalized translucent suggestion bubbles based on their prior life-stage answer, an “ayna suggestions” star label, selected chips, and a `+` custom option in the dropdown.
- The underlying real `supportSelections` / conditional-question logic is still used; this is not a mock replacement.

### E4. Support suggestions could become too dense on small phones
- Fix: two-column bubbles under 768px; one-column under 480px; selected chips wrap.

### E5. Browse toolbar could overflow before mobile breakpoint
- Location: Browse V6 toolbar/controls.
- Fix: toolbar and controls now `flex-wrap`; at <=480px controls become two-per-row with `min-width:0`.

### E6. Home quick links could wrap unpredictably and were static
- Fix: they rotate through the full health-category set every ~3.4 seconds. Desktop stays inline; <=768px uses a 2-column grid. Hover pauses the rotation to avoid moving targets while the pointer is on them.

### E7. Signed-out unlock card was too long and visually blocked the cabinet
- Fix: max width 390px, smaller icon/heading/body/actions, shorter copy. It stays legible without occupying most of the personalized area.

### E8. Ecosystem first screen was not reliably full-viewport through the tablet range
- Location: `src/v6InteractionFixes.css`, `.v6-ecosystem-panel`, `.v6-eco-main`.
- Fix: first ecosystem panel remains `min-height:calc(100dvh - header)` and full width; desktop/two-column layout persists only while there is room, then switches to one column at 900px instead of waiting until 760px.

### E9. Ecosystem product/details column could become too narrow around 768–1000px
- Fix: desktop grid uses `minmax(0,1fr) minmax(280px,420px)`; <=1100px second column compresses to 250–340px; <=900px becomes a single centered column.

### E10. Camcorder HUD could collide with mobile chrome
- Fix: HUD inset/font reduce under 768px; battery percentage hides; corner crop marks hide under 480px. It never receives pointer events.

### E11. Global accidental horizontal scrolling
- Fix: `html, body, #root { width:100%; max-width:100%; overflow-x:clip; }`, while search dropdowns explicitly retain local overflow visibility.

---

## Requested UX changes included in this audit pass

1. **Support question is now search-first**. The category option wall is hidden. Ayna suggestions are generated from the answer to “Which options best describe you right now?”, shown as translucent clickable bubbles with a small star mark. Search still matches the complete support taxonomy. Unknown free-form support text gets a `+` row and is saved through the existing “Something else” path.
2. **Signed-out personalization prompt is shorter and smaller**.
3. **Home quick categories rotate** through the broader health taxonomy every few seconds instead of staying on Period care / PCOS / Vaginal health / Fertility forever.
4. **Orange/terracotta background light is more visible** via a stronger radial glow, while the dark base itself is darker for text contrast.
5. **Ask Ayna is a gradient V6 blob** and shows an explicit sign-in lock when signed out.
6. **Retro camcorder / indie-film treatment** includes animated film grain, matte/desaturated surfaces, Jost + DM Mono UI typography, REC indicator, battery, live timestamp, crop marks, soft vignette, low-fi borders, and subtle chromatic hover aberration.
7. **Reduced-motion is respected**: grain/REC animation is disabled when the OS requests reduced motion.

---

## Remaining non-blocking engineering notes

- The current Vercel build reports the pre-existing large main JavaScript chunk warning. It is a performance/code-splitting concern, not a color or responsive failure.
- `npm install` currently reports dependency audit findings in the preview build log. Those are separate package-security maintenance items and were not changed as part of this visual pass.
- A true device-matrix visual regression suite (Playwright screenshots at 375/768/1024/1440 in both themes, authenticated and anonymous) would be the next step to make these checks automatic rather than source-audit-only.
