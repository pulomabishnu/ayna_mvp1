# ayna commerce engine and catalog audit (2026-10-15)

This PR is separate from the design PRs.

| File | What it is |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | how the product/offer/variant model, router, bag, payment and fulfilment work |
| [AMAZON.md](AMAZON.md) | Amazon answers, what's blocked, the price switch, the human review, the draft question for Amazon |
| [AMAZON_CHROME_CHECK.md](AMAZON_CHROME_CHECK.md) | 202 Amazon listings opened in Chrome: final routing state, blocks, exact replacements, open decisions |
| [AMAZON_SIZED_AND_SERVICES.md](AMAZON_SIZED_AND_SERVICES.md) | the 22 per-size Amazon products, the 10 not-exact ones, and the 27 apps/services, one by one |
| [PROVIDERS_AND_PARTNERS.md](PROVIDERS_AND_PARTNERS.md) | checkout readiness, partner candidates and questions, Shoppable, Zinc, Stripe |
| `commerce_catalog_audit.csv` | one row per product (227) with route, price, size, image, Amazon statuses, severity |
| `amazon_priced_vs_brand_site.csv` | the 81 Amazon products whose card shows a dollar figure, compared with the brand's own site (for count and identity checks only; never shown on an Amazon card) |
| `amazon_human_review.csv` | 254 rows to check by hand on Amazon, one per exact variant |
| `audit/` | raw evidence: catalog snapshot, merchant checks, blocked rechecks, mismatch reasons, no-link investigation |

## Catalog at a glance

**Update after the Chrome checks:** all 202 Amazon listings were opened. Exact-only routing now sends 74 products to Amazon when no size is chosen (83 for at least one option); 38 Amazon routes are blocked as wrong item, wrong size/pack or unavailable; 0 Amazon prices are shown. See AMAZON_CHROME_CHECK.md. The tables below are the original audit.

227 products: 201 physical, 26 apps or services, and 36 partner products from 11 brands.

| Route | Products |
| --- | --- |
| Partner route | 36 |
| Amazon, exact item | 110 |
| Brand site (not partner, not on Amazon or not exact) | 68 |
| Amazon has the product but not this size (Veeda) | 1 |
| No Buy link | 12 |

| Finding | Count |
| --- | --- |
| Fully verified, non-Amazon | 63 |
| Amazon prices verified | 0 (needs Creators API) |
| Non-Amazon price mismatches | 24 (16 stale, 3 subscription or first-order, rest other reasons) |
| Count or size mismatches | 6 |
| Products where an Amazon size has no exact child ASIN | 10 |
| Image mismatches | 30 |
| Images hotlinked from Amazon | 33 |
| Broken links | 1 |
| Out of stock / discontinued | 7 / 2 |
| Search or category page instead of product page | 6 |
| Partner links missing tracking | 12 (gina, LOLA, Winx) |
| Wrong product | 0 |
| Corrected in this PR | 17 |
| Need a person to check | 157 |

Severity: 0 critical, 30 high, 145 medium, 52 low.

## What changed from the original plan

- **Amazon is click-out only.** No ayna checkout, team ordering, Zinc or Stripe for Amazon, enforced in code and in the database.
- **No Amazon prices** until Creators API is live. A price a person reads on Amazon can't be shown either.
- Shoppable is its own payment provider. Stripe is only for ayna's own checkout.
- ShopMy, Collabs and Impact stay redirect-only unless a direct agreement is recorded.
- Card holds use Stripe's `capture_before` deadline, not a fixed 7 days.
- Routing is partner → exact Amazon item → brand site, decided per size.
- The partner list lives in `src/data/brandPartners.js` and `commerce_partners`, not in the router.
- The native app doesn't open Amazon until Amazon approves the app (`AMAZON_MOBILE_NOT_READY`).

## Fixed in this PR

- **Price text** (only exact matches on the brand's own site, one-time price, same pack): Neycher Odor Be Gone and Vaginal Moisturizer ($33.30 for 10), Neycher Hydrobloom ($22.19), Pippa starter kit ($119), SootheHer Elaris (removed an unverified $120 list price), BetterHelp ($70–100/week), Tia ($25/month), Lansinoh pads (count corrected to 100).
- **Links:** Maude, Oboo Woosh, MysteryVibe Crescendo, Rael overnight pads, Planned Parenthood Direct and Cora now open the right page.
- **Affiliate credit:** the 3 Neycher partner links were missing from the live rows and are restored.
- **Sizes:** a chosen size now only goes to Amazon with its own child ASIN; otherwise it goes to that exact size on the brand site.
- **Disclosure:** "Paid link. As an Amazon Associate I earn from qualifying purchases." on Amazon products, web and app.

**Not changed (needs a person):** Evernow price text (site now says membership "starting at $35/month"; only medium confidence), Planned Parenthood Direct price text (fees vary by state and pickup method), Bloom app (discontinued, still linked), LOLA's lvnta.com links, a pelvic-bra link for p-pelvic-wand, Ziggy Cup 2 vs Ziggy Cup, Gennev's "$199/consult" (gennev.com shows insurance-based visits, no self-pay price), and every Amazon item.

## The 10 products with no Buy link (Gennev now has one)

| Product | Outcome |
| --- | --- |
| Gennev | brand site found (service), linked |
| Luna Daily wash, Seventh Generation pads, Snoogle, SweetSpot wipes, Tampax Pure | Amazon candidates found, but size or scent unclear; in the human review |
| Ziggy disc | both an Amazon and a brand page found; model unclear |
| Period Nirvana disc | the brand is mainly a reseller; no exact page |
| Pink Stork bloat, Queen V pop | not found; product may be discontinued |

## How to apply

1. Merge (web reads the new code at deploy; nothing changes on cards by default).
2. In Supabase SQL editor, run in order:
   1. `supabase/commerce_engine.sql`
   2. `supabase/seed/2026-10-15_commerce_offers.sql`
   3. `supabase/seed/2026-10-15_commerce_price_text_fixes.sql`

   All three are safe to re-run. `scripts/test-commerce-migration.sh` runs them twice against a throwaway Postgres.
3. Optional env vars:
   - `VITE_COMMERCE_PRICE_MODE=verified_only`: the price switch. **Needs your OK first**; see AMAZON.md.
   - `VITE_AMAZON_MOBILE_APP_APPROVED=true`: only after Amazon approves the app.
   - Server: `AMAZON_CREATORS_CREDENTIAL_ID/SECRET/VERSION`, `AMAZON_CREATORS_USE_APPROVED`, `SHOPPABLE_CHECKOUT_ACCESS_CONFIRMED`.
4. The admin review page at `/admin/amazon-review` needs step 2.1 and your email in `ADMIN_EMAILS`.

**PR #33 (pilot pricing)** stores Amazon prices and charges cards immediately. The migration here blocks Amazon items in the pilot tables and sets existing Amazon pilot prices to not-live. Merge this first, or remove Amazon from #33.

## Blockers

- **NEEDS_CREDENTIALS:** Creators API credentials, and the 10 sales in 30 days that unlock them. Shoppable API key. Stripe keys for manual capture.
- **NEEDS_PROVIDER_CONFIRMATION:** Amazon's written answer on the Creators API "principal purpose" rule (draft in AMAZON.md, not sent). Amazon Approved Mobile Application. Shoppable plan and merchant coverage.
- **NEEDS_PARTNER_APPROVAL:** any wholesale or dropship agreement before ayna checkout; tracking for gina, LOLA and Winx links.
- **NEEDS_LEGAL_OR_TAX_DECISION:** sales tax for ayna checkout (`TAX_CONFIGURATION_PENDING`); merchant-of-record terms; reselling devices and supplements.
- **NEEDS_HUMAN_VERIFICATION:** 254 Amazon review rows; 157 products flagged for review; 16 pages that blocked automated checks; 33 Amazon-hotlinked images to replace.

## Also noticed

`ProductModal`'s existing `product_buy_now_clicked` event sends the search text to PostHog, which can contain health terms. It isn't changed here; the new commerce event uses an allowlist.
