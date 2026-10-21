# ayna landing: locked brand system

Historical. `src/styles/landing-v2.css` was never imported and was removed in the CSS consolidation (Oct 21); the live system is `docs/design-direction.md` with tokens in `src/index.css` and `src/styles/web-system.css (ayna-system section)`. `src/components/LandingV2.jsx` uses `editorial.css`. Palette rule: lilac and mint are not used.

## Color (60-30-10, WCAG AA checked)
Researched rule: one dominant color (60%), one secondary (30%), one scarce accent (10%); accent only on key actions; text 4.5:1, large text and UI 3:1.
| Share | Token | Hex | Where | Contrast with ink |
|---|---|---|---|---|
| 60% | paper | #fffcf5 | page background | 16.6:1 |
| 30% | pink | #f7badd | Shop-by-need band, start card, founders stripes, number badges | 10.6:1 |
| 10% | butter | #f7e78e | CTA, tags, "ayna favorite" badge, even-numbered badges, hero script word | 13.6:1 |
| text/lines | ink #161616, ink-2 #4a4a4a | | all text, 2px borders, sticker shadow | ink-2 is 8.7:1 on paper |
| support | pink-soft #fde3ef, white | | active states, product tiles, counter panel | 14.1:1 |
| chrome only | sky #c9ecff | | window bars, hero chrome headline word | 13.7:1 |
Lilac and mint are NOT used on the landing (they stay as category tones inside the app).

## Type
Two families. Display: Fraunces 700 (italic 700 for the accent word). UI/body: DM Sans 400/500/600/700.
Scale: hero clamp(44,2rem+4.2vw,80) / display clamp(36,1.4rem+3vw,64) / h2 clamp(28,1.2rem+1.2vw,40) / h3 20 / lead 18 / body 16 / small 14 / label 13 (uppercase, +0.1em).
Line height: display 1.0 to 1.1, body 1.4 to 1.5. Headlines sentence case.

## Shape, border, shadow, motion
Radius: 8 / 16 / 24 / pill. Border: 2px ink only. Shadow: one hard sticker shadow `4px 4px 0 ink`.
Motion: 150ms fast, 250ms med, 400ms slow. Pressed = scale .98. Focus = 3px ink outline, 3px offset. Reduced motion disables all continuous movement.

## Spacing and layout
Scale 4 8 12 16 24 32 48 64 96. Sections 96px desktop / 64px mobile. Edges: 16 mobile, 32 tablet, 48 small desktop, 64+ (content max 1280) wide desktop; every block starts and ends on the same lines. Touch targets 44px minimum.

## Photos
Her photographs only, vintage filter + grain, no photo used twice on the page. Product images are cutouts on plain page/pink (no color boxes behind products).

## Update (Oct 14)
Page color is now soft teal #c2efe3 (header and footer included, landing only). Ink is near-black #161616 (was indigo). Pink, butter and ink unchanged otherwise. Teal replaces cream as the 60 percent.

## Palette v3 (Oct 14, late)
Butter page #ffedac (header and footer too), espresso #3e2723 for ink and the dark band, sky #769ebe and pink #f7badd as accents, light vintage grain over the page. Fonts: DM Serif Display headings, Archivo Black for small labels, DM Sans body. Source: Rise Marketing Studio palette post Ameera shared.
