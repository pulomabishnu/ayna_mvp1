# One-product Buy on ayna test pilot

Implemented for the existing Always Infinity FlexFoam record, `p-always-infinity`, at `/product/always-infinity-flexfoam`.

## What is implemented

The existing React 19 / Vite web app uses Vercel API routes and Supabase authentication. The pilot adds a clearly labeled test buy button beside the existing retail link. Signed-in customers go to Stripe hosted Checkout, quantity one, card payment, US shipping address. A verified Stripe webhook atomically marks the order paid and creates a vendor fulfillment inbox record. `/pilot/admin` lets an allowlisted administrator record carrier, tracking number, and optional HTTPS tracking link. `/pilot/orders` shows the customer's own orders and refreshes every ten seconds.

No emails are sent. The durable fulfillment inbox is the admin-visible notification. No native iOS project was found or changed; this implementation is the existing web flow. There are no marketplace transfers, multi-brand carts, catalog changes, or changes to recommendation behavior.

The catalog describes the product as `$8 for 18` and routes it through an affiliate link. This is display text, not an authoritative checkout price. No direct Always fulfillment agreement was found. The test price and fulfillment destination must be configured explicitly. This code rejects live Stripe keys and live webhook events; enabling the feature does not permit real payments.

## Setup for a connected test

1. Use an isolated test deployment and the correct Supabase project. Only an inactive project named `supabase-byzantine-feather` was visible through the connected account; its schema could not be inspected. Inspect your actual hosted schema before applying SQL. The checked-in schema was inspected and the new tables tested locally.
2. Apply `supabase/pilot_orders.sql` after the existing `product_catalog.sql`. Confirm `product_catalog` contains `p-always-infinity` with its existing name. Do not seed the whole catalog over production just for this pilot. A missing product fails closed.
3. In Stripe test mode, create/choose a one-time, active USD Price for the exact product variant/package being tested. Set **Price metadata** `ayna_product_id=p-always-infinity`. Choose the amount explicitly; the app does not invent a price or parse catalog text.
4. Configure server environment variables below. Frontend Supabase settings must point to the same project as the server.
5. Register `/api/pilot-webhook` in Stripe test mode for `checkout.session.completed` (and optionally `checkout.session.async_payment_succeeded`). Set the signing secret from that endpoint. Local Stripe CLI forwarding uses its own signing secret.
6. Deploy to a test URL or use a Vercel-compatible local server for the API routes. Plain `npm run dev` only serves the frontend and cannot run payment routes. Set `PILOT_CHECKOUT_ENABLED=true` last.
7. Sign into ayna and open the Always page. Click **Buy on ayna — test**. Complete checkout with Stripe's test card `4242 4242 4242 4242`, a future expiry and test shipping details. No real card data is needed.
8. Confirm `/pilot/orders` changes from pending to paid. Open `/pilot/admin` as an allowlisted user, confirm the shipping details and vendor label, and save test tracking. Confirm it appears in the customer's order page. Replay the webhook: it must not duplicate fulfillment or clear tracking. Use a second customer account to verify order isolation.

## Environment variables

| Variable | Value/purpose |
|---|---|
| `PILOT_CHECKOUT_ENABLED` | `false` by default; `true` enables the test button and endpoint |
| `PILOT_PRODUCT_ID` | `p-always-infinity` (default and selected existing record) |
| `PILOT_APP_URL` | Exact test deployment origin; local default `http://localhost:3000` |
| `PILOT_STRIPE_PRICE_ID` | Active one-time USD test `price_...`, with matching metadata |
| `PILOT_VENDOR_NAME` | Explicit test fulfillment destination label; does not establish a brand partnership |
| `PILOT_ADMIN_USER_IDS` | Comma-separated Supabase user UUIDs; at least one required |
| `STRIPE_SECRET_KEY` | Server-only `sk_test_...`; live keys rejected |
| `STRIPE_WEBHOOK_SECRET` | Server-only `whsec_...` for the test webhook endpoint |
| `SUPABASE_URL` | Existing server Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Existing server-only service role credential |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Existing client authentication settings |

No Stripe publishable key is needed for hosted Checkout. Never put secret/service-role keys in a `VITE_` variable. Existing Upstash settings make the shared rate limiter durable; without them, this small test pilot inherits the existing in-memory limiter fallback.

## Schema and security

- `pilot_orders`: authenticated owner, browser attempt UUID, existing product ID, immutable purchase snapshot, Stripe Price and Session IDs, pending/paid status.
- `pilot_fulfillments`: one record per paid order, vendor label, shipping/email details, tracking and administrator ID.
- `pilot_record_payment(...)`: service-role-only, security-invoker function; locks the order, validates owner/amount/currency/session, and writes payment and fulfillment together. Repeated delivery returns without altering tracking.
- Both tables enable RLS. Authenticated customers can only SELECT their own rows; they cannot insert or update payment/fulfillment records. Anonymous access is revoked. Admin access is enforced by a server-side UUID allowlist; user-editable metadata is not trusted.
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

Passed: production build; 20 focused tests including existing product safety tests; lint for the new API/UI files; catalog export check (189 products, no duplicate IDs or lossy conversions); actual PostgreSQL-WASM schema/transaction/RLS tests using PGlite. Database tests cover repeat schema apply, mismatched payment rollback, duplicate webhook handling, retained tracking, owner access, cross-user isolation, and refused client writes/RPC calls.

Reproduce with `npx vitest run api/pilot.test.js api/pilot-access.test.js src/components/ProductModal.safetyAlert.test.js`, `node scripts/test-pilot-db.mjs`, `npm run build`, and `npm run catalog:check` after installing dependencies.

Browser checks confirmed the existing Always page and signed-out order page render without uncaught browser errors. A mocked enablement response also verified the test buy button appears for the selected product. The actual Stripe checkout, signed-in customer/admin interaction, and hosted Supabase webhook flow remain unverified because no matching database/Stripe test credentials were available. No hosted database was changed, no deployment was published and no real order was placed.

Pending includes cancelled/abandoned checkouts; this pilot does not implement expiration/refund lifecycle reconciliation. Refunds in the Stripe dashboard are not yet reflected in order status. The admin inbox shows the most recent 50 paid orders, sufficient for the one-product pilot. Shipping charges/tax are not calculated in this test implementation.

## Before a real order

First complete the connected test above. Then confirm a direct fulfillment arrangement (or choose an existing contracted partner), exact SKU/pack, authoritative price, inventory, shipping cost, tax handling, returns and customer support. Add refund/cancellation reconciliation and production rate limiting, then deliberately implement/review live-mode support. Swapping in a live key will currently fail by design. Agree a real fulfillment destination before any vendor notification or real shipment.

Implementation references: [Stripe webhook signature verification](https://docs.stripe.com/webhooks/signature), [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).
