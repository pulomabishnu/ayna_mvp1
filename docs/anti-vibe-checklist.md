# Anti vibe-coded checklist (founder, Oct 21)

Read before any design or copy change, on the website and the app. Sources: the
founder's research notes (r/vibecoding "I analysed 500 vibe coded websites",
r/VibeCodeDevs, r/antiai "how to spot vibecoded websites", r/webdev, r/SaaS,
thefountaininstitute.com/blog/signs-vibe-coded-ui, sinton.agency), plus
scratchpad ANTI_VIBE_GUIDE.md (81 sources). Do your own research too.

Core principle: the system first. Every spacing value, colour, radius, weight
and animation references a token (docs/design-direction.md). Inconsistency is
the biggest tell, more than any single element.

## Colour and visual
- No purple/indigo gradients, neon, glows, glowing hovers, glass/blur, glossy shine. ayna is matte, grainy, flat ink colours.
- No sparkles or emojis in headings, buttons, bullets or as icons. Real line icons, sized in proportion to the text next to them.
- No default letter-in-gradient-circle avatars: a designed default avatar.
- Real images (our lifestyle photos, product photos), not emoji or stock AI faces.

## Type
- One type scale (design-direction.md), used everywhere. No oversized heavy headings over thin body; body is Figtree 400, never under 300.
- One line-height and paragraph spacing per role. Even vertical rhythm.

## Layout and components
- The same component sits in the same place on every page (header, back link, page title, primary action, filters).
- Radius: 3 values only (small 10, card 16-20, pill 999). Group 20, feature 24 are the existing exceptions; don't add more.
- Hover: lift 2-4px max, or colour change; no big scale/glow. Pointer cursor ONLY on things that are clickable; nothing clickable-looking that isn't.
- No "box fatigue": don't put every fact in an identical card. Vary: prose, rows, one feature block, grids only for repeated objects.
- No subcopy that repeats the title in other words. Delete it.
- Long text pages (legal, about) must not be a narrow left column with an empty right half on desktop: use the reading column centred with a sticky table of contents, or a two-column layout.
- No non-functional social icons, dead links, empty tooltips, ghost cards with fake data, repeated KPIs on one screen.
- No unnecessary features. If a user doesn't need it, cut it.
- Default browser fonts never show (self-hosted fonts load first).

## Motion and interaction
- Every animation has a purpose and a cubic-bezier easing token; stagger intentionally (45ms, max 6 items). No infinite decorative loops.
- Every async action has a loading state; buttons show progress (spinner or "Saving…") and then a result.
- Skeleton screens for data-heavy sections (Shop grid, Ecosystem, dashboard, Community feed, product reviews).
- Toggles toggle, carousels slide (with swipe and buttons), tabs switch, with keyboard support.
- Works at every width: no overflow or overlap at 320-1440.

## Copy
- No em dashes. No vague hype ("Launch faster", "Build your dreams", "Create without limits", "unlock", "elevate", "seamless", "revolutionize", "delve", "robust", "foster", "journey", "empower", "curated", "tailored", "effortless").
- No hero formula "[Verb] your [noun] without [inconvenience]".
- Specific beats general: name the real problem ("Most pads list no ingredients. We show them.").
- Vary sentence length. Don't force every list into three items with matching length.
- No fake testimonials, no placeholder names ("Sarah Chen"), no invented reviews or numbers. Only real member content.

## Code and security
- No API keys, tokens or credentials in frontend code or committed files (only public anon keys meant for the browser, via env).
- No orphaned or unverified dependencies.
- Handle the unhappy path: empty, error, offline, slow, signed out, very long text, missing image.

## Security and reliability (founder, Oct 21; r/vibecoding "auditing vibecoded apps, the 8 checks")
1. No API response exposes other users' emails/IDs (check the Network tab while clicking around).
2. Ownership: user B can never read or change user A's data by changing an ID in a URL or request (Row Level Security on every table with user data, verified with two test users).
3. Payments/subscriptions: refunds, cancellations and failed payments remove access (ayna sells via retailers; check any paid feature, bag/orders adapters).
4. Offline mid-action: forms show a clear error and keep input; no white screen, no infinite spinner.
5. Secrets: none in frontend or committed files; any key ever pasted into a chat or transcript gets rotated by the founders.
6. Old/mid-range Android and older iPhones: no overflow, acceptable speed.
7. No duplicate background jobs (double emails, double onboarding, double inserts); idempotent handlers.
8. /admin and every admin API: nothing loads for logged-out users or normal users (server-side role check, not just hidden UI).
Plus: rate limits on every serverless API that costs money (Ask ayna / LLM calls, email, SMS).

## Shipping checklist additions (founder, Oct 21, "30 things" list)
- docs/design-direction.md is our DESIGN.md: colours, spacing, radius, type, motion all come from it.
- A real font pair (ayna Display + Figtree), one accent colour at a time per component, one icon set at one stroke width.
- Density, not empty white space: show more useful information per screen (less scrolling), grouped clearly. Air between groups, not inside them.
- One layout idea per page (one memorable composition), not five competing ones.
- Answer first: lead with the point, cut preamble and adverbs, write like a person (humanizer pass on every string).
- Real screenshots and photos, real testimonials only, privacy policy and terms linked and current.
- Compress hero and lifestyle images (AVIF/WebP, correct sizes/srcset, lazy below the fold); consider a short muted hero video only if it loads fast and has a still fallback.
- Polish pass before shipping: spacing, alignment, states, copy, a11y.

## Delight details (founder, Oct 21; decisions)
Adopted (calm, specific, consistent with the motion tokens):
- Presses: a quick `scale(.97)` that settles back on `--ease-pop` (max 1.2 overshoot). No linear fades.
- Loading text in ayna's voice, specific and calm: "Looking into it…", "Finding your matches…", "Checking the research…", "Saving to your ecosystem…". Never jokes on health, safety or error screens.
- Empty states: one sticker that settles once, one line that says what will appear, one action.
- Optimistic UI for save, like, add and toggles: update at once, roll back with a plain message if the server fails.
- Web: Cmd/Ctrl+K focuses the search (or opens the Shop search), with a small ⌘K hint in the field on devices with a keyboard; Esc closes sheets; a toast names the action ("Saved", "Added to your ecosystem").
- Sheets and expanding cards grow from what was tapped (FLIP / View Transitions where supported, else a fade). Bottom sheets have a grabber you can drag.
- Auto-focus the main input when a search, compose or Ask sheet opens, on phones only after the person tapped a text action (never on page load: no surprise keyboard).
- Relative times ("Just now", "2m ago", "Yesterday"), refreshed every minute.
- Toasts are named after the action, per the guide's naming rule.
- Native elastic overscroll in the app; `overscroll-behavior` only where it stops the page behind a sheet from scrolling.
- Phone and date inputs format as you type without moving the caret.
- Character-limit ring on text areas with limits; shows the count near the limit, espresso then pink, never cuts text.
- Destructive actions confirm in two steps ("Tap again to delete" for about 3 seconds, or an in-app confirm sheet). Never `window.confirm`.
- One shared skeleton shimmer timing; static under reduced motion.
- Time-of-day greeting from the local clock, plain ("Good morning, Ameera").
- Haptics in the app: light on save, selection on quiz answers, success on add and check-in, warning on errors.
- `::selection` in ayna pink with espresso text. Dark mode stays warm espresso, never `#000`.
- Elevation: outline + hard offset shadow for raised/tappable things, flat 40% espresso scrim for overlays.
- Grain: one static film-grain tile, subtle, never animated (see design-direction.md, Finish).

Skipped on purpose: glows and neon accents, looping or cursor-reactive backgrounds, cursor-following shine, animated border beams, tilting hover effects, magnetic buttons, monospace data labels, ASCII art, input shake on errors (use colour, icon and message), "come back" tab-title tricks, sound effects by default (if ever, an opt-in Sounds toggle, off by default; haptics cover feedback in the app).

Status on web/delight-finish (Oct 21): all adopted delight details are done on web and app. Earlier: press spring, loading copy ("Looking into it…"), empty-state sticker settle, Cmd/Ctrl+K with hint, bottom sheets with drag-to-dismiss and 40% scrim, haptics, time-of-day greeting on You, grain + matte layer, `::selection`. Now also: two-step destructive confirms everywhere (`ConfirmButton` / `useTwoStep`, or the in-app confirm sheet; no `window.confirm` left in `src`); phone inputs format as you type with the caret kept after the same digit, and after a separator when you delete next to one (`utils/inputMask.js`, tested; the only date fields are native date pickers, so `formatDateMDY` is ready for any typed date field); relative times from one shared minute timer (`useMinuteNow` + `relativeTime` in `utils/relativeTime.js`, tested) on Community posts, comments, notifications and announcements and on You; product card → product page and Community note → open post grow from what was tapped with View Transitions (`utils/viewTransition.js`, `data-vt-target`), else the current fade, never under reduced motion; autofocus rules shared by every sheet (`mayAutoFocus` / `autofocusTarget` in `utils/delightRuntime.js`): Ask (web and app), compose, suggest-a-topic and playlist sheets focus their field only after a click, key or a tap on a text action, never on page load; character-limit ring on every limited text area (Community compose, replies, edit post, bio, topic suggestions, announcements and their replies, Suggest, Contact, Feedback, Delete account, monthly check-in notes).

## No sticky-on-scroll (founder, Oct 21, repeated)
Nothing stays static on screen while the page scrolls under it: no sticky tabs, section navs, tables of contents, side rails, toolbars, buy bars, floating pills or collapsing title bars. The only fixed elements are the main site header and the app's bottom tab bar, and they must show no visible seam (same background as the page, no band or shadow line unless content is under them). Fixed UI inside modals and sheets (e.g. a composer's Post button above the keyboard) is fine.
