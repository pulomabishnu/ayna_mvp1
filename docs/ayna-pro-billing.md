# ayna Early Access → Pro

This PR targets `web/pdp-and-eco-toggle` (PR #68), so the checkout fits the current app and website. It does not deploy or change live Stripe objects.

## Customer promise

| Plan | Pay today | Purchased period starts | First regular renewal |
| --- | --- | --- | --- |
| Monthly | $4.99 (save $4) | Public launch | $8.99/month after the included month |
| Annual | $45 (50% off) | Public launch | $90/year after the included year |

Both unlock Pro immediately after payment confirmation. Beta time is included in addition to the purchased period. Cancel renewal on `/you/pro`; access continues through the paid period. The old $5 pre-beta payment is not imported or treated as a recurring subscription.

Launch defaults to **January 1, 2027, 12:00 AM America/New_York** (`2027-01-01T05:00:00Z`). Confirm/change `pro_launch.launch_at` **before opening sales**. A January 1 monthly purchase renews February 1, 2027; annual renews January 1, 2028. Each checkout snapshots its launch and renewal dates. Changing the launch row later does not reschedule existing Stripe subscriptions: do that deliberately in Stripe before changing customer promises.

## Stripe model

Hosted Checkout in `subscription` mode has two line items on the **same Pro product**:

1. A one-time early-access price ($4.99 or $45), paid on the initial invoice.
2. The regular recurring price ($8.99/month or $90/year), with `subscription_data.trial_end` set to launch plus the purchased month/year.

Stripe calls the deferred recurring interval a trial. In the UI it is the included beta time plus the prepaid first period. The initial one-time charge still happens now. No recurring invoice is due at launch itself. The first regular invoice is due after the included term. Uses supported Checkout free-trial parameters; paid Trial Offers require a private preview and are not used.

The page displays the regular price with a strike-through, the exact introductory price/savings and the renewal terms before payment. Stripe also displays the recurring price and scheduled trial end. No blanket “50% off” claim for the monthly option: $4.99 is not half of $8.99.

## Setup

1. Apply `supabase/migrations/20261026234901_ayna_pro_early_access.sql` to a development Supabase project first, then the intended production project. This adds service-managed purchases, subscriptions, refund tombstones and timed focus-group grants. Client SELECT is limited to the account's own purchase/subscription/grant records; clients cannot grant access or call the status RPC.
2. In a separate Stripe sandbox, create the Pro product with four prices above. Use the current live product only for the eventual live configuration. The known live one-time prices are `price_1UUwPQ6Fa5QsO0vGMdHLFDpc` ($4.99) and `price_1UUwPQ6Fa5QsO0vGgrYwp70F` ($45), product `prod_Uvd7BO5iXDpBQs`. Do not reuse the old $5 price. Add regular recurring prices; then the existing `ayna_pro_access` feature can be attached to the recurring Pro product.
3. Set server-only env vars from `.env.example`: `STRIPE_RESTRICTED_KEY`, `STRIPE_PRO_WEBHOOK_SECRET`, `STRIPE_PRO_LIVEMODE` (`false` in development, `true` in production), product and four price IDs, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SITE_URL` for the current deployment. A restricted key needs Checkout Sessions read/write, Prices read, Subscriptions read/write, Invoices/Invoice Payments/PaymentIntents/Charges read. No keys go in Vite/browser env vars.
4. Register `/api/pro-webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`, `charge.dispute.created`. Enable Stripe's upcoming trial/renewal notices and failed-payment emails. The signing secret is endpoint/environment specific.
5. Set `PRO_BILLING_ENABLED=1` after migration, and `PRO_CHECKOUT_ENABLED=1` only when ready to accept payments. Sales automatically close at launch. To pause sales, disable only `PRO_CHECKOUT_ENABLED`; purchased and focus-group access continue working.
6. Confirm the launch date before enabling sales. Neither the previous November 30 founding deadline nor the superseded $34.99/$69.99 prices are used.
7. Test real sandbox checkouts and Stripe Test Clocks before live activation (see below).

## Access, cancellation and failure handling

- `pro_access_status` is the live source of truth, combined with existing server-managed `app_metadata.is_premium` grants. User-editable metadata never grants access. The four existing AI routes use this source, so web and native calls recognize the same Pro membership.
- Initial access requires a paid, complete Checkout Session, expected prices/product/account/owner, and a settled invoice PaymentIntent. Both synchronous and delayed-success webhooks fulfill the same session-keyed purchase. A success URL alone grants nothing.
- Each normal paid renewal creates an invoice-keyed grant through its actual invoice period end. Failed payment does not extend access. Paid grants remain valid if the customer cancels; cancellation stops future renewal. Latest subscription state is retrieved rather than trusting out-of-order snapshots.
- Full refunds and disputes revoke the associated payment and stop future renewal. Partial refunds leave access intact. Disputes remain revoked pending manual review; winning a dispute does not automatically restore access. Tombstones survive completion replays and refund-before-completion delivery.
- Account deletion cancels known Pro subscriptions before removing local account data. Delayed payment events for a deleted account do not recreate it and cancel their subscription.
- Focus-group grant/revoke controls on `/you/pro` appear for confirmed `ADMIN_EMAILS` accounts. The endpoint independently verifies admin authorization. Grants last 1–240 minutes and expire without cron. Ending a temporary grant does not remove independently paid access.
- No migration of the legacy $5 payment, no charge packs, and no changes to marketplace, safety/evidence, Community or basic matching access.

## Evolving feature bundle

This PR implements the payment/subscription state and connects it to the existing server Pro checks. It does **not** invent a final paid feature bundle, convert all Reads into premium content, or relabel existing free tools as Pro. The exact premium Read IDs, playlist allowance and deeper-feature boundaries still need product decisions before new locks are enabled. Existing AI quotas stay as they are; there is no “unlimited Ask” promise on the checkout. This keeps the latest scope focused on the Early Access lifecycle.

## Verification and live activation

Automated tests cover real Postgres behavior (PGlite), role permissions, expiration, refund ordering, payment signature verification, checkout ownership/price validation, subscription timing and cancellation. These do not perform a live payment.

Before live activation, complete a sandbox monthly and annual purchase, delayed success/failure, cancellation during beta, a full refund, and an upcoming renewal with Stripe Test Clocks. Verify: initial invoice equals $4.99/$45; immediate access; no recurring charge at launch; first renewal after the included period is $8.99/$90; canceled plans do not renew; failed renewal gives no extra paid access. Verify configured Stripe email reminders. Keep live checkout disabled until this passes.

References: https://docs.stripe.com/payments/checkout/free-trials · https://docs.stripe.com/billing/subscriptions/trials/compare · https://docs.stripe.com/checkout/fulfillment · https://docs.stripe.com/api/invoice-payment/list
