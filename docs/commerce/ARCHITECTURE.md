# How ayna commerce works

Plain-language guide for founders. Code lives in `src/commerce/` (shared by web and app) and `api/_commerce/` (server only).

## The pieces

```
Health engine picks WHAT to recommend (never looks at commissions)
        │
        ▼
PRODUCT ──► OFFERS (places it can be bought) ──► VARIANTS (exact size/count/colour at that place)
        │
        ▼
COMMERCE ROUTER picks WHERE to buy it, for the size the shopper chose
        │
        ├─ Amazon / ShopMy / Collabs / brand link ─► shopper clicks ─► retailer's own checkout
        ├─ Shoppable (not live yet) ─► Shoppable's payment form ─► retailer ships
        └─ ayna checkout (only with a signed wholesale/dropship deal) ─► Stripe card hold
              ─► team places the order ─► capture the real amount ─► tracking
```

**Product**: ayna's editorial record (health info, evidence, matching). Merchant data never overwrites it.

**Offer**: one place a product can be bought, such as Amazon or the brand's site. Each offer has its own link, price, stock and rules.

**Variant**: the exact purchasable option within an offer, such as the 60-count on the brand site or one child ASIN on Amazon. A size picked on ayna maps to exactly one variant, or to nothing.

**Commerce Router** (`src/commerce/router.js`): for a product and the size the shopper picked, it returns the destination, merchant, the reason it chose it, the price it may show, stock, and what checkout is allowed. Rules, in order:

1. **ayna partner** (list in `src/data/brandPartners.js`): the partner's own route (tracked link, ShopMy, Collabs, or `?ref=` code). Never Amazon.
2. **Not a partner**: Amazon, but only for the exact item. A chosen size needs its own child ASIN.
3. Otherwise the brand's own site, at the exact size where known.
4. Apps and services: their official signup or service page.

The router returns one of these selection reasons: `PARTNER_ROUTE_PRIORITY`, `NONPARTNER_AMAZON_EXACT_MATCH`, `NONPARTNER_BRAND_SITE_FALLBACK`, `AMAZON_VARIANT_NOT_EXACT`, `AMAZON_NOT_AVAILABLE`, `NEEDS_MANUAL_REVIEW`. A single product can route different sizes to different stores, for example 30-count to Amazon and 60-count to the brand.

**Price follows the route.** The price shown always belongs to the offer the button opens. Every shown price knows its merchant, its size, when it was checked and where the number came from (`src/commerce/freshness.js`).

| Source | Shown for | Then |
| --- | --- | --- |
| Amazon Creators API | 1 h, up to 24 h with an "as of" time | "See current price on Amazon" |
| Shopify product feed | 14 days | "See current price at <brand>" |
| Person or audit read the page | 30 days | same |
| Hand-typed catalog text | never counts as verified | stays as text until `VITE_COMMERCE_PRICE_MODE=verified_only` |

**Capabilities** (`src/commerce/policy.js`): what ayna may do with each offer.

| Offer | Click out | ayna checkout | Team orders it | Paid via |
| --- | --- | --- | --- | --- |
| Amazon | yes | **never** | **never** | Amazon |
| ShopMy / Collabs / Impact / brand link | yes | no (until a signed deal) | no | retailer |
| Shoppable | n/a | after Shoppable confirms access | no | Shoppable |
| Brand with wholesale/dropship deal | optional | yes | yes | Stripe |

The Amazon rule is enforced in code and in the database (`commerce_offers_amazon_redirect_only`). It cannot be switched on with a flag.

**Bag** (`src/commerce/cart.js`): one bag, split by how each item is paid. Sections are "Checkout with ayna", "Checkout with Shoppable", and "Purchased separately on Amazon" or "on <brand>". A sized product can't be added without its size. Before any payment, every line is re-checked and flagged if its price went up or down, it went out of stock, or its offer changed.

**Payment** (ayna checkout only, `api/_commerce/stripeAuthorization.js`):
1. Place a card hold for the approved total.
2. The team places the retailer order.
3. Capture the real amount, never more than the hold.
4. If the order fails, cancel the hold.

If the retailer price rose, the customer approves a new total; ayna never captures more than was held. The hold deadline comes from Stripe (`capture_before`). The queue flags orders as urgent after 3 days and suggests cancelling inside 6 hours of the deadline.

**Fulfilment** (`src/commerce/orders.js`): payment status and fulfilment status are separate. Marking an order placed requires:
- the retailer order number;
- actual cost, shipping, tax and total;
- a checklist (product, size, colour, count, quantity, address, within the approved total).

A total above what the customer approved moves the order to `PRICE_CHANGE_REQUIRES_ACTION` instead.

**Affiliate conversions**: a click is only a click. Commission is recorded only when a network reports it (`commerce_commissions`).

**Tax**: `TAX_CONFIGURATION_PENDING` for ayna checkout. Retailers handle tax for click-outs and Shoppable.

## Database (`supabase/commerce_engine.sql`)

| Table | Purpose |
| --- | --- |
| `commerce_partners` | partners, their tracking route, any managed-checkout agreement |
| `commerce_offers` | one row per place a product can be bought, with price source and time |
| `commerce_variants` | exact options per offer (child ASIN, SKU, UPC, price, stock) |
| `commerce_audit_log` | what each check found; Amazon rows can't hold prices |
| `amazon_offer_reviews` | human Amazon checks, current state only, no prices |
| `commerce_provider_events` | webhook dedupe (Stripe, Shoppable, Zinc) |
| `commerce_commissions` | network-reported commission only |
| pilot rails | blocks Amazon items in the pilot's order/price tables; adds hold fields |

## Analytics

Commerce events go through an allowlist (`src/commerce/analytics.js`). The allowed fields are product, option, provider, merchant, route reason, whether a price was shown, and destination host. No health data, search text or full URLs.
