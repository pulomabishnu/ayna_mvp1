# Amazon report (2026-10-15)

Sources: [Associates Program Policies](https://affiliate-program.amazon.com/help/operating/policies) (updated 2026-04-14), [Operating Agreement](https://affiliate-program.amazon.com/help/operating/agreement), [Creators API intro](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction), [Creators API best practices](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/concepts/best-programming-practices), [link disclosure guidance](https://affiliate-program.amazon.co.uk/help/node/topic/GPXFHVYZMTGPUMPE).

## Answers

1. **Products that use Amazon:** 111 non-partner products have an ASIN mapped. 110 of them send the Buy button to Amazon (Veeda pads maps only per-size ASINs).
2. **Valid affiliate links:** all 110 Amazon destinations are `amazon.com/dp/<ASIN>?tag=aynahealth-20` with no other parameters, enforced by test. No Amazon page was opened, so whether each link loads is unverified.
3. **ASINs found:** 194 mapped (169 distinct): 110 product-level plus 84 per-size child ASINs.
4. **Parent vs child:** unknown without Amazon data; parent ASINs are recorded as "unknown". 22 products map a child ASIN for every Ayna size, 6 for some sizes, 4 use one generic listing for a sized product, and 79 have one ASIN and no Ayna sizes.
5. **Variation mismatches:** 10 products are `AMAZON_VARIANT_NOT_EXACT` (54 sizes have no child ASIN). Those sizes now route to the exact brand-site size. In the 22 fully mapped products, no child ASIN is shared by two sizes. In 4 of them (Belly Bandit, AZO Cranberry, Lena, Rael pads) the product-level listing ASIN isn't any of the size ASINs, so a reviewer should check it. Per-product detail: [AMAZON_SIZED_AND_SERVICES.md](AMAZON_SIZED_AND_SERVICES.md).
6. **Prices verified:** 0. Availability verified: 0. Identity verified by a person in this audit: 0. A team review on Oct 4 removed 10 wrong-brand rows.
7. **Creators API credentials:** none (no env vars, nothing in code).
8. **Setup that remains:** see below. Two separate blockers: credentials, and Amazon's written OK for a multi-retailer site.
9. **Web compliance:**
   - Click-out only, no per-user tags, no click incentives found, no price tracking.
   - The Associate statement is on the Buy area of every Amazon product page, plus Privacy, Terms and How we make money.
   - **Fix:** 33 product images are hotlinked Amazon image files. Amazon allows keeping an image URL for at most 24 hours. Replace them with brand or ayna images.
   - **Fix:** the hand-typed prices on Amazon products aren't from Amazon. The policy allows showing Amazon prices only from Creators API or an Amazon-served link. The switch below removes them.
10. **Mobile:** the native app needs Amazon's separate Approved Mobile Application status. In this PR the native app never opens Amazon (`AMAZON_MOBILE_NOT_READY`): those products open the brand site and show the brand's price. To enable Amazon in the app after approval, set `VITE_AMAZON_MOBILE_APP_APPROVED=true`. Links open the system browser, not a WebView.

## Important: a person-checked Amazon price can't be shown either

Amazon lets an Associate show prices only from Creators API or a link Amazon serves. A price someone reads on Amazon.com and types in doesn't qualify. The review queue therefore verifies identity, size/count, availability and image, but it does not store or display Amazon prices. Until Creators API is live, every Amazon product should show "See current price on Amazon". This is the switch below.

## Price display switch (needs your OK)

- `VITE_COMMERCE_PRICE_MODE=verified_only` (Vercel env, then redeploy) turns 108 Amazon product cards into "See current price on Amazon". 82 of those cards show a number today.
- It also turns 25 brand-site cards with no verified price into "See current price at <brand>".
- The per-unit price next to those is hidden too.
- Off (the default in this PR): cards keep today's text, except brand prices verified as different on the brand's own site.

## Human review

- **Worksheet:** `docs/commerce/amazon_human_review.csv`, 254 rows. Each row has the link to open, the expected exact variant, and blank reviewer columns. Work top to bottom.
- **In-app:** `/admin/amazon-review`, for anyone in `ADMIN_EMAILS`. It has Open Amazon, Exact product?, Exact size?, Size/count seen, Availability, Image matches?, Notes, and Save. It saves who and when, current state only, no prices. It needs `supabase/commerce_engine.sql` applied.

Priority order:
1. The 10 not-exact products.
2. The 4 listing ASINs that aren't any size ASIN.
3. The 22 per-size products.
4. The 79 single-ASIN products: check count, pack, volume, formula and model.
5. The 6 search-found candidates for products with no Buy link.

## Creators API setup

1. In Associates Central, open **Tools → Creators API**. Access needs 10+ qualifying sales in the last 30 days, and it pauses if sales drop below that.
2. Create an app, then a credential set.
3. Add `AMAZON_CREATORS_CREDENTIAL_ID`, `AMAZON_CREATORS_CREDENTIAL_SECRET` and `AMAZON_CREATORS_CREDENTIAL_VERSION` to Vercel as server env vars, never `VITE_`.
4. After Amazon answers the question below in writing, set `AMAZON_CREATORS_USE_APPROVED=true`.
5. A follow-up PR wires GetItems, GetVariations and OffersV2:
   - offers cached for 1 hour, other data for 24 hours, no image files;
   - an "as of" time and Amazon's disclaimer when the price is older than 1 hour.

## Draft question for Amazon Associates support (not sent)

> Subject: Creators API use on a multi-retailer health discovery site
>
> Hello, ayna (aynahealth.co, store ID aynahealth-20) is a women's health product discovery site. Members get personalized product recommendations, and each product page links to one place to buy it. For most products that is Amazon via our Special Link; for some it is the brand's own site.
>
> 1. Does this meet the Creators API requirement that the site's principal purpose is advertising Amazon, given that Amazon is one of several retailers we link to?
> 2. May we show Creators API data (title, price, availability) on a product page whose Buy button goes to Amazon, when other product pages on the site link to brand sites?
> 3. We will never show Amazon data next to another retailer's price or link. Is that sufficient for the requirement not to promote other retailers?
> 4. Our iOS/Android app is free in the App Store and Google Play. What do we need to submit for Approved Mobile Application status?
>
> Thank you.
