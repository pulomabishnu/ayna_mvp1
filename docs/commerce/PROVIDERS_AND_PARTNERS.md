# Providers, checkout readiness and partner outreach (2026-10-15)

Numbers come from the live catalog snapshot (227 products, `docs/commerce/audit/`).

## Where each Buy button goes today

| Route | Products | Where the price comes from | How sizes are matched |
| --- | --- | --- | --- |
| Amazon Associates | 110 | nothing yet (needs Creators API) | child ASIN per size, or none |
| Brand site, no tracking | 60 | brand page or Shopify `.json`, read in this audit | brand variant id where Shopify exposes it |
| Brand affiliate link (`?ref=`, `sca_ref`, tracked page) | 16 | brand page | brand variant id |
| Impact (Proov) | 4 | brand page | brand variant id |
| Shopify Collabs (SootheHer) | 2 | brand page via the Collabs link | brand variant id |
| ShopMy (VIO2) | 1 | brand page | n/a |
| App or service signup page | 22 | the service's own pricing page | n/a |
| No Buy link | 12 | n/a | n/a |

One network per click: the router picks one destination and never adds a second tracking layer on top.

## Who could use "Checkout with ayna"

Nothing is READY today: ayna checkout needs a written wholesale, dropship or reseller agreement. The code refuses it without one, and the database blocks Amazon outright.

| Bucket | Products / brands |
| --- | --- |
| READY | none |
| READY AFTER CREDENTIALS | none. The Stripe code is written, but there's no agreement yet, and tax is `TAX_CONFIGURATION_PENDING`. |
| READY AFTER PARTNER APPROVAL | the 36 partner products (11 brands), plus non-partner Shopify brands that agree to wholesale: Oboo, Joylux, kieró, Liv Labs |
| READY WITH SHOPPABLE | unknown until Shoppable confirms Checkout API access and which merchants it covers (`SHOPPABLE_CHECKOUT_ACCESS_REQUIRES_CONFIRMATION`) |
| READY WITH ZINC | non-Amazon retailers only, and only with written permission from the retailer. Not recommended now (see below). |
| AFFILIATE REDIRECT ONLY | the 110 Amazon products; ShopMy, Collabs and Impact links until a direct agreement exists |
| UNKNOWN | the 12 products with no Buy link; 16 pages that blocked verification |

## Partner candidates for ayna checkout (ranked)

Ranked by how many products ayna features, whether every size could be matched exactly, and whether the store is on Shopify (clean variant ids and price feeds).

| # | Brand | Partner now? | Products | Store | Why it's a candidate |
| --- | --- | --- | --- | --- | --- |
| 1 | Winx Health | yes | 6 | Shopify | every variant matched and priced on the brand site |
| 2 | Oboo | no | 15 | Shopify | biggest single brand in the catalog; 13 of 15 verified |
| 3 | Joylux | no | 9 | brand site | many products; would need a partner deal first |
| 4 | My Pelvic Bra | yes | 5 | EU store, prices in EUR | needs USD pricing or a US fulfillment answer |
| 5 | BUNI | yes | 4 | Shopify | small catalog, clean variants |
| 6 | Proov | yes | 4 | brand site via Impact | already tracked through Impact |
| 7 | gina | yes | 4 | brand site | partner link lacks tracking today |
| 8 | LiM Method | yes | 3 | brand site | tracked link in place |
| 9 | Neycher | yes | 3 | brand site | affiliate links restored in this PR |
| 10 | SootheHer | yes | 2 | Shopify via Collabs | Collabs stays redirect-only without a direct deal |
| 11 | Elitone | yes | 2 | brand site | device; prices withheld (conditional pricing) |
| 12 | LOLA | yes | 2 | brand site | partner link lacks tracking today |
| 13 | VIO2 | yes | 1 | ShopMy | ShopMy stays redirect-only without a direct deal |
| 14 | kieró | no | 2 | Shopify | small, clean catalog |
| 15 | Liv Labs | no | 2 | Shopify | Pippa price corrected in this PR |

### Questions to send each brand

1. Can ayna buy your products at wholesale and resell them (ayna is the merchant of record), or would you dropship orders that ayna takes payment for?
2. What is the wholesale price or dropship fee per SKU, and is there a minimum order?
3. Who ships, from where, and in how many days? Do you share tracking numbers, and how (email, API, Shopify order)?
4. Who handles returns, refunds and damaged items, and under what policy?
5. May ayna show your current retail price and charge that price? Do you require MAP pricing?
6. Will you give us a product feed (Shopify `products.json`, CSV or API) with SKU, UPC, size/count, price and stock?
7. Who collects and remits sales tax on these orders?
8. For devices or supplements: are there any rules on who may resell them, or on what we may say about them?
9. Can you confirm in writing (email is fine) so we can record the agreement before turning on checkout?

## Shoppable

What's built: `api/_commerce/shoppable.js` builds a checkout request with `substitutionOptIn: false` and `marketingOptIn: false`. It maps a price increase to `PRICE_CHANGED` and out-of-stock to unavailable. It computes the expected card hold (items + shipping + 15%). Shoppable is its own payment provider, never Stripe. Nothing is live until `SHOPPABLE_CHECKOUT_ACCESS_CONFIRMED=true`.

Questions for Shoppable:
1. Which plan includes Checkout API V6 access, and what does it cost?
2. Which of these merchants can be checked out through you: Oboo, Joylux, Winx Health, BUNI, gina, LOLA, kieró, Liv Labs, Intimina, Love Wellness, Modibodi, Nutrafol?
3. Is Shoppable or the merchant the merchant of record, and who handles refunds and chargebacks?
4. Does a price drop always process at the lower price, and does a price rise always reject the order?
5. How are tracking numbers and order status returned (webhook, polling)? Are webhooks signed?
6. Is the 15% hold buffer fixed? When is the hold released for items that fail?
7. Can affiliate or partner commission still be earned on orders placed through you?
8. Do you restrict health products, supplements or medical devices?

## Zinc

What's built: `api/_commerce/zinc.js` builds an order with `max_price` (the whole-order ceiling in cents) and a required idempotency key. Each order is limited to one retailer. It refuses Amazon and requires a documented agreement that allows ordering through a purchasing provider.

- **Cost:** $1 per successful order plus $0.01 per data call. The retailer price is paid at cost.
- **Not Amazon commission:** Zinc buys as a customer, so no affiliate commission is earned, and buying from Amazon on someone else's behalf breaks the Associates rules. Zinc is non-Amazon only.
- **Sizes:** Zinc needs the retailer's exact product id or variant. Use it only for variants that have a verified id.
- **Tracking:** returned by Zinc after the retailer ships, so ayna must poll or receive webhooks.
- **Recommendation:** don't use Zinc now. A direct wholesale or dropship agreement gives ayna better margin and clear permission.

## Stripe (ayna checkout only)

`api/_commerce/stripeAuthorization.js`:
- `capture_method=manual` holds the card for the approved total, with idempotency key `ayna-auth-<orderId>`.
- The deadline is read from Stripe's `capture_before`. Card holds usually last about 7 days, but the code never assumes that.
- Capture the real amount once, never more than the hold. Capturing less releases the rest.
- If the retailer charges more, the order goes to `PRICE_CHANGE_REQUIRES_ACTION` and the customer must approve a new total.
- Cancel releases the hold.
- Only `ayna_order_id` is sent as metadata; no health data.
- Every offer is checked by `assertManagedCheckoutAllowed`, so Amazon and unapproved merchants can't reach this code.
