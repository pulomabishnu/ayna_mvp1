-- PR haul reward pool for the free product campaign (22 products, 24 units).
-- Source: the ayna_pr_haul Google Sheet (photos and links are the sheet's own).
-- Reward-only items: they are not added to product_catalog, never show in Shop,
-- and carry no health or efficacy claims (name, brand, size, photo, link only).
--
-- Run after supabase/migrations/20261015120000_free_product_campaign.sql.
-- Safe to re-run: units are updated, already-claimed counts are kept, and the
-- database refuses a total below what has already been claimed.
-- Still to identify (not added yet): 'Rouge Essence' eau de parfum, pink box
-- (possibly red wine skincare), pink patterned cylinder, orange 'Brightening
-- Vitamin C Serum' box, small bottle with blue label, green box with LED display.

with items (name, brand, size, category, image_url, product_url, units) as (
  values
  ('Moisturizing Barrier Cream', 'Kieró', '1.76 oz (50 g)', 'skincare', 'https://m.media-amazon.com/images/I/41vDShxlGZL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0FRMRCRBP', 2),
  ('Refining Enzyme Cleanser', 'Kieró', '1.76 oz (50 g)', 'skincare', 'https://m.media-amazon.com/images/I/41E-3zetegL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0FRMDSSY6', 1),
  ('Prime Sun Gel SPF 40', 'Kieró', '1.69 fl oz (50 ml)', 'sun care', 'https://m.media-amazon.com/images/I/51WPZ68tY9L._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0HBVTHQDG', 1),
  ('Airy Sun Stick SPF 50', 'Kieró', '0.7 oz (20 g)', 'sun care', 'https://m.media-amazon.com/images/I/510gehXK8sL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0HBVSP2QH', 1),
  ('Pure Radiant Eye Cream', 'Kieró', '0.85 fl oz (25 ml)', 'skincare', 'https://m.media-amazon.com/images/I/41GVGotHmbL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0FRMQZRF3', 1),
  ('Balance Toner Pads', 'Kieró', '60 pads / 6.26 fl oz', 'skincare', 'https://m.media-amazon.com/images/I/61+AE4eQd+L._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0FRM64YB5', 2),
  ('Comfort Cleansing Balm', 'Kieró', '2.82 oz (80 g)', 'skincare', 'https://m.media-amazon.com/images/I/41r+dQ7-SPL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0FRMXWM2M', 1),
  ('Mighty Patch Original', 'Hero Cosmetics', '36 patches', 'skincare', 'https://m.media-amazon.com/images/I/61p+1+md+8L._AC_SL500_.jpg', 'https://www.amazon.com/dp/B074PVTPBW', 1),
  ('Pimple Correct Acne Clearing Gel Pen', 'Hero Cosmetics', '0.34 fl oz (10 ml)', 'skincare', 'https://m.media-amazon.com/images/I/61Le1S+bw0L._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0G2DTH1GQ', 1),
  ('Mighty Cleanser', 'Hero Cosmetics', '5.07 fl oz (150 ml)', 'skincare', 'https://m.media-amazon.com/images/I/6140V0SQHdL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0H1NP4L26', 1),
  ('SPF 30 Mineral Sunscreen Facial Serum', 'TruSkin', '1 fl oz (30 ml)', 'sun care', 'https://m.media-amazon.com/images/I/61s72NcqCgL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0DX4M3GDJ', 1),
  ('Vitamin C Facial Serum', 'TruSkin', '1 fl oz (30 ml)', 'skincare', 'https://m.media-amazon.com/images/I/61kOfe19nbL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B01EKUBU5Y', 1),
  ('Très Sleek Grande Titanium Wide Plate Flat Iron', 'FoxyBae', '1.75" plates', 'hair', 'https://cdn.shopify.com/s/files/1/1518/3834/files/FOX_WhiteRainbow_1_1c62b234-ad94-4e51-97e3-c2b10269bb64.jpg?v=1784571584', 'https://www.foxybae.com/products/rose-gold-titanium-1-75-wide-plate-flat-iron?variant=51121030889508', 1),
  ('Glycolic Acid Facial Polish Pads', 'Marée', '50 pads', 'skincare', 'https://m.media-amazon.com/images/I/81PMttir3EL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0FNRS2FB7', 1),
  ('Retino Tightening HPR Retinoid Ampoule', 'Dr.Oracle', '1 fl oz (30 ml)', 'skincare', 'https://m.media-amazon.com/images/I/51VZtJFLGaL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0CQMR3QBS', 1),
  ('Cyperus Rotundus Oil', 'Caramela Beauty', '2 fl oz (60 ml)', 'body', 'https://m.media-amazon.com/images/I/71X1UFEVRjL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0DRF1FYB6', 1),
  ('Vegan Kombucha Tea Essence', 'Dr.Ceuracle', '5.07 fl oz (150 ml)', 'skincare', 'https://m.media-amazon.com/images/I/61UHsNDRDBL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B08Y5XGM3Z', 1),
  ('Even Clearer Max Complexion Correction Pads', 'Peter Thomas Roth', '60 pads', 'skincare', 'https://cdn.shopify.com/s/files/1/0852/5650/3608/files/01_21-11-512_EvenClearer_Max_Pads_Closed_NoRef_300dpi_GREY_2000x2000_e8d38d5e-3b5c-4557-879a-d6d13953c022.jpg?width=500', 'https://www.peterthomasroth.com/products/goodbye-acne-max-complexion-correction-pads-2111512', 1),
  ('Aloe Vera Gel', 'Aloderma', '10.6 oz (300 g)', 'skincare', 'https://m.media-amazon.com/images/I/81V93GE4I0L._AC_SL500_.jpg', 'https://www.amazon.com/dp/B097CGDN7J', 1),
  ('Redness Corrector', 'Kind Science', '1.7 fl oz (50 ml)', 'skincare', 'https://m.media-amazon.com/images/I/71ByaOx+SHL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0HFTXFM26', 1),
  ('COOL DOWN Slushy Spray', 'glowbeast', '1.69 fl oz (50 ml)', 'skincare', 'https://m.media-amazon.com/images/I/719jkB8BPGL._AC_SL500_.jpg', 'https://www.amazon.com/dp/B0H5QFQNWM', 1),
  ('Strawberry Blossoms Smoothing Body Scrub', 'Truly', null, 'body', 'https://cdn.shopify.com/s/files/1/0053/4462/4675/files/StrawberryBlossoms_ExfoliatingBodyScrub_pink_V4.jpg?width=500', 'https://www.trulybeauty.com/products/strawberry-blossoms-exfoliating-body-scrub', 1)
),
updated as (
  update public.reward_products rp
     set size = i.size, category = i.category, image_url = i.image_url, product_url = i.product_url,
         inventory_total = greatest(i.units, rp.inventory_claimed), updated_at = now()
    from items i
   where rp.campaign_id = 'free-product-2026' and rp.product_id is null
     and lower(rp.brand) = lower(i.brand) and lower(rp.name) = lower(i.name)
  returning rp.id
)
insert into public.reward_products (campaign_id, name, brand, size, category, image_url, product_url, inventory_total)
select 'free-product-2026', i.name, i.brand, i.size, i.category, i.image_url, i.product_url, i.units
from items i
where not exists (
  select 1 from public.reward_products rp
  where rp.campaign_id = 'free-product-2026' and rp.product_id is null
    and lower(rp.brand) = lower(i.brand) and lower(rp.name) = lower(i.name)
);

select count(*) as products, sum(inventory_total) as units
from public.reward_products where campaign_id = 'free-product-2026' and product_id is null;
