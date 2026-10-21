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
