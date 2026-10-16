-- Behaviour checks for commerce_engine.sql. Run against a throwaway database
-- after product_catalog.sql, its seed, and commerce_engine.sql (see
-- scripts/test-commerce-migration.sh). Every block must raise where noted.
\set ON_ERROR_STOP 1

do $$
declare pid text; amazon_offer uuid; brand_offer uuid; ok boolean;
begin
  select id into pid from public.product_catalog limit 1;
  if pid is null then raise exception 'FAIL: no seeded product'; end if;

  -- 1. An Amazon offer cannot be managed checkout.
  ok := false;
  begin
    insert into public.commerce_offers(product_id, provider, commerce_method, payment_provider, managed_checkout_allowed)
      values (pid, 'amazon_associates', 'managed_checkout', 'stripe', true);
  exception when check_violation then ok := true;
  end;
  if not ok then raise exception 'FAIL: Amazon managed checkout was accepted'; end if;

  -- 2. An Amazon offer cannot be manually fulfilled even with redirect method.
  ok := false;
  begin
    insert into public.commerce_offers(product_id, provider, commerce_method, manual_fulfillment_allowed)
      values (pid, 'amazon_associates', 'affiliate_redirect', true);
  exception when check_violation then ok := true;
  end;
  if not ok then raise exception 'FAIL: Amazon manual fulfilment was accepted'; end if;

  -- 3. An Amazon price must come from Creators API.
  ok := false;
  begin
    insert into public.commerce_offers(product_id, provider, commerce_method, currency, current_price_cents, price_source)
      values (pid, 'amazon_associates', 'affiliate_redirect', 'USD', 1999, 'legacy_import');
  exception when check_violation then ok := true;
  end;
  if not ok then raise exception 'FAIL: legacy Amazon price was accepted'; end if;

  -- 4. Valid Amazon redirect offer is accepted.
  insert into public.commerce_offers(product_id, provider, commerce_method, asin, affiliate_redirect)
    values (pid, 'amazon_associates', 'affiliate_redirect', 'B000000001', true) returning id into amazon_offer;

  -- 5. A price needs a currency.
  ok := false;
  begin
    insert into public.commerce_offers(product_id, provider, commerce_method, current_price_cents, price_source)
      values (pid, 'brand_direct', 'external_redirect', 2400, 'merchant_feed');
  exception when check_violation then ok := true;
  end;
  if not ok then raise exception 'FAIL: price without currency was accepted'; end if;

  -- 6. Negative price rejected.
  ok := false;
  begin
    insert into public.commerce_offers(product_id, provider, commerce_method, currency, current_price_cents)
      values (pid, 'brand_direct', 'external_redirect', 'USD', -1);
  exception when check_violation then ok := true;
  end;
  if not ok then raise exception 'FAIL: negative price was accepted'; end if;

  insert into public.commerce_offers(product_id, provider, commerce_method, currency, current_price_cents, price_source)
    values (pid, 'brand_direct', 'external_redirect', 'USD', 2400, 'merchant_feed') returning id into brand_offer;

  -- 7. A variant must belong to its offer's product.
  ok := false;
  begin
    insert into public.commerce_variants(offer_id, product_id, ayna_variant_id) values (brand_offer, pid || '-not-this', 'v1');
  exception when others then ok := true;
  end;
  if not ok then raise exception 'FAIL: variant on another product was accepted'; end if;

  -- 8. Amazon variant prices: Creators API only; no Amazon images stored.
  ok := false;
  begin
    insert into public.commerce_variants(offer_id, product_id, ayna_variant_id, currency, current_price_cents, price_source)
      values (amazon_offer, pid, 'v1', 'USD', 1500, 'manual_verification');
  exception when others then ok := true;
  end;
  if not ok then raise exception 'FAIL: non-API Amazon variant price was accepted'; end if;
  ok := false;
  begin
    insert into public.commerce_variants(offer_id, product_id, ayna_variant_id, image_url) values (amazon_offer, pid, 'v2', 'https://m.media-amazon.com/images/I/x.jpg');
  exception when others then ok := true;
  end;
  if not ok then raise exception 'FAIL: Amazon image on a variant was accepted'; end if;

  -- 9. No Amazon price history in the audit log.
  ok := false;
  begin
    insert into public.commerce_audit_log(product_id, provider, old_price_cents, new_price_cents, check_source) values (pid, 'amazon_associates', 1000, 1200, 'test');
  exception when check_violation then ok := true;
  end;
  if not ok then raise exception 'FAIL: Amazon price history was accepted'; end if;
  insert into public.commerce_audit_log(product_id, provider, price_changed, check_source) values (pid, 'amazon_associates', true, 'test');

  -- 10. Provider events are unique.
  insert into public.commerce_provider_events(provider, event_id, event_type) values ('stripe', 'evt_1', 'payment_intent.amount_capturable_updated');
  ok := false;
  begin
    insert into public.commerce_provider_events(provider, event_id, event_type) values ('stripe', 'evt_1', 'payment_intent.amount_capturable_updated');
  exception when unique_violation then ok := true;
  end;
  if not ok then raise exception 'FAIL: duplicate provider event was accepted'; end if;

  -- 11. Pilot rails, when the pilot tables exist.
  if to_regclass('public.pilot_product_prices') is not null then
    ok := false;
    begin
      insert into public.pilot_product_prices(product_id, variant_id, amount, retailer_url) values (pid, 'amz', 1999, 'https://www.amazon.com/dp/B000000001?tag=aynahealth-20');
    exception when others then ok := true;
    end;
    if not ok then raise exception 'FAIL: Amazon pilot price was accepted'; end if;
  end if;

  raise notice 'commerce_engine behaviour checks: all passed';
end;
$$;
