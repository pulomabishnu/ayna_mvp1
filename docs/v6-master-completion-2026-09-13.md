# Ayna V6 master prompt completion

Date: 2026-09-13
Branch: `ameera/v6-real-site-current`
Production: unchanged. PR #18 remains draft.

## Completed implementation

### Part 1: color, contrast, outlines, responsive sweep
The source-level audit is in `docs/v6-color-responsive-audit-2026-09-13.md`. The final theme layer uses explicit light and dark values rather than route-dependent inherited colors.

Key post-fix WCAG checks:

| Pair | Use | Ratio | Result |
|---|---|---:|---|
| `#373238` on `#cfc7cb` | light header/nav | 7.57:1 | AA pass |
| `#50484e` on `#d8cfd2` | light muted copy | 5.79:1 | AA pass |
| `#50484e` on `#cfc5cb` | light placeholders/input secondary text | 5.26:1 | AA pass |
| `#e8e0d7` on `#2f3042` | dark header/nav | 9.91:1 | AA pass |
| `#c7bbc3` on `#3e3947` | dark muted copy/placeholders | 6.02:1 | AA pass |
| `#373238` on `#b7adb3` | light disabled Continue | 5.75:1 | AA pass |
| `#e8e0d7` on `#685f68` | dark disabled Continue | 4.69:1 | AA pass |
| `#635a60` on `#d8cfd2` | light functional outline | 4.36:1 | UI pass |
| `#aaa0a4` on `#3e3947` | dark functional outline | 4.40:1 | UI pass |

The film layer was deliberately kept below menus/dialogs (`grain` z-index 40, vignette 41, HUD 30) so the retro treatment never sits over critical UI chrome.

### Part 2: search-first support step
The support step now presents the exact heading `Which options best describe you right now?`, subcopy `Search, or tap an Ayna suggestion below.`, a single search field, life-stage-informed translucent sparkle suggestions, live search/custom add, and a circular `+` control at the end of the field. The `+` control expands the original complete category checklist on demand, so exhaustive browsing is preserved without showing the checklist by default.

### Part 3: compact signed-out sign-in treatment
The signed-out unlock prompt is now a slim secondary bar rather than a hero-sized modal. Desktop uses icon + short title/copy + compact actions on one row. Mobile reflows the actions below without introducing a tall content block.

### Part 4: rotating categories
The homepage category set rotates automatically, pauses on hover/focus interaction, and keeps a fixed layout footprint. A true `prefers-reduced-motion: reduce` mode now hides the changing set and renders one static `period care` control instead of continuing to swap text invisibly.

### Part 5: orange background accent
The warm terracotta/orange film-light accent is intentionally more visible while remaining separate from the text-bearing matte base. The darker text surfaces were retained so the accent does not lower body-copy contrast below AA.

### Part 6: Ask Ayna
The launcher remains an organic navy/plum/terracotta gradient blob. Signed-out users see the explicit lock and are routed into sign-in instead of chat. Inside the signed-in Ask Ayna panel, quick prompts now reuse the intake visual language: translucent `✦` suggestion bubbles. Selecting one submits that prompt through the existing real Ask Ayna composer/backend.

### Part 7: retro camcorder / indie-film layer
Implemented as additive V6 theme layers rather than replacing core product/auth/data logic: animated film grain, subtle vignette, off-black/off-white matte palette, desaturated product treatment without dark blend modes, DM Mono UI accents, REC/battery/timestamp HUD, low-fidelity borders, restrained chromatic hover edges, and reduced-motion fallbacks.

## Additional requested updates
- Product-card personalized score uses the circular match-ring treatment instead of a separate percentage badge.
- Signed-out product cards do not display personalized scores.
- Explore description stays on one desktop line and has a refresh control.
- Explore refresh reshuffles categories/products.
- The intake ends with the personalized attribution question `one last question, {name}` / `how did you hear about us?` before account creation, with TikTok, Instagram, LinkedIn, Google/search, friend/word of mouth, event/conference, brand/partner, Other, and Skip.
- Referral attribution is stored through the account handoff and synced to user metadata after authentication.

## Visual QA deliverable
`.github/workflows/v6-master-visual-audit.yml` runs a Puppeteer capture against production (`before`) and the V6 branch preview (`after`). It captures Home, the quiz support step, and the signed-out sign-in banner at 375px, 768px, and 1440px in both light and dark modes and uploads them as the `v6-master-visual-audit` GitHub Actions artifact.

## Known tradeoff
The retro effect is intentionally less aggressive over text-bearing surfaces than a literal VHS filter. Grain, vignette, chromatic offset, orange glow, and image desaturation are strongest in atmospheric/decorative areas. Text surfaces keep the higher-contrast matte colors listed above so the indie-film look does not regress accessibility.
