# Manual fulfillment checkout pilot

The first item tested was Always Infinity FlexFoam, `p-always-infinity`. Every published, active, non-prescription physical catalog product has an Ayna **Buy now** path. Digital products and services keep their app or website links. Products with verified sizes or packs keep the selected option throughout the request, price, and paid order.

## What is implemented

The existing React 19 / Vite web app uses Vercel API routes and Supabase authentication. Eligible physical products show **Buy now** as their only purchase action; digital products keep their external app links. When the exact option has a confirmed retailer price and link, signed-in customers go to Stripe hosted Checkout, quantity one, card payment, US shipping address. A verified Stripe webhook atomically marks the order paid and creates a vendor fulfillment inbox record. `/pilot/admin` lets an allowlisted administrator record carrier, tracking number, and optional HTTPS tracking link. `/pilot/orders` shows the customer's own orders and refreshes every ten seconds.

When the price is not yet confirmed, **Buy now** creates an order request for that exact option. The page clearly says no payment was taken. The team is notified by email and sees a durable request in `/pilot/admin`. An admin sets the exact price and retailer link, then clicks **Send checkout link**. The customer can review the total and choose to pay. A request never creates a paid order or fulfillment record by itself.

**Fulfillment is manual.** When an order is paid, the team gets an email (via the existing `RESEND_API_KEY`; recipients from `PILOT_NOTIFY_EMAILS`, default the three founders) with the product, amount, city/state and a link to `/pilot/admin`. The inbox shows the full shipping address with a copy button and the configured retailer item link. A team member buys the item, ships it to the customer's address, and enters the optional retailer order number, carrier and tracking. The customer sees tracking on `/pilot/orders` and gets Claude's one-time "your order shipped" email with the carrier, tracking number and tracking link. Later tracking corrections update the page but do not re-send the email. The email is best-effort; the inbox is the durable record. No native iOS project was found or changed; this implementation is the existing web flow. There are no marketplace transfers, multi-brand carts, catalog changes, or changes to recommendation behavior.

For a physical product with no size or pack options, a catalog price containing only one dollar amount (such as `$98`) can supply the checkout item price. Checkout adds the 10% service fee. A confirmed price entered by an administrator always takes priority. Ranges, descriptions such as `$8 for 18`, and products with options still need a confirmed price for the exact item. The existing Always price remains unchanged. No direct Always fulfillment agreement was found. Live Stripe mode is separately gated and remains off until the production setup is complete.

## Setup for a connected test

1. Use a test deployment and the correct Supabase project. The active Ayna project was inspected before applying the pilot tables; the connected Supabase plugin showed a different inactive project.
2. Apply `supabase/pilot_orders.sql` after `product_catalog.sql`, then `supabase/pilot_prices.sql` and `supabase/pilot_requests.sql`. Confirm the existing catalog is present. Do not seed the whole catalog over production just for this pilot. A missing product fails closed.
3. At `/pilot/admin`, set the confirmed price and HTTPS link for products with options or unclear catalog prices. A single exact catalog dollar amount for a product without options is used when no admin price is set. In test mode, unpriced options still accept requests without charging. Checkout adds the configured service fee and locks the total into each paid order.
4. Configure server environment variables below. Frontend Supabase settings must point to the same project as the server.
5. Register `/api/pilot-webhook` in Stripe test mode for `checkout.session.completed` (and optionally `checkout.session.async_payment_succeeded`). Set the signing secret from that endpoint. Local Stripe CLI forwarding uses its own signing secret.
6. Deploy to a test URL or use a Vercel-compatible local server for the API routes. Plain `npm run dev` only serves the frontend and cannot run payment routes. Set `PILOT_CHECKOUT_ENABLED=true` last.
7. Sign into ayna and open the Always page. Click **Buy on ayna — test**. Complete checkout with Stripe's test card `4242 4242 4242 4242`, a future expiry and test shipping details. No real card data is needed.
8. Confirm `/pilot/orders` changes from pending to paid. Open `/pilot/admin` as an allowlisted user, confirm the shipping details and vendor label, and save test tracking. Confirm it appears in the customer's order page. Replay the webhook: it must not duplicate fulfillment or clear tracking. Use a second customer account to verify order isolation.

## Environment variables

| Variable | Value/purpose |
|---|---|
| `PILOT_CHECKOUT_ENABLED` | `false` by default; `true` enables the test button and endpoint |
| `PILOT_PAYMENT_MODE` | `test` by default; `live` requires a separate production switch and live Stripe credentials |
| `PILOT_LIVE_ENABLED` | `false` by default; must be `true` for live mode on a production deployment with a custom HTTPS origin |
| `PILOT_PRODUCT_ID` | `p-always-infinity` (legacy default for requests without a product ID) |
| `PILOT_APP_URL` | Exact test deployment origin; local default `http://localhost:3000` |
| `PILOT_VENDOR_NAME` | Explicit test fulfillment destination label; does not establish a brand partnership |
| `PILOT_ADMIN_USER_IDS` | Comma-separated Supabase user UUIDs; at least one required |
| `PILOT_SERVICE_FEE_PERCENT` | Optional. ayna service fee as its own checkout line, % of product price. Default 10; 0 turns it off; max 30 |
| `PILOT_NOTIFY_EMAILS` | Optional. Who gets the new-order email; defaults to ameera@, puloma@, eliz@aynahealth.co |
| `STRIPE_SECRET_KEY` | Server-only `sk_test_...`; live keys rejected |
| `STRIPE_WEBHOOK_SECRET` | Server-only `whsec_...` for the test webhook endpoint |
| `SUPABASE_URL` | Existing server Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Existing server-only service role credential |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Existing client authentication settings |

No Stripe publishable key is needed for hosted Checkout. Never put secret/service-role keys in a `VITE_` variable. Existing Upstash settings make the shared rate limiter durable; without them, this small test pilot inherits the existing in-memory limiter fallback.

## Schema and security

- `pilot_orders`: authenticated owner, browser attempt UUID, existing product ID, immutable purchase snapshot, price reference and Stripe Session IDs, pending/paid status.
- `pilot_product_prices`: server-only retailer price and link set by an allowlisted admin. The public test button shows the full total before Checkout.
- `pilot_fulfillments`: one record per paid order, vendor label, shipping/email details, tracking and administrator ID.
- `pilot_record_payment(...)`: service-role-only, security-invoker function; locks the order, validates owner/amount/currency/session, and writes payment and fulfillment together. Repeated delivery returns without altering tracking.
- All pilot tables enable RLS. Authenticated customers can only SELECT their own orders and fulfillment; they cannot read the pricing settings or insert/update payment/fulfillment records. Anonymous access is revoked. Admin access is enforced by a server-side UUID allowlist; user-editable metadata is not trusted.
- A browser redirect never marks an order paid. Webhooks verify the raw-body signature, reject live events, and return an error on database failure so Stripe retries.
- Retries reuse the existing Stripe Session. Attempts older than 23 hours require a new attempt rather than reusing an expired Stripe idempotency key.

## Changed files

- `api/_pilot.js`: configuration, test-mode enforcement, auth, tracking validation, settlement.
- `api/pilot-checkout.js`: single-product, server-priced Checkout.
- `api/pilot-webhook.js`: signed payment event handling.
- `api/pilot-orders.js`: customer/admin reads and admin tracking updates.
- `src/components/PilotBuyButton.jsx`: product-page test purchase action.
- `src/components/PilotOrders.jsx`, `PilotOrders.css`: order status and fulfillment inbox.
- `src/components/ProductModal.jsx`, `src/main.jsx`: narrowly scoped integration points.
- `supabase/pilot_orders.sql`: tables, permissions, RLS and atomic payment function.
- `api/pilot.test.js`, `api/pilot-access.test.js`, `scripts/test-pilot-db.mjs`: payment/security tests.
- `.env.example`, `package.json`, `package-lock.json`: setup and pinned Stripe/PGlite dependencies.

Pre-existing edits in App, AuthGate, MyEcosystem and recommendationEngine were preserved and are not included in the pilot patch.

## Verification and remaining limits

Passed: production build; focused payment and request tests; lint for the new API/UI files; catalog export check; actual PostgreSQL-WASM schema/transaction/RLS tests using PGlite. Database tests cover repeat schema apply, mismatched payment rollback, duplicate webhook handling, retained tracking, owner access, cross-user isolation, and refused client writes/RPC calls.

Reproduce with `npx vitest run api/pilot.test.js api/pilot-access.test.js src/components/ProductModal.safetyAlert.test.js`, `node scripts/test-pilot-db.mjs`, `npm run build`, and `npm run catalog:check` after installing dependencies.

The active hosted Ayna database has the pilot pricing and request tables. The Vercel preview returns the confirmed Always test total. A signed-in customer payment, webhook, admin fulfillment, request email, and customer tracking email still need an end-to-end test. The production website has not been published with this branch, and no real order was placed.

Pending includes cancelled/abandoned checkouts; this pilot does not implement expiration/refund lifecycle reconciliation. Refunds in the Stripe dashboard are not yet reflected in order status. The admin inbox shows the most recent 50 paid orders. Shipping charges/tax are not calculated in this test implementation.

## Before a real order

First complete the connected test above. Then confirm each exact SKU/pack, inventory, shipping cost, tax handling, returns and customer support. Add refund/cancellation reconciliation and production rate limiting before enabling live mode. Live mode requires `PILOT_PAYMENT_MODE=live`, `PILOT_LIVE_ENABLED=true`, a production Vercel deployment with a custom HTTPS `PILOT_APP_URL`, and live Stripe secret and webhook credentials. Products without an exact catalog dollar amount or confirmed admin price remain unavailable for live checkout. A live key alone fails. Agree a real fulfillment destination before any vendor notification or real shipment.

Implementation references: [Stripe webhook signature verification](https://docs.stripe.com/webhooks/signature), [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).
