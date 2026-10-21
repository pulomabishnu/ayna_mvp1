# ayna design direction (website + app)

The one source of truth for how ayna looks. Read with `docs/design-rules.md`
(colours, sentence case, no em dashes) and `docs/copy-and-seo.md` (wording).
Built from: the founder's references (Glossier and Tower 28 product pages,
bdy emails, Intelly dashboard, course and pilates boards, Luxix email),
the Website Design Master Prompt (Oct 2026), the Figma Design Handbook notes,
Apple Health (utility density, grouped lists, plain language for data) and
Spotify (titled shelves of square-image cards, hierarchy by weight not boxes).

## Visual thesis

ayna feels like the bathroom shelf of a friend who reads the research:
warm butter paper, espresso ink, real products on clean white tiles, and
evidence you can read at a glance. Expressed through three signature devices,
used often but never on every block:

1. **The shelf tile.** Every product photo sits on a white rounded tile with a
   thin espresso outline. This is the one place white appears.
2. **The evidence meter.** Limited / Some / Strong, three bars. It appears
   wherever evidence is summarised (product page, cards on hover/detail,
   Library reads).
3. **The scallop edge.** The wavy edge marks a change of mode (into a dark or
   pink band). At most twice per page.

Not: a SaaS template, a pastel wellness template, everything-in-a-rounded-box,
pills everywhere, one-word italic accents, stickers on every section.

## Personality (founder, Oct 20: "where did all the colour and style go")

The redo went too quiet. ayna is playful and bold, like the founder's
Pinterest references (laha.com.au "hey Georgia" site: cream page, colour-block
sections, chunky display headings, scalloped dividers, image-led cards with a
coloured header strip, a sticker or two, a marquee ribbon; Glossier/Tower 28
for the product page; bdy emails for tabs). Readability still wins, but every
page must feel unmistakably ayna:

- **Colour-block sections.** Pages alternate full-bleed bands: butter → pink
  `#f7badd` → espresso → sky `#769ebe`, joined by the scallop edge. Use 2-4
  bands per page; never two same-colour bands in a row.
- **Coloured card headers.** Service/feature/shelf cards can carry a solid
  colour strip or tab label (espresso, pink, sky) like the reference's
  "What's included" tabs.
- **Big expressive headings.** Display and H1 in DM Serif Display, large,
  tight; one hand-feel accent per page is allowed as a sticker/badge (e.g. the
  "Matched to you" seal), not as a one-word colour swap inside a heading.
- **Stickers and seals.** The round "Matched to you" seal and small badges may
  overlap a photo corner, max one per screen.
- **Ribbon.** One marquee ribbon (brands or a phrase) per page, on a pink or
  espresso band.
- **Photos.** Real lifestyle photos in rounded frames with a thin espresso
  outline; product photos on white tiles.
- Quiet utility surfaces (settings, forms, checkout-like flows, legal text)
  stay calm: personality lives on marketing pages, shelves, product headers,
  dashboard feature cards and empty states.

### Personality kit (Oct 21, built)

Website primitives live in `src/styles/web-system.css (ayna-system section)` ("PERSONALITY"),
decorations in `src/components/personality/Bits.jsx`; app equivalents in
`src/mobile/app-direction.css` ("Personality").

- `.ay-band` (+ `--pink | --sky | --espresso | --butter`, `--scallop`,
  `--scallop-bottom`, `--grid`, `--bleed`) sets the text tokens for AA:
  espresso on butter/pink/sky, butter on espresso. In brand dark the
  espresso band turns butter; the accent swap keeps band and scallop in step.
- `.ay-pagehead` turns a page header into a full-bleed band (Shop espresso,
  Library pink, Community sky). `EdPage tone=… frame=…` does the same for
  About (pink, stamp frame), How it works (sky, flower frame, seal), How we
  make money (espresso), Partners (pink). Legal and form pages stay calm.
- Paper pieces: `.ay-note` (tape, folded corner, tilt ≤ 2°, small text only),
  `.ay-polaroid`, `.ay-clip`, `.ay-folder` (stacked sheets, binder clip,
  pocket with a half-circle cutout), `.ay-stamp` (perforated edge),
  `.ay-flower` (four-petal frame), `.ay-envelope` (closing letter, wax seal).
- Badges: `Seal` (round "matched to you", once per page), `.ay-oval`
  (oval outline sticker with an asterisk), `.ay-toggle-pill` ("ON" motif),
  `Sticker` (line icon in a circle on a card corner).
- `.ay-tabcard` coloured header strips for cards that present steps,
  principles or features; `.ay-checker` strip divider; `Ribbon` marquee
  (one per page); `.ay-pinstripe` only behind photos, never body text.
- Shared dialogs: `.ay-sheet` (centred card on desktop, bottom sheet on
  phones, pink header strip), `.ay-field` / `.ay-field-label`, `.ay-stars`.
- Headings: one family token. Website `--ay-heading` (index.css), app
  `--ay-app-heading` (app-direction.css). Nothing else names the family.

Homepage order follows AIDA: hero + seal, brand ribbon, picks, "ayna is for
you if…" (the quiz's six common needs as notes on sky), why, shop band
(espresso, pinstriped photo strip, checker edge), step cards, evidence (oval
badge), reads, community on pink (polaroid, posts as notes), founders in a
folder pocket, invest, closing letter on sky.

## Surfaces (this settles "boxes vs no boxes")

The founder wants information grouped so it's easy to read. The master prompt
forbids giant rounded panels around every section and cards inside cards.
Both are satisfied by four surface types, and nothing else:

| Surface | Look | Use for |
| --- | --- | --- |
| Page | butter `#ffedac` | the background |
| **Group** | slightly deeper butter `#f6e3a1` (dark: `#4a312c`), radius 20, **no border**, no shadow | a set of related facts (At a glance, a settings group, a dashboard summary). Inside: rows divided by 1px `rgba(62,39,35,.15)` hairlines, never more boxes |
| **Object card** | 1.5px espresso border, radius 16, page colour, product photo on a white tile | discrete repeated things: products, sources/studies, posts, reads, playlists |
| **Feature** | espresso `#3e2723` with butter text, radius 24 | the single most important block on a screen (max one per screen) |

Pink `#f7badd` fills only: safety/alerts and the selected state of a chip.
Sky `#769ebe`: charts and data, links-as-accent, never a section background
except the one designated band on the homepage.

Shadows: only the 3px espresso offset on primary buttons. Nothing else.

## Type (founder, Oct 20: titles in the logo face)

Titles: `ayna Display` = Bricolage Grotesque (the logo face) pinned at 700 with its
optical-size axis, self-hosted in public/fonts (src/styles/fonts.css). Body/UI:
Figtree (warm, open; recommended Bricolage pairing per pimpmytype.com). The
logo itself stays Bricolage 800. Tokens: `--ay-heading` (site), `--ay-app-heading`
(app); body via `--ay-sans-stack`. Wherever this doc says Serif/Sans below,
read ayna Display/Figtree.

| Role | Desktop | Phone | Font |
| --- | --- | --- | --- |
| Display (home hero only) | 64 | 40 | Serif 400, lh 1.0 |
| Page title (H1) | 44 | 30 | Serif 400, lh 1.08 |
| Section (H2) | 30 | 24 | Serif 400, lh 1.15 |
| Sub-section (H3) | 22 | 20 | Serif 400 |
| Card title / row title | 17 | 16 | Sans 600 |
| Body | 17 | 16 | Sans 400, lh 1.55, max 68ch |
| Secondary / meta | 14 | 14 | Sans 500, espresso at 75% |
| Caption / legal | 13 | 12.5 | Sans 500 |

Display face never below 18px; tighten tracking to about -0.02em on titles. Body weights 400/500/600. Prices and numbers use
tabular figures. Left-align everything except short centred statements on
the homepage.

## Spacing and grid

Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.

- Container 1240px max; page margins 64px (≥1280), 40px (1024), 24px (tablet), 20px (phone).
- 12 columns desktop / 4 phone, gutter 24 desktop / 16 phone.
- Between sections: 80 desktop, 48 phone. Between groups inside a section: 32 / 24.
  Heading to its content: 16 / 12. Inside a Group or card: 24 / 16. Between rows: 12.
- Reading column for prose: 680px.
- Proximity first: things that belong together are closer than things that don't.

## Components

- **Buttons:** primary espresso fill + 3px offset shadow, 52px; secondary 1.5px
  espresso outline, 48px; text link with underline. Pressed: shadow to 0, 1px down.
- **Tabs (parallel views):** underline tabs, not pills. Selected: espresso text
  600 + 3px espresso underline. Scroll sideways on phones with an edge fade.
- **Chips (filters only):** 36px, outline; selected = pink fill + check icon.
- **Product card (one anatomy everywhere):** white tile (square, photo contained,
  16px padding) → brand 13/500 → name 16/600, 2 lines → price 14/600 tabular →
  at most one badge. Heart 36px top-right on the tile. No offset shadow.
- **Source card:** publisher 13/500 → title 16/600 → one-sentence finding 15/400
  → "Read the source ↗". Type tag ("Review", "Trial", "Guideline") as text, not pill.
- **Rows inside a Group:** icon 20px (line, no container) → label 13/500 →
  value 16/600 → optional note 14/400.
- **Shelf (Spotify pattern):** H2 + count + "See all" on one line; horizontal
  snap row of product cards, ~2.3 visible on phone, 4–5 on desktop.

## Page patterns

**Product page.** Desktop: gallery left (5 cols, sticky), buy column right
(7 cols): brand, name (H1), one-line summary, price + notes, variant, Buy +
Save, safety alert (pink) if any, commission line. No box around the buy
column. Then a 2-column band: **ayna's summary** as prose in the reading
column (left, 7 cols) and **At a glance** as one Group (right, 5 cols: evidence
meter + rows). Phone: summary then At a glance stacked. Then underline tabs
(Clinical opinion, Scientific literature, Reviews, Safety, How to use, Details)
over the panel, panel content directly on the page: takeaway sentence (17/600),
then source cards in a grid (desktop) or shelf (phone), then "See all".
Then Compare, Ask, You may also like as shelves/sections. Sticky buy bar
appears only after the in-page Buy scrolls away.

**Shop / collection.** Title + one-line commission note, search, filter chips
row, toolbar (Filters, sort, result count) then a 4-col (desktop) / 2-col
(phone) grid of product cards. Applied filters shown as removable chips.

**Ecosystem.** Header with stats, Products | Dashboard underline tabs. Products:
shelves per need (Spotify). Dashboard: same as app dashboard.

**Library.** Title, topic chips, a featured read (Feature surface, one), then
a grid of read cards (image, title, one-line, evidence meter if graded).
**Read page:** reading column, author/reviewed line, sources at the end as
source cards.

**Community.** Feed of post cards (object cards, author row, text, product
chip, actions: Helpful, Reply, Save). Composer at top as a Group. Topics as
chips. No marketing styling on posts.

**You / profile.** Header (avatar, name, @handle, counts, health profile
bar), then Groups: This week, Recently (shelf), Playlists (grid), then a
settings-style list Group.

**Settings (app and web).** Apple inset grouped lists: Group surfaces holding
rows (icon, label, value/chevron), section labels above groups (14/600),
32px between groups. No cards, no pills.

**Dashboard (app + web).** Utility density (Apple Health): greeting line,
Ask ayna about your week (Group with question rows), cycle Feature (the one
dark block), phase strip in a Group, metric tiles in a 2-col grid of Groups
(28px number, 13px label, sparkline), For this phase shelf.

**Footer pages (About, How it works, How we make money, Contact, Privacy,
Terms, Consumer health data, Campus resources).** Editorial: H1, intro in
reading column, sections with H2s, a sticky table of contents on desktop for
long legal pages, no boxes around prose. Contact: form in one Group.

**Homepage.** What → why → how → proof → action. Hero (display + search +
See my matches), brand marquee once, This week's picks (shelf), How it works
(4 steps: these ARE a sequence, numbers allowed), evidence explainer, reads
shelf, community band, invest section, final CTA. Vary composition; no
repeated eyebrow+title+3 cards.

## App specifics

Same tokens, Apple-utility density: body 16, row titles 16/600, section
titles 22 serif, screen titles 28 serif. Inset grouped lists for settings and
profile lists. Tab bar: 5 equal columns, 24px icons, 11.5px labels, selected
= pink pill behind the icon. Sheets for filters. Safe areas everywhere.

## Finish: grainy, retro, matte (founder, Oct 21)

"Kinda grainy and retro, use a grain filter over it, and it should be matte."

- **Grain.** One film-grain layer over the whole site and app: a pre-rendered
  160px noise tile (`public/images/ayna-grain-light.png`, espresso specks;
  `ayna-grain-dark.png`, butter specks), about 10KB each, tiled on one fixed,
  `pointer-events: none` pseudo-element (`src/styles/global-finish.css (finish section)` for the web,
  `src/mobile/app-motion.css` for the app). Tune it with `--grain-opacity` and
  `--grain-opacity-dark`. Why a bitmap: it is decoded once and composited; an
  SVG `feTurbulence` background is re-rasterised on zoom, animated grain costs
  battery, and `mix-blend-mode` on a fixed full-screen layer makes the browser
  blend the whole viewport on every scroll frame (worst on older iPhones and
  low-end Android). Never animated. Off for print and under
  `prefers-reduced-transparency`.
- **Matte.** Flat ink fills, no glossy gradients, no glass. Backdrop blur only
  on the site header and the app tab bar; sheets and dialogs dim the page with
  a flat 40% espresso scrim (`--sheet-dim`) instead.
- **Elevation.** No soft grey drop shadows and no glows. Raised or tappable
  things get the outline plus the hard offset shadow (`3px 3px 0` espresso);
  nothing else casts a shadow.
- **Dark mode** stays warm espresso tints, never `#000`, and never neon.
- **Selection** is ayna pink with espresso text in both themes.

## Motion (anti-vibe guide, section 4)

Tokens live in `src/styles/global-finish.css (motion section)` (web and app) and `src/mobile/app-base.css (tokens section)`:
`--ease-out`, `--ease-in-out`, `--ease-exit`, `--ease-pop` (delight only, max
overshoot 1.2), `--t-press` 110ms, `--t-fast` 160ms, `--t-base` 240ms,
`--t-sheet` 360ms, `--t-push` 320ms, `--t-delight` 520ms, `--stagger` 45ms.
No file defines its own cubic-bezier. One moving loop per screen at most (the
brand ribbon on the home page, which pauses on hover, focus, offscreen, the
footer's Pause motion and reduced motion). Body text, prices, evidence and
safety never move.

## Checks before anything ships

Blur, grayscale, no-decoration, real-content (longest name, no image, zero
reviews), 320/390/430/768/1024/1280/1440, dark mode, 200% zoom, keyboard,
and the removal test from the master prompt. Screenshots must be taken with
the real DM fonts loaded (the sandbox can't reach Google Fonts; inline them
from @fontsource).
