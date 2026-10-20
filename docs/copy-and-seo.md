# ayna copy and SEO rules

How words should sound on the app and website, and how pages should be built
so search engines and AI answers can find and trust them. Read with
`docs/design-rules.md`.

## Voice

- Talk like a knowledgeable friend who checked the research: plain, warm, specific, a little dry. Never hype.
- Say the specific thing. "Wear it up to 12 hours" beats "All-day comfort".
- Use her words. People say "cramps", "heavy periods", "UTI", not "menstrual discomfort solutions". Reuse phrasing from focus groups and reviews.
- One idea per sentence. Short sentences. Contractions are fine.
- Sentence case for everything, including buttons and headings.

## Words and patterns that sound AI-written (don't use)

- Hype verbs and nouns: unlock, empower, elevate, transform, revolutionize, seamless, game-changer, cutting-edge, holistic, robust, leverage, curated just for you, journey, embark, navigate, delve, tapestry, testament, pivotal, vibrant, crucial, furthermore, moreover, additionally.
- Openers and frames: "In today's world", "Whether you're X or Y", "It's not just X, it's Y", "Look no further", "Let's dive in", "We've got you covered".
- Rule of three everywhere (three adjectives, three bullets, three benefits). Use as many items as are true.
- Em dashes. Use a comma, colon, or a new sentence.
- Exclamation marks in product or health copy.
- Excessive bold, emoji bullets, title-case headings.
- Ending a section by restating it ("In short, ...").
- Vague UI words: "Submit", "Continue", "Learn more", "Get started", "Click here", "Oops, something went wrong". Say the action ("Save my answers", "See the research") and the fix ("Couldn't reach ayna. Check your connection and try again.").

## Health copy (YMYL)

- Real data only. Every claim maps to a cited source on file. No invented numbers, quotes, reviews or outcomes.
- Say what the evidence is: "A 2019 review of 43 studies found..." not "Clinically proven".
- No diagnosis or treatment promises. "May help with", "people use it for", "talk to your clinician if".
- Name the source and date. Show who checked it (ayna's evidence check) and when.
- A person reviews any new health claim before it ships. AI can draft; it never publishes health copy unchecked.

## Product page SEO

- Unique title per product: `Product name by Brand: what it's for | ayna` (under ~60 characters where possible).
- Unique meta description per product (about 150 characters): the specific use plus one concrete fact.
- One H1 (product name). H2s for sections ("What it is", "What the evidence says", "How to use it"). Text in collapsed rows must be in the HTML at load (not fetched on click) so it's indexed.
- schema.org Product JSON-LD with real fields only (name, brand, image, offers with real price and URL, aggregateRating only from real ayna reviews), plus BreadcrumbList. FAQPage only for real Q&A shown on the page.
- Original descriptions, never pasted manufacturer copy. Concrete specifics (size, material, wear time, FSA/HSA, certifications) because search and AI answers cite facts.
- Real reviews with names (or handles) and dates.
- Comparison tables in HTML (AI answers pull them for "X vs Y" questions).
- Internal links: product to its need hub, Library reads on the same topic, and similar products.
- Descriptive image alt text ("Lena menstrual cup, small, purple") and fast images.
- Out-of-stock products stay live with alternatives.
- Prerendered HTML for product and Library routes so crawlers see real content without running JavaScript.

## Library and landing pages

- One clear question per read, answered in the first two sentences (this is what AI Overviews quote).
- Named author or reviewer, date, and sources at the end.
- Link to the products the read discusses, and back.

## Check before shipping copy

1. Cover the logo: could a competitor say this sentence? Rewrite it.
2. Read it out loud. If you wouldn't say it to a friend, cut it.
3. Search the diff for the banned words above.
4. Every button says what happens; every error says what to do next.

Sources: Wikipedia "Signs of AI writing"; LogRocket "AI UX writing: where it works and fails"; NN/g on AI and tone; Search Engine Journal "Product page SEO"; Google guidance on AI content and E-E-A-T for YMYL topics (via Anchor Digital summary); IWD Agency on AI search optimization for ecommerce; Zero Gravity Marketing on indexing of accordion content.
