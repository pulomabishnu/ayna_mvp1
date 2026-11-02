# Direct checkout MVP (Stripe test mode)

This isolated flow covers one SootheHer catalog item: Gel Pad Refills
(`p-sootheher-gel-pad-refills`). The partner list records SootheHer as signed,
but the repository does not establish direct resale or fulfillment terms.
The migration creates an inactive **test fulfillment** supplier and leaves
checkout disabled. No live payment or supplier order is possible from this code.

## Setup

1. Apply `supabase/migrations/20261102130000_direct_checkout_test.sql` to
   **the Supabase project used by the storefront**, after `product_catalog`
   and its seed exist. Do not apply it to an unrelated connected project.
2. Confirm the SKU, fixed test price ($11.99), and product details. Confirm
   direct fulfillment terms with SootheHer before any real sale. For a fake
   order, use an internal test mailbox and do not send the email to the brand.
3. Configure server environment variables:
   `CHECKOUT_TEST_ENABLED=1`, `STRIPE_CHECKOUT_TEST_KEY` (a restricted
   `rk_test_` key with Checkout Session create/read permissions or a
   `sk_test_` key), `STRIPE_CHECKOUT_WEBHOOK_SECRET`,
   `CHECKOUT_TEST_ORDER_EMAIL` (internal mailbox), `RESEND_API_KEY`, and
   `SITE_URL`. Optional: `CHECKOUT_FROM_EMAIL`.
4. Configure a Stripe **test-mode** webhook for
   `/api/checkout-webhook` with `checkout.session.completed` and
   `checkout.session.async_payment_succeeded`. Use its signing secret.
5. Enable the single test supplier and product in the storefront database:

```sql
update public.checkout_suppliers set active = true
where name = 'SootheHer test fulfillment';
update public.product_catalog set checkout_enabled = true
where id = 'p-sootheher-gel-pad-refills'
  and checkout_supplier_id = (
    select id from public.checkout_suppliers
    where name = 'SootheHer test fulfillment'
  );
```

## Fake order

Sign in on the storefront, open the SootheHer Gel Pad Refills product page,
add it to the ayna test cart, and select **Pay with Stripe test checkout**.
Use Stripe test card `4242 4242 4242 4242`, any future expiry, and any CVC.
Enter a test US shipping address. Stripe returns to the product page; the
verified webhook creates the order and sends the internal mailbox the SKU,
quantity, name, and address. Refresh the product page if the order is still
processing. Recent orders show status and tracking there.

To enter tracking, an account in `ADMIN_EMAILS` sends an authenticated
`POST /api/checkout` request with JSON:

```json
{"action":"tracking","order_id":"<order UUID>","tracking_number":"TEST-12345","tracking_url":"https://example.com/track/TEST-12345"}
```

The bearer token is that admin account's Supabase access token. The customer
can refresh the product page to see **shipped** and the tracking link.

## Manual work and limits

- Ayna must confirm fulfillment terms, SKU, inventory, shipping and returns
  with the partner before taking real orders.
- Supplier notification goes only to the configured internal test mailbox.
  Staff must relay the order, obtain tracking, and enter it via the admin API.
- Shipping and tax are $0 in this test flow. Do not use it for live sales.
- The cart stores only product IDs, display names, quantities, and test prices
  in the browser; the server checks current enabled products and prices before
  creating the Stripe Session.
- No payouts, inventory sync, refunds, customer shipping emails, or partner
  API are included.
