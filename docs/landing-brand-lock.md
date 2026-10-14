# ayna landing: locked brand system

Source of truth: the `BRAND LOCK` block at the end of `src/styles/landing.css` (tokens on `.app-container .lx`).

## Color (WCAG AA checked)
| Token | Hex | Role | Contrast with ink |
|---|---|---|---|
| ink | #1d1a2b | text, borders, shadows | n/a |
| ink-2 | #4a4668 | secondary text (solid, never faint) | 8.7:1 on paper |
| paper | #fffcf5 | page background | 16.6:1 |
| pink | #f7badd | LEAD brand color: band, stickers, start card | 10.6:1 |
| butter | #f7e78e | highlight only (CTA, counter panel, rank 1) | 13.6:1 |
| peri | #b9c2f4 | support: founders stripes | 9.8:1 |
| mint | #bdebd6 | support: small accents | 13.0:1 |
| pink-soft | #fde3ef | Shop-by-need band (lets product cutouts melt in) | 14.1:1 |
| sky | #c9ecff | window chrome only (.exe bars, hero chrome text) | 13.7:1 |
Rule: pink leads, butter highlights, peri/mint support. No other hex values on the landing.

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
