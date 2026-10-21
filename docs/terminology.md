# ayna terminology (website + app)

One name per thing, used the same way on the website and in the app. Read
with `docs/copy-and-seo.md` (voice) and `docs/design-direction.md` (type).
Written Oct 21 2026 after the first-time-user walkthrough found the same
feature under four names. If you add a screen, use these words; if a word
here is wrong, change it here first and then sweep.

## Rules that apply to every string

- **Sentence case** for everything: headings, buttons, tabs, nav, page
  titles, document titles, menu rows. Proper nouns keep their capitals
  (Apple Health, Supabase, FSA/HSA, UTI, PCOS). The brand is always
  lowercase **ayna**, including at the start of a sentence.
- **No uppercase tracked eyebrows.** A label above a heading is 13px,
  weight 600, sentence case, no letter-spacing ("Reviewed by", not
  "REVIEWED BY"). Most labels can go entirely.
- Category, shelf and need labels that come from data are sentence-cased at
  render (`sentenceCase` in `src/utils/sentenceCase.js`), never by editing
  team copy in `src/data`.
- Spell counts out with their noun and the right plural: "1 product",
  "22 products". Never "product(s)".
- No em dashes, no hype words (see copy-and-seo.md).

## Places and features

| Thing | Use | Don't use |
| --- | --- | --- |
| The personal shelf of products | **Your ecosystem** in page titles, H1s, document titles, search placeholders and sentences addressed to her ("Added to your ecosystem") | Your Ecosystem, My Ecosystem (title case), the ecosystem |
| Its navigation label | **Ecosystem** in the phone tab bar (web and app, space is tight). **My ecosystem** in the desktop header, footer and menus, where it reads as her own place. Signed out, the desktop link keeps the "Start here" tag | Build your ecosystem (as a nav item), My Ecosystem |
| The catalogue | **Shop** (nav, titles, buttons "Browse the Shop") | Discovery (internal component name only), Browse (as a title) |
| Reads | **Library** (place), **read** (one article) | Articles, Blog |
| Posts and questions | **Community** | Forum, Feed (as a title) |
| Her account area | **You** (tab, nav, title of the hub). Always "You", signed in or out; signed out it explains sign-in | Log in (as a tab), Profile (as a tab), My Account |
| The AI helper | **Ask ayna** (button, sheet title); **Ask** only where a one-word label is unavoidable | Chat, chatbot, the chat button |
| Saved items | **Saved** (heart, list title "Saved products") | Wishlist, Favorites |
| Health data area | **Health data** (connections and imports) and **Your health** (the dashboard) | Health connections, Health Data |
| Visit planning tool | **Appointment prep** | Appointment Prep Tool, Doctor prep |

## The quiz

- It is **the quiz** in prose and **six questions** when we say how long it
  is: age and life stage (one "About you" question, two screens in the
  app), what you want help with, conditions, allergies, medications, and
  safety. Those are the required questions in `splitIntakeSteps`.
- The primary call to action is **See my matches**. A secondary text link
  may say **Answer six questions**.
- The optional follow-ups are **N more optional questions** ("Answer 11 more
  questions" becomes "Answer 11 more optional questions" only where the
  word optional isn't already beside it).
- Changing answers: **Edit my answers**. Not "Retake Assessment", not
  "Redo quiz" in titles.

## Matches and needs

- **Match** / **matches** for products scored against her answers. The
  score is "95% match".
- **Need** for what she asked help with (cramps, heavy flow, UTIs). A need
  is **covered** when her ecosystem holds at least one product for it:
  "3 of 4 needs covered". Never "needs have picks".
- **Shelf** for a group of products in her ecosystem; **area of care** only
  in long-form copy.
- **Product** / **products** for catalogue items. "Picks" is fine in a
  heading ("This week's picks") but counts use products: "22 products ·
  5 shelves · 3 of 4 needs covered".

## Legal documents

The link text, the page H1, the browser title and the app row all use the
same name:

| Document | Name | Route |
| --- | --- | --- |
| Privacy | **Privacy policy** | `/privacy-policy` |
| Terms | **Terms of use** | `/terms-of-use` |
| Health data notice | **Consumer health data privacy notice** (short form in tight rows: **Consumer health data notice**) | `/consumer-health-data` (the SPA page; `/consumer-health-data.html` stays as the standalone print fallback) |
| Cookies and analytics | **Privacy preferences** | footer button |

The legal text inside these documents is not edited for terminology. Its
headings are sentence-cased only. Any wording change goes to the founders
first.

## Repeated phrases

- "Does this sound familiar?" is the one form (not "Sound familiar?").
- Sign-in prompts name the action: "Sign in to post", "Sign in to mark
  posts helpful", "Sign in to save products". Never "Sign in to use X".
- Back links name the parent: "Library", "Community", "You", "Your
  ecosystem". One component (`BackLink`): chevron + parent name, 44px row,
  top left under the header.

## Waiting for founder approval (not changed)

Found during the Oct 21 sweep. Wording that carries legal, compliance or
authored meaning is left as is until a founder says yes.

1. **Health data notice date.** The app's in-app summary (You > Legal >
   Consumer health data notice) says "Effective 10 Sep 2026"; the notice
   itself (`public/consumer-health-data.html`) says "Effective September
   12, 2026". One of them is wrong.
2. **SMS consent text** (`src/components/PhoneVerification.jsx`): "By texting
   Ayna ... See our Terms of Service and Privacy Policy". Capital A and
   "Terms of Service" break this glossary, but the text may be the wording
   registered with the carrier (docs/twilio-sms.md). Change only together
   with the registration.
3. **Legal bodies keep their own capitals.** Privacy policy, Terms of use
   and the notice mention "Consumer Health Data Privacy Notice" and "Privacy
   Policy" in Title Case inside the legal text. Only headings, links and
   page titles were sentence-cased. The Terms page title changed from "Terms
   of service" to "Terms of use" (the name its link and URL already used);
   the body says "these Terms" and was not touched.
4. **Read titles in Title Case** (Library, `src/components/Articles.jsx`):
   "Intimate Washes", "Heavy Menstrual Bleeding", and the postpartum read
   "Can You Actually Improve Postpartum Stretch Marks and Scars? I Looked at
   the Research Behind 5 MOST Popular Treatments" (8 lines on a phone; now
   set smaller, words unchanged). Proposed: sentence case, and a shorter
   H1 such as "Can you improve postpartum stretch marks? What the research
   says about 5 popular treatments".
