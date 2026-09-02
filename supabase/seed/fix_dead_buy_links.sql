-- Fixes confirmed-dead or dangerous Buy Now links, found via a full audit of
-- every product's Buy Now target on 2026-08-24. Each statement touches ONLY
-- the url / where_to_buy column of the one row named — nothing else.
--
-- Most severe: PauseWellAging.com and Maude.com have expired and now
-- redirect elsewhere — PauseWellAging.com currently redirects to an
-- unrelated gambling/betting site. Ayna's own "Buy Now" button was sending
-- users there.

-- Expired domain -> redirects to a betting/gambling site. No other
-- whereToBuy option exists for this product, so Buy Now now shows nothing
-- rather than something actively harmful.
update product_catalog set where_to_buy = '[]'::jsonb
where id = 'p-pause-serum';

-- Expired domain -> now a domain-for-sale parking page. Sephora (already
-- listed second) becomes the only option.
update product_catalog set where_to_buy = '["Sephora"]'::jsonb
where id = 'p-maude-vibe';

-- midihealth.com no longer resolves; joinmidi.com is the brand's real
-- current domain (confirmed via its own image CDN host and page title).
update product_catalog set where_to_buy = '["joinmidi.com"]'::jsonb
where id = 'd-midi-health';

-- The following all have a confirmed-dead per-product url (404, or a
-- redirect to an unrelated/broken page) — cleared so Buy Now falls back to
-- a real retailer search (or the brand's live homepage) instead of a dead
-- link. Never replaced with a guessed URL.
update product_catalog set url = null where id in (
  'disc-biotics-research-biotics-research-women-s-essentials',
  'disc-boody-boody-organic-bamboo-period-underwear',
  'disc-btl-aesthetics-emsella-chair-treatment',
  'disc-centrum-centrum-women-s-multivitamin-tablets',
  'disc-goat-union-goat-union-overnight-brief',
  'disc-innate-response-innate-response-women-s-multivitamin',
  'disc-knix-knix-dreamshorts',
  'disc-lunapads-lunapads-period-underwear',
  'disc-maryruth-organics-maryruth-organics-women-s-multivitamin-liquid',
  'disc-olly-olly-women-s-multi-gummy',
  'disc-ritual-ritual-essential-for-women-50',
  'disc-saalt-saalt-comfort-brief',
  'disc-smartypants-smartypants-women-s-formula-gummy',
  'disc-vitafusion-vitafusion-women-s-multivitamin-gummy',
  'disc-sensatone-sensatone-digital-compact-pelvic-floor-stimulator',
  'p-neycher-botanical-vulva-balm'
);
