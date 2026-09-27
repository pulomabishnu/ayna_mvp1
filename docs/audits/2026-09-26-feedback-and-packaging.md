# Home, anonymous feedback, and packaging — 2026-09-26

## Behavior

- Ordinary sign-in returns to Home (`/`). The signed-in Home cabinet greeting says “welcome home.” Explicit quiz completion still opens the ecosystem.
- A Buy Now click records a tab-local pending retailer visit. After leaving and returning to Ayna, one optional Yes/No/X prompt is offered for that visit. It identifies the selected variant. Merely opening a product detail page does not count as a retailer visit.
- The new satisfaction campaign is `2026-09-26`. Previous survey respondents are eligible again. An atomic server-side campaign/account marker limits the offer to once across devices; closing it also consumes that offer. Ratings require 1–5 stars; text and referral are optional.
- Answers go to `/admin/reviews`, protected by the existing server-side admin allowlist. Purchase answers are self-reported, not verified transactions.

## Privacy and persistence

New answers are stored in durable Redis hashes/indexes with no expiration, using the existing Upstash/KV environment configuration. Answer records contain a random response ID, campaign, day-only date, and answer fields. Purchase answers also contain catalog product ID/name and variant label. They do not contain user/account ID, email, phone, IP, or an account-linked receipt. Survey eligibility uses a separate keyed account digest with value `1`; no response ID or timestamp is saved there. Response text is excluded from PostHog autocapture. Free text may still contain personal details if a respondent chooses to type them; the form asks them not to.

Historical surveys remain in the old auth metadata storage. The admin API strips their account identifiers from its response. This change does not delete historical feedback.

Signed, expiring receipts validate anonymous submissions. Duplicate submissions are idempotent. Storage failures produce a retryable error, not a false success. The once-only offer is at-most-once: closing a tab or losing the network after a server claim can consume the offer without a completed answer.

## Photo and option audit

All 219 distinct static/live catalog records were inspected in contact sheets. All 102 distinct original option photos were also inspected. New replacement files are unchanged retailer/manufacturer image bytes, not AI-generated, composited, or recreated packaging.

- Seven Cora Target packaging photos: four pad absorbencies and three tampon combinations, each with an exact Target product link.
- Additional verified packaging/product replacements are listed in `src/data/productPackaging.js`, with source URLs and review dates.
- DIVA Models 0, 1, and 2 have their own official box photos and product/variant links.
- 42 product families expose 203 explicitly sourced choices. Sources and variant IDs are recorded in `src/data/productVariants.js`. Counts, sizes, and colors come from official product endpoints or exact retailer listings, not guessed query parameters.
- Selected options without a verified matching image use a neutral placeholder rather than another size's box. No unreviewed physical image is automatically fetched into an empty image slot.
- Product tiles preserve the complete package with `object-fit: contain`.

Coverage limit: this does not certify that every product on the internet has every possible option represented. Some catalog entries are general brand/collection links, some suppliers block access, and some only provide product/model photos rather than package photography. Those source gaps remain; the audit does not label them as verified box photos. Digital apps and services use app/brand imagery rather than fictitious packaging.

## Validation

- Full regression suite: 747 passing tests at the time of this audit, including actual React prompt lifecycle tests, anonymous field whitelisting, cross-device atomic claims, retry behavior, admin access, and selected-size link checks.
- Production build and focused lint pass; catalog export remains lossless with 213 static records.
- Browser: Cora size selection changes title, real package image, and Target destination together. Target confirms Overnight 28 and Regular 32 destinations.
- The local browser feedback endpoint is an isolated test fixture outside the repository. No fake test responses are submitted to production.
- Production deployment/storage verification is recorded separately after release. Tests do not establish a promise of zero bugs.
