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

## Type (DM Serif Display + DM Sans; Bricolage only in the logo)

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

Serif never below 20px. Weights 400/500/600 only. Prices and numbers use
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

## Checks before anything ships

Blur, grayscale, no-decoration, real-content (longest name, no image, zero
reviews), 320/390/430/768/1024/1280/1440, dark mode, 200% zoom, keyboard,
and the removal test from the master prompt. Screenshots must be taken with
the real DM fonts loaded (the sandbox can't reach Google Fonts; inline them
from @fontsource).
