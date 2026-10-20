# ayna design rules

Read this before building or changing any screen (app or website). Every
decision below is made once, here, so screens don't drift toward generic
"AI-built" defaults.

## Colour (only these)

| Role | Hex | Use |
| --- | --- | --- |
| Butter | `#ffedac` | Page background (light), text on espresso |
| Espresso | `#3e2723` | Text, primary buttons, one dark feature card per screen |
| Sky | `#769ebe` | Secondary accent: charts, one highlight per section |
| Pink | `#f7badd` | Warm accent: cycle, safety notes, the one card that matters most |

- White only behind product photos.
- One accent per section. A section is not a rainbow: pick sky or pink, not both, unless the colour encodes data (cycle phases, chart series).
- No gradients, glows, or coloured shadows.

## Type

- DM Serif Display, weight 400, for headings 22px and up only.
- DM Sans for everything else.
- Sentence case everywhere. No ALL CAPS labels, no tracked-out eyebrows.
- Hierarchy comes from size and weight, not from extra labels.

## Spacing (8 pt scale)

- Only 4, 8, 12, 16, 24, 32, 48. Inside a card: 16 or 18. Between cards: 12. Between sections: 32.
- Inner spacing is never larger than the spacing around the element.
- Respect the notch and home bar: `env(safe-area-inset-top/bottom)` on every header, sheet and fixed bar.
- Tap targets at least 44px.

## Shape and depth

- Radius: 22 to 26px for cards, 99px for pills and buttons. Not everything is a card.
- The espresso offset shadow (`3px 3px 0`) is a brand accent: at most one or two elements per screen, never on every card.
- No cards inside cards. Group with whitespace, hairlines and type instead.
- No coloured left borders or side tabs on blocks.

## Content

- Real data only. A card shows only when its data exists. Never invent numbers, quotes, reviews, prices or claims.
- Plain, specific words. No "unlock", "empower", "seamless", "transform".
- No em dashes in visible text.
- Status pills only when they carry a state the text doesn't already say.
- Icons: one line-icon set. No emoji as icons.

## Before shipping a screen

1. Check light and dark at 390px and 320px, with the notch simulated.
2. Run the squint test: does anything look like a template? Remove the default.
3. Check against this file: colours, caps, nested cards, shadows, spacing scale.

## Feel (what makes it hand-made, not generated)

- Show the real thing: real product photos, her real numbers, real names on reviews. No stock people, no placeholder copy.
- One specific line beats three generic ones. Cover the logo: if a sentence would work for a competitor, rewrite it.
- Break the symmetry once per screen: one bigger card, one off-grid element. Not three identical cards in a row.
- Few text sizes, each with one job: 34 (big number), 28 to 30 (screen title), 22 (section), 15 (body), 13 (label), 11.5 (caption).
- One obvious next step per screen; secondary actions stay quiet.
- Every tap answers instantly: pressed state, haptic on confirm (native), skeleton or optimistic update while loading.
- Animate only what explains a change (a sheet opening, a card expanding). No fade-up on every section.
- Selected states use fill or weight, never colour alone.
- Empty, loading and error states are designed, each with one clear action and a human sentence.
- Test with long names, long product titles, 320px, largest text size and dark mode before calling it done.

Sources: Fountain Institute, "7 Signs a UI Has Been Vibe Coded"; 21st.dev, "How to make your website not look AI generated"; codemyspec, "vibe-coded websites look the same"; vp0, "What makes an app look professional"; Kree8 app UX cheatsheet; Baymard Institute product page research.
