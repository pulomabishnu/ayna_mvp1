# ayna landing: locked brand system

Source of truth: the `BRAND LOCK` block at the end of `src/styles/landing.css` (tokens on `.app-container .lx`).

## Color (60-30-10, WCAG AA checked)
Researched rule: one dominant color (60%), one secondary (30%), one scarce accent (10%); accent only on key actions; text 4.5:1, large text and UI 3:1.
| Share | Token | Hex | Where | Contrast with ink |
|---|---|---|---|---|
| 60% | paper | #fffcf5 | page background | 16.6:1 |
| 30% | pink | #f7badd | Shop-by-need band, start card, founders stripes, number badges | 10.6:1 |
| 10% | butter | #f7e78e | CTA, tags, "ayna favorite" badge, even-numbered badges, hero script word | 13.6:1 |
| text/lines | ink #1d1a2b, ink-2 #4a4668 | | all text, 2px borders, sticker shadow | ink-2 is 8.7:1 on paper |
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
